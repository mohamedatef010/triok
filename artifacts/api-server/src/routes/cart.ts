import { Router, IRouter } from "express";
import { db, cartItemsTable, videosTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { AddToCartBody, RemoveFromCartParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function getCartForUser(userId: number) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.userId, userId));

  const videoIds = items.map((i) => i.videoId);
  const videos = videoIds.length
    ? await db.select().from(videosTable).where((t) =>
        videoIds.map((id) => eq(t.id, id)).reduce((a, b) => ({ ...a, [Symbol()]: b }) as any)
      )
    : [];

  // Simpler approach: fetch individually
  const cartRows = await Promise.all(
    items.map(async (item) => {
      const [video] = await db.select().from(videosTable).where(eq(videosTable.id, item.videoId));
      if (!video) return null;
      return {
        videoId: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl ?? "",
        price: Number(video.price),
        discountPrice: video.discountPrice != null ? Number(video.discountPrice) : null,
      };
    })
  );

  const filtered = cartRows.filter(Boolean) as NonNullable<typeof cartRows[number]>[];
  const total = filtered.reduce((s, i) => s + (i.discountPrice ?? i.price), 0);
  return { items: filtered, total: Math.round(total * 100) / 100 };
}

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  res.json(await getCartForUser(req.user!.userId));
});

router.delete("/cart", requireAuth, async (req, res): Promise<void> => {
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.userId));
  res.json({ success: true, message: "Корзина очищена" });
});

router.post("/cart/items", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const userId = req.user!.userId;
  const videoId = parsed.data.videoId;

  try {
    const existing = await db
      .select()
      .from(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.videoId, videoId)));

    if (existing.length === 0) {
      await db
        .insert(cartItemsTable)
        .values({ userId, videoId })
        .onConflictDoNothing();
    }

    const cart = await getCartForUser(userId);
    res.status(201).json(cart);
  } catch (error) {
    req.log.error({ error }, "Error adding item to cart");
    res.status(500).json({ error: "Не удалось добавить товар в корзину" });
  }
});

router.delete("/cart/items/:videoId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveFromCartParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db
    .delete(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, req.user!.userId), eq(cartItemsTable.videoId, params.data.videoId)));
  res.json(await getCartForUser(req.user!.userId));
});

export default router;
