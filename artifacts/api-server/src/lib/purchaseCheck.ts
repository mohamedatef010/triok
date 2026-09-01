import { db, ordersTable, orderItemsTable, videoAccessTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

/**
 * Strictly verifies whether a user has officially purchased and paid for a video.
 * Returns true ONLY if:
 * 1. An explicit record exists in videoAccessTable (granted upon order payment/fulfillment), OR
 * 2. An order exists with status = 'paid' containing this video.
 */
export async function checkUserPurchasedVideo(userId: number | undefined | null, videoId: number): Promise<boolean> {
  if (!userId || !videoId) return false;

  // 1. Check video_access table (direct lookup)
  const [access] = await db
    .select({ id: videoAccessTable.id })
    .from(videoAccessTable)
    .where(
      and(
        eq(videoAccessTable.userId, userId),
        eq(videoAccessTable.videoId, videoId)
      )
    )
    .limit(1);

  if (access) return true;

  // 2. Check orders table with status = 'paid'
  const [paidOrder] = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .innerJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(
      and(
        eq(ordersTable.userId, userId),
        eq(ordersTable.status, "paid"),
        eq(orderItemsTable.videoId, videoId)
      )
    )
    .limit(1);

  return !!paidOrder;
}

/**
 * Returns a Set of all video IDs that the user has officially purchased and paid for.
 */
export async function getUserPurchasedVideoIds(userId: number | undefined | null): Promise<Set<number>> {
  const set = new Set<number>();
  if (!userId) return set;

  const [accessList, paidOrders] = await Promise.all([
    db
      .select({ videoId: videoAccessTable.videoId })
      .from(videoAccessTable)
      .where(eq(videoAccessTable.userId, userId)),
    db
      .select({ videoId: orderItemsTable.videoId })
      .from(ordersTable)
      .innerJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
      .where(
        and(
          eq(ordersTable.userId, userId),
          eq(ordersTable.status, "paid")
        )
      ),
  ]);

  accessList.forEach((a) => set.add(a.videoId));
  paidOrders.forEach((o) => set.add(o.videoId));
  return set;
}
