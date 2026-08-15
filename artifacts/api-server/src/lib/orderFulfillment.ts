import { db, ordersTable, orderItemsTable, cartItemsTable, videoAccessTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export interface FulfillOrderResult {
  success: boolean;
  alreadyPaid?: boolean;
  itemsGranted?: number;
  reason?: string;
}

/**
 * Idempotently fulfills an order upon payment completion:
 * 1. Sets order status to 'paid'
 * 2. Grants access to purchased videos in videoAccessTable
 * 3. Clears the user's cart
 */
export async function fulfillOrder(
  orderId: number,
  paymentId?: string,
  paymentMethod?: string
): Promise<FulfillOrderResult> {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));

  if (!order) {
    logger.warn({ orderId }, "Cannot fulfill order: Order not found");
    return { success: false, reason: "Order not found" };
  }

  if (order.status === "paid") {
    logger.info({ orderId }, "Order is already fulfilled/paid");
    return { success: true, alreadyPaid: true };
  }

  // 1. Update order status to paid
  const updateData: { status: "paid"; paymentId?: string; paymentMethod?: string } = {
    status: "paid",
  };
  if (paymentId) updateData.paymentId = paymentId;
  if (paymentMethod) updateData.paymentMethod = paymentMethod;

  await db
    .update(ordersTable)
    .set(updateData)
    .where(eq(ordersTable.id, orderId));

  // 2. Fetch purchased videos and grant access
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderId));

  if (items.length > 0) {
    await db
      .insert(videoAccessTable)
      .values(
        items.map((item) => ({
          userId: order.userId,
          videoId: item.videoId,
          orderId: order.id,
        }))
      )
      .onConflictDoNothing();
  }

  // 3. Clear the user's cart
  await db
    .delete(cartItemsTable)
    .where(eq(cartItemsTable.userId, order.userId));

  logger.info(
    { orderId, userId: order.userId, itemsCount: items.length, paymentId },
    "Order successfully fulfilled, video access granted, and cart cleared"
  );

  return {
    success: true,
    alreadyPaid: false,
    itemsGranted: items.length,
  };
}
