import { Router, IRouter } from "express";
import { db, favoritesTable, videosTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { AddToFavoritesParams, RemoveFromFavoritesParams } from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/favorites", requireAuth, async (req, res): Promise<void> => {
  const favs = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, req.user!.userId));

  const cats = await db.select().from(categoriesTable);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));

  const rows = await Promise.all(
    favs.map(async (fav) => {
      const [video] = await db.select().from(videosTable).where(eq(videosTable.id, fav.videoId));
      if (!video) return null;
      const [{ avg }] = await db
        .select({ avg: sql<number>`coalesce(avg(rating), 0)::float` })
        .from(reviewsTable)
        .where(eq(reviewsTable.videoId, video.id));
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(reviewsTable)
        .where(eq(reviewsTable.videoId, video.id));
      return {
        id: video.id,
        title: video.title,
        description: video.description ?? null,
        thumbnailUrl: video.thumbnailUrl ?? "",
        videoUrl: video.videoUrl ?? null,
        durationSeconds: video.durationSeconds ?? null,
        price: Number(video.price),
        discountPrice: video.discountPrice != null ? Number(video.discountPrice) : null,
        categoryId: video.categoryId ?? null,
        categoryName: catMap.get(video.categoryId ?? -1) ?? null,
        difficulty: video.difficulty ?? 1,
        viewCount: video.viewCount,
        averageRating: Math.round((avg ?? 0) * 10) / 10,
        reviewCount: count ?? 0,
        isFeatured: video.isFeatured,
        isPublished: video.isPublished,
        createdAt: video.createdAt,
      };
    })
  );

  res.json(rows.filter(Boolean));
});

router.post("/favorites/:videoId", requireAuth, async (req, res): Promise<void> => {
  const params = AddToFavoritesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db
    .insert(favoritesTable)
    .values({ userId: req.user!.userId, videoId: params.data.videoId })
    .onConflictDoNothing();
  res.status(201).json({ success: true, message: null });
});

router.delete("/favorites/:videoId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveFromFavoritesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db
    .delete(favoritesTable)
    .where(and(eq(favoritesTable.userId, req.user!.userId), eq(favoritesTable.videoId, params.data.videoId)));
  res.sendStatus(204);
});

export default router;
