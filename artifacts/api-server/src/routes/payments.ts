import { Router, IRouter } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, videoAccessTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { InitiatePaymentBody, GetPaymentStatusParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { paymentInitiateLimiter } from "../middlewares/rateLimiter";

const router: IRouter = Router();

// Simulated payment - in production, integrate with real YooKassa SDK
router.post("/payments/initiate", requireAuth, paymentInitiateLimiter, async (req, res): Promise<void> => {
  const parsed = InitiatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { orderId, method } = parsed.data;

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, req.user!.userId)));
  if (!order) { res.status(404).json({ error: "Заказ не найден" }); return; }
  if (order.status === "paid") { res.status(400).json({ error: "Заказ уже оплачен" }); return; }

  // Simulate payment ID and URL
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const confirmationUrl = `/payment-success?orderId=${orderId}&paymentId=${paymentId}`;

  await db
    .update(ordersTable)
    .set({ paymentMethod: method, paymentId })
    .where(eq(ordersTable.id, orderId));

  req.log.info({ orderId, method, paymentId }, "Payment initiated");

  res.json({
    orderId,
    paymentId,
    confirmationUrl,
    status: "pending",
  });
});

// Webhook from payment provider
router.post("/payments/webhook", optionalAuth, async (req, res): Promise<void> => {
  const body = req.body as { type?: string; object?: { id?: string; status?: string } };
  req.log.info({ body }, "Payment webhook received");

  if (body?.type === "payment.succeeded" && body.object?.id) {
    const paymentId = body.object.id;
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.paymentId, paymentId));
    if (order) {
      await db.update(ordersTable).set({ status: "paid" }).where(eq(ordersTable.id, order.id));
      // Grant video access
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
      if (items.length > 0) {
        await db.insert(videoAccessTable).values(
          items.map(item => ({
            userId: order.userId,
            videoId: item.videoId,
            orderId: order.id,
          }))
        ).onConflictDoNothing();
      }
      // Clear cart
      await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, order.userId));
    }
  }

  res.json({ success: true, message: null });
});

// Simulate payment completion (for demo - called from frontend)
router.post("/payments/complete-demo", requireAuth, async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Этот метод недоступен в production" });
    return;
  }

  const { orderId } = req.body as { orderId?: number };
  if (!orderId) { res.status(400).json({ error: "orderId required" }); return; }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, req.user!.userId)));
  if (!order) { res.status(404).json({ error: "Заказ не найден" }); return; }

  await db.update(ordersTable).set({ status: "paid" }).where(eq(ordersTable.id, orderId));
  
  // Grant video access
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  if (items.length > 0) {
    await db.insert(videoAccessTable).values(
      items.map(item => ({
        userId: req.user!.userId,
        videoId: item.videoId,
        orderId: orderId,
      }))
    ).onConflictDoNothing();
  }
  
  // Clear cart
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.userId));

  res.json({ success: true, message: "Оплата успешна" });
});

router.get("/payments/:orderId/status", requireAuth, async (req, res): Promise<void> => {
  const params = GetPaymentStatusParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, params.data.orderId), eq(ordersTable.userId, req.user!.userId)));
  if (!order) { res.status(404).json({ error: "Заказ не найден" }); return; }
  res.json({
    orderId: order.id,
    status: order.status,
    paymentId: order.paymentId ?? null,
  });
});

export default router;
