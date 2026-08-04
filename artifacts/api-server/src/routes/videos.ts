import { Router, IRouter } from "express";
import { db, videosTable, categoriesTable, reviewsTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, sql, desc, asc, ilike, and, ne } from "drizzle-orm";
import { optionalAuth, requireAdmin } from "../middlewares/requireAuth";
import {
  ListVideosQueryParams,
  GetVideoParams,
  CreateVideoBody,
  UpdateVideoBody,
  UpdateVideoParams,
  DeleteVideoParams,
  RecordVideoViewParams,
  GetRelatedVideosParams,
  GetSimilarVideosParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildVideoRow(video: typeof videosTable.$inferSelect, catName: string | null, userId?: number) {
  const videoReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.videoId, video.id));
  const avg = videoReviews.length
    ? videoReviews.reduce((s, r) => s + r.rating, 0) / videoReviews.length
    : 0;

  let isPurchased = false;
  if (userId) {
    const [order] = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .innerJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
      .where(
        and(
          eq(ordersTable.userId, userId),
          eq(ordersTable.status, "paid"),
          eq(orderItemsTable.videoId, video.id)
        )
      )
      .limit(1);
    isPurchased = !!order;
  }

  return {
    id: video.id,
    title: video.title,
    description: video.description ?? null,
    thumbnailUrl: video.thumbnailUrl ?? "",
    videoUrl: video.videoUrl ?? null,
    previewVideoUrl: video.previewVideoUrl ?? null,
    durationSeconds: video.durationSeconds ?? null,
    price: Number(video.price),
    discountPrice: video.discountPrice != null ? Number(video.discountPrice) : null,
    categoryId: video.categoryId ?? null,
    categoryName: catName,
    viewCount: video.viewCount,
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: videoReviews.length,
    isFeatured: video.isFeatured,
    isPublished: video.isPublished,
    isPurchased,
    createdAt: video.createdAt,
  };
}

async function buildVideoListRow(video: typeof videosTable.$inferSelect, catName: string | null) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reviewsTable)
    .where(eq(reviewsTable.videoId, video.id));
  const [{ avg }] = await db
    .select({ avg: sql<number>`coalesce(avg(rating), 0)::float` })
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
    categoryName: catName,
    viewCount: video.viewCount,
    averageRating: Math.round((avg ?? 0) * 10) / 10,
    reviewCount: count ?? 0,
    isFeatured: video.isFeatured,
    isPublished: video.isPublished,
    createdAt: video.createdAt,
  };
}

router.get("/videos", optionalAuth, async (req, res): Promise<void> => {
  const parsed = ListVideosQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { categoryId, search, sort, page = 1, limit = 12 } = parsed.data;

  const conditions = [eq(videosTable.isPublished, true)];
  if (categoryId) conditions.push(eq(videosTable.categoryId, categoryId));
  if (search) conditions.push(ilike(videosTable.title, `%${search}%`));

  let orderByCol: Parameters<typeof db.select>[0] extends never ? never : any;
  switch (sort) {
    case "popular": orderByCol = desc(videosTable.viewCount); break;
    case "price_asc": orderByCol = asc(videosTable.price); break;
    case "price_desc": orderByCol = desc(videosTable.price); break;
    default: orderByCol = desc(videosTable.createdAt);
  }

  const offset = ((page ?? 1) - 1) * (limit ?? 12);
  const videos = await db
    .select()
    .from(videosTable)
    .where(and(...conditions))
    .orderBy(orderByCol)
    .limit(limit ?? 12)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(videosTable)
    .where(and(...conditions));

  const cats = await db.select().from(categoriesTable);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));

  const rows = await Promise.all(
    videos.map((v) => buildVideoListRow(v, catMap.get(v.categoryId ?? -1) ?? null))
  );

  res.json({ videos: rows, total: total ?? 0, page: page ?? 1, limit: limit ?? 12 });
});

router.post("/videos", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateVideoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = parsed.data;
  const [video] = await db
    .insert(videosTable)
    .values({
      title: data.title,
      description: data.description ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      videoUrl: data.videoUrl ?? null,
      previewVideoUrl: data.previewVideoUrl ?? null,
      durationSeconds: data.durationSeconds ?? null,
      price: String(data.price),
      discountPrice: data.discountPrice != null ? String(data.discountPrice) : null,
      categoryId: data.categoryId ?? null,
      isFeatured: data.isFeatured ?? false,
      isPublished: data.isPublished ?? true,
    })
    .returning();
  const row = await buildVideoListRow(video, null);
  res.status(201).json(row);
});

router.get("/videos/featured", async (_req, res): Promise<void> => {
  const videos = await db
    .select()
    .from(videosTable)
    .where(and(eq(videosTable.isFeatured, true), eq(videosTable.isPublished, true)))
    .orderBy(desc(videosTable.createdAt))
    .limit(5);
  const cats = await db.select().from(categoriesTable);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const rows = await Promise.all(videos.map((v) => buildVideoListRow(v, catMap.get(v.categoryId ?? -1) ?? null)));
  res.json(rows);
});

