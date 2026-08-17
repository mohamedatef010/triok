import { Router, IRouter } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, videoAccessTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { InitiatePaymentBody, GetPaymentStatusParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { paymentInitiateLimiter } from "../middlewares/rateLimiter";
import { createYooKassaPayment, getYooKassaPayment } from "../lib/yookassa";
import { fulfillOrder } from "../lib/orderFulfillment";

const router: IRouter = Router();

// Initiate real payment with YooKassa (ЮKassa API v3)
router.post("/payments/initiate", requireAuth, paymentInitiateLimiter, async (req, res): Promise<void> => {
  const parsed = InitiatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { orderId, method } = parsed.data;

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, req.user!.userId)));

  if (!order) {
    res.status(404).json({ error: "Заказ не найден" });
    return;
  }
  if (order.status === "paid") {
    res.status(400).json({ error: "Заказ уже оплачен" });
    return;
  }

  try {
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const returnUrl = `${frontendUrl.replace(/\/$/, "")}/payment/${order.id}`;

    // Create payment session via official YooKassa API v3
    const yooPayment = await createYooKassaPayment({
      orderId: order.id,
      userId: req.user!.userId,
      amount: order.total,
      description: `Оплата заказа #${order.id}`,
      returnUrl,
      method,
    });

    await db
      .update(ordersTable)
      .set({ paymentMethod: method, paymentId: yooPayment.paymentId })
      .where(eq(ordersTable.id, orderId));

    req.log.info({ orderId, method, paymentId: yooPayment.paymentId, confirmationUrl: yooPayment.confirmationUrl }, "YooKassa payment initiated");

    res.json({
      orderId,
      paymentId: yooPayment.paymentId,
      confirmationUrl: yooPayment.confirmationUrl,
      status: yooPayment.status || "pending",
    });
  } catch (err: any) {
    req.log.error({ err, orderId, method }, "Failed to initiate YooKassa payment");
    res.status(500).json({ error: err.message || "Ошибка инициализации платежа в ЮKassa" });
  }
});

// Webhook notification from YooKassa
router.post("/payments/webhook", async (req, res): Promise<void> => {
  const body = req.body as {
    type?: string;
    event?: string;
    object?: {
      id?: string;
      status?: string;
      paid?: boolean;
      amount?: {
        value?: string;
        currency?: string;
      };
      metadata?: {
        orderId?: string;
        userId?: string;
      };
      payment_method?: {
        type?: string;
      };
    };
  };

  const eventType = body?.event || body?.type;
  const paymentObj = body?.object;
  const paymentId = paymentObj?.id;

  req.log.info({ event: eventType, objectId: paymentId, status: paymentObj?.status }, "Payment webhook received from YooKassa");

  if (paymentId) {
    try {
      // Find the order by metadata.orderId or paymentId
      let orderToFulfill = null;
      if (paymentObj.metadata?.orderId) {
        const orderIdNum = parseInt(paymentObj.metadata.orderId, 10);
        if (!isNaN(orderIdNum)) {
          const [ord] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderIdNum));
          orderToFulfill = ord;
        }
      }

      if (!orderToFulfill) {
        const [ord] = await db.select().from(ordersTable).where(eq(ordersTable.paymentId, paymentId));
        orderToFulfill = ord;
      }

      if (orderToFulfill) {
        // Authenticate directly with YooKassa API to verify authenticity of this event
        const verifiedPayment = await getYooKassaPayment(paymentId);
        if (verifiedPayment) {
          const isSucceeded = verifiedPayment.status === "succeeded" || verifiedPayment.paid === true;
          const isCanceled = verifiedPayment.status === "canceled";

          if (isSucceeded) {
            // Verify payment amount matches order total (within small rounding delta)
            const paidAmount = parseFloat(verifiedPayment.amount?.value || "0");
            const orderTotal = parseFloat(orderToFulfill.total || "0");

            if (Math.abs(paidAmount - orderTotal) <= 0.05 || paidAmount >= orderTotal) {
              await fulfillOrder(
                orderToFulfill.id,
                paymentId,
                paymentObj.payment_method?.type || orderToFulfill.paymentMethod || undefined
              );
              req.log.info({ orderId: orderToFulfill.id, paymentId }, "Order successfully fulfilled via verified YooKassa webhook");
            } else {
              req.log.error(
                { orderId: orderToFulfill.id, paidAmount, orderTotal, paymentId },
                "SECURITY WARNING: Webhook payment amount does not match order total!"
              );
            }
          } else if (isCanceled && orderToFulfill.status === "pending") {
            await db.update(ordersTable).set({ status: "cancelled" }).where(eq(ordersTable.id, orderToFulfill.id));
            req.log.info({ orderId: orderToFulfill.id, paymentId }, "Order cancelled via verified YooKassa webhook");
          }
        } else {
          req.log.warn({ paymentId }, "Could not verify payment directly with YooKassa API");
        }
      } else {
        req.log.warn({ paymentId, metadata: paymentObj.metadata }, "Order not found for YooKassa webhook");
      }
    } catch (webhookErr) {
      req.log.error({ webhookErr, paymentId }, "Error processing YooKassa webhook");
    }
  }

  // Always acknowledge receipt of webhook to YooKassa with 200 OK
  res.json({ success: true, message: null });
});


// Check payment status with live YooKassa synchronization
router.get("/payments/:orderId/status", requireAuth, async (req, res): Promise<void> => {
  const params = GetPaymentStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, params.data.orderId), eq(ordersTable.userId, req.user!.userId)));

  if (!order) {
    res.status(404).json({ error: "Заказ не найден" });
    return;
  }

  // If order is still pending and has a paymentId, verify real status with YooKassa
  if (order.status === "pending" && order.paymentId) {
    try {
      const yooPayment = await getYooKassaPayment(order.paymentId);
      if (yooPayment) {
        if (yooPayment.status === "succeeded" || yooPayment.paid) {
          await fulfillOrder(order.id, order.paymentId, order.paymentMethod ?? undefined);
          res.json({
            orderId: order.id,
            status: "paid",
            paymentId: order.paymentId,
          });
          return;
        } else if (yooPayment.status === "canceled") {
          await db.update(ordersTable).set({ status: "cancelled" }).where(eq(ordersTable.id, order.id));
          res.json({
            orderId: order.id,
            status: "cancelled",
            paymentId: order.paymentId,
          });
          return;
        }
      }
    } catch (err) {
      req.log.error({ err, orderId: order.id, paymentId: order.paymentId }, "Failed to verify payment status with YooKassa");
    }
  }

  res.json({
    orderId: order.id,
    status: order.status,
    paymentId: order.paymentId ?? null,
  });
});

// Simulate payment completion (for demo/development if needed)
router.post("/payments/complete-demo", requireAuth, async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Этот метод недоступен в production" });
    return;
  }

  const { orderId } = req.body as { orderId?: number };
  if (!orderId) {
    res.status(400).json({ error: "orderId required" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, req.user!.userId)));

  if (!order) {
    res.status(404).json({ error: "Заказ не найден" });
    return;
  }

  await fulfillOrder(orderId, order.paymentId ?? `demo_${Date.now()}`, "demo");

  res.json({ success: true, message: "Оплата успешна" });
});

export default router;
