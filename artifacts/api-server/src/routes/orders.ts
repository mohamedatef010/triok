import { Router, IRouter } from "express";
import { db, ordersTable, orderItemsTable, videosTable, cartItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { ListOrdersResponse, CreateOrderBody, GetOrderParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function buildOrderRow(order: typeof ordersTable.$inferSelect) {
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  const itemRows = await Promise.all(
    items.map(async (item) => {
      const [video] = await db.select().from(videosTable).where(eq(videosTable.id, item.videoId));
      return {
        videoId: item.videoId,
        title: video?.title ?? "Видео",
        thumbnailUrl: video?.thumbnailUrl ?? null,
        price: Number(item.price),
      };
    })
  );

  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    total: Number(order.total),
    paymentMethod: order.paymentMethod ?? null,
    paymentId: order.paymentId ?? null,
    items: itemRows,
    createdAt: order.createdAt,
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, req.user!.userId))
    .orderBy(ordersTable.createdAt);
  const rows = await Promise.all(orders.map(buildOrderRow));
  res.json(rows);
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  let videoIds: number[] = [];

  if (parsed.data.fromCart) {
    const cartItems = await db
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.userId, req.user!.userId));
    videoIds = cartItems.map((c) => c.videoId);
  } else if (parsed.data.videoId) {
    videoIds = [parsed.data.videoId];
  }

  if (videoIds.length === 0) {
    res.status(400).json({ error: "Нет товаров для заказа" });
    return;
  }

  const videos = await Promise.all(
    videoIds.map(async (id) => {
      const [v] = await db.select().from(videosTable).where(eq(videosTable.id, id));
      return v;
    })
  );

  const validVideos = videos.filter(Boolean) as (typeof videosTable.$inferSelect)[];
  const total = validVideos.reduce(
    (s, v) => s + (v.discountPrice != null ? Number(v.discountPrice) : Number(v.price)),
    0
  );

  const [order] = await db
    .insert(ordersTable)
    .values({ userId: req.user!.userId, total: String(total), status: "pending" })
    .returning();

  await db.insert(orderItemsTable).values(
    validVideos.map((v) => ({
      orderId: order.id,
      videoId: v.id,
      price: String(v.discountPrice != null ? Number(v.discountPrice) : Number(v.price)),
    }))
  );

  res.status(201).json(await buildOrderRow(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.userId, req.user!.userId)));
  if (!order) { res.status(404).json({ error: "Заказ не найден" }); return; }
  res.json(await buildOrderRow(order));
});

export default router;