router.get("/videos/stats", async (_req, res): Promise<void> => {
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(videosTable);
  const [{ published }] = await db.select({ published: sql<number>`count(*)::int` }).from(videosTable).where(eq(videosTable.isPublished, true));
  const [{ totalViews }] = await db.select({ totalViews: sql<number>`coalesce(sum(view_count), 0)::int` }).from(videosTable);
  const [{ avgPrice }] = await db.select({ avgPrice: sql<number>`coalesce(avg(price::numeric), 0)::float` }).from(videosTable);
  const cats = await db.select({ categoryId: videosTable.categoryId, count: sql<number>`count(*)::int` }).from(videosTable).groupBy(videosTable.categoryId);
  const catNames = await db.select().from(categoriesTable);
  const catMap = new Map(catNames.map((c) => [c.id, c.name]));
  res.json({
    total: total ?? 0,
    published: published ?? 0,
    totalViews: totalViews ?? 0,
    avgPrice: Math.round((avgPrice ?? 0) * 100) / 100,
    byCategory: cats
      .filter((c) => c.categoryId != null)
      .map((c) => ({
        categoryId: c.categoryId!,
        categoryName: catMap.get(c.categoryId!) ?? "Без категории",
        count: c.count,
      })),
  });
});

router.get("/videos/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetVideoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, params.data.id));
  if (!video) { res.status(404).json({ error: "Видео не найдено" }); return; }
  const [cat] = video.categoryId
    ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, video.categoryId))
    : [null];
  const row = await buildVideoRow(video, cat?.name ?? null, req.user?.userId);
  res.json(row);
});

router.patch("/videos/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateVideoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateVideoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = parsed.data;
  const updates: Partial<typeof videosTable.$inferInsert> = {};
  if (data.title != null) updates.title = data.title;
  if ("description" in data) updates.description = data.description ?? undefined;
  if ("thumbnailUrl" in data) updates.thumbnailUrl = data.thumbnailUrl ?? undefined;
  if ("videoUrl" in data) updates.videoUrl = data.videoUrl ?? undefined;
  if ("previewVideoUrl" in data) updates.previewVideoUrl = data.previewVideoUrl ?? undefined;
  if ("durationSeconds" in data) updates.durationSeconds = data.durationSeconds ?? undefined;
  if (data.price != null) updates.price = String(data.price);
  if ("discountPrice" in data) updates.discountPrice = data.discountPrice != null ? String(data.discountPrice) : undefined;
  if ("categoryId" in data) updates.categoryId = data.categoryId ?? undefined;
  if (data.isFeatured != null) updates.isFeatured = data.isFeatured;
  if (data.isPublished != null) updates.isPublished = data.isPublished;
  const [video] = await db.update(videosTable).set(updates).where(eq(videosTable.id, params.data.id)).returning();
  if (!video) { res.status(404).json({ error: "Видео не найдено" }); return; }
  const row = await buildVideoListRow(video, null);
  res.json(row);
});

router.delete("/videos/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteVideoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(videosTable).where(eq(videosTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/videos/:id/view", async (req, res): Promise<void> => {
  const params = RecordVideoViewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.update(videosTable).set({ viewCount: sql`view_count + 1` }).where(eq(videosTable.id, params.data.id));
  res.json({ success: true, message: null });
});

router.get("/videos/:id/related", async (req, res): Promise<void> => {
  const params = GetRelatedVideosParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, params.data.id));
  if (!video) { res.json([]); return; }
  const related = await db
    .select()
    .from(videosTable)
    .where(and(eq(videosTable.isPublished, true), ne(videosTable.id, params.data.id)))
    .orderBy(desc(videosTable.viewCount))
    .limit(4);
  const cats = await db.select().from(categoriesTable);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const rows = await Promise.all(related.map((v) => buildVideoListRow(v, catMap.get(v.categoryId ?? -1) ?? null)));
  res.json(rows);
});

router.get("/videos/:id/similar", async (req, res): Promise<void> => {
  const params = GetSimilarVideosParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, params.data.id));
  if (!video) { res.json([]); return; }
  const conditions = [eq(videosTable.isPublished, true), ne(videosTable.id, params.data.id)];
  if (video.categoryId) conditions.push(eq(videosTable.categoryId, video.categoryId));
  const similar = await db.select().from(videosTable).where(and(...conditions)).orderBy(desc(videosTable.createdAt)).limit(4);
  const cats = await db.select().from(categoriesTable);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const rows = await Promise.all(similar.map((v) => buildVideoListRow(v, catMap.get(v.categoryId ?? -1) ?? null)));
  res.json(rows);
});

export default router;
