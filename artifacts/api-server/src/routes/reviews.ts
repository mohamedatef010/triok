import { Router, IRouter } from "express";
import { db, reviewsTable, usersTable, ordersTable, orderItemsTable, videosTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { ListReviewsParams, CreateReviewParams, CreateReviewBody, DeleteReviewParams } from "@workspace/api-zod";
import { checkUserPurchasedVideo } from "../lib/purchaseCheck";

const router: IRouter = Router();

// Get reviews for a specific video (Public)
router.get("/videos/:id/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const reviews = await db
    .select({
      id: reviewsTable.id,
      videoId: reviewsTable.videoId,
      userId: reviewsTable.userId,
      rating: reviewsTable.rating,
      text: reviewsTable.text,
      createdAt: reviewsTable.createdAt,
      userName: usersTable.name,
      userAvatarUrl: usersTable.avatarUrl,
    })
    .from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.videoId, params.data.id))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(
    reviews.map((r) => ({
      id: r.id,
      videoId: r.videoId,
      userId: r.userId,
      userName: r.userName || "Пользователь",
      userAvatarUrl: r.userAvatarUrl ?? null,
      rating: r.rating,
      text: r.text ?? null,
      createdAt: r.createdAt,
    }))
  );
});


// Get all reviews written by current user
router.get("/reviews/my", requireAuth, async (req, res): Promise<void> => {
  const reviews = await db
    .select({
      id: reviewsTable.id,
      videoId: reviewsTable.videoId,
      videoTitle: videosTable.title,
      videoThumbnailUrl: videosTable.thumbnailUrl,
      userId: reviewsTable.userId,
      rating: reviewsTable.rating,
      text: reviewsTable.text,
      createdAt: reviewsTable.createdAt,
    })
    .from(reviewsTable)
    .innerJoin(videosTable, eq(reviewsTable.videoId, videosTable.id))
    .where(eq(reviewsTable.userId, req.user!.userId))
    .orderBy(desc(reviewsTable.createdAt));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));

  res.json(
    reviews.map((r) => ({
      ...r,
      userName: user?.name ?? "Пользователь",
      userAvatarUrl: user?.avatarUrl ?? null,
    }))
  );
});

// Create or update review for a video (requires purchase)
router.post("/videos/:id/reviews", requireAuth, async (req, res): Promise<void> => {
  const params = CreateReviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Check purchase
  const isPurchased = await checkUserPurchasedVideo(req.user!.userId, params.data.id);
  if (!isPurchased) {
    res.status(403).json({ error: "Вы можете оставить отзыв только после покупки курса" });
    return;
  }

  // Check if review already exists from this user for this video -> update it
  const [existing] = await db
    .select()
    .from(reviewsTable)
    .where(
      and(
        eq(reviewsTable.videoId, params.data.id),
        eq(reviewsTable.userId, req.user!.userId)
      )
    )
    .limit(1);

  let review;
  if (existing) {
    const [updated] = await db
      .update(reviewsTable)
      .set({
        rating: parsed.data.rating,
        text: parsed.data.text ?? null,
        createdAt: new Date(),
      })
      .where(eq(reviewsTable.id, existing.id))
      .returning();
    review = updated;
  } else {
    const [inserted] = await db
      .insert(reviewsTable)
      .values({ videoId: params.data.id, userId: req.user!.userId, rating: parsed.data.rating, text: parsed.data.text ?? null })
      .returning();
    review = inserted;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  res.status(existing ? 200 : 201).json({
    id: review.id,
    videoId: review.videoId,
    userId: review.userId,
    userName: user?.name ?? "Пользователь",
    userAvatarUrl: user?.avatarUrl ?? null,
    rating: review.rating,
    text: review.text ?? null,
    createdAt: review.createdAt,
  });
});

// Delete review
router.delete("/reviews/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteReviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, params.data.id));
  if (!review) { res.status(404).json({ error: "Отзыв не найден" }); return; }
  if (review.userId !== req.user!.userId && req.user!.role !== "admin") {
    res.status(403).json({ error: "Нет доступа" });
    return;
  }
  await db.delete(reviewsTable).where(eq(reviewsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
