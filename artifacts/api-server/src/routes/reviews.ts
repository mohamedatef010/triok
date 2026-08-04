import { Router, IRouter } from "express";
import { db, reviewsTable, usersTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { ListReviewsParams, CreateReviewParams, CreateReviewBody, DeleteReviewParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/videos/:id/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.videoId, params.data.id))
    .orderBy(reviewsTable.createdAt);
  const users = await db.select().from(usersTable);
  const userMap = new Map(users.map((u) => [u.id, u]));
  res.json(
    reviews.map((r) => {
      const u = userMap.get(r.userId);
      return {
        id: r.id,
        videoId: r.videoId,
        userId: r.userId,
        userName: u?.name ?? "Пользователь",
        userAvatarUrl: u?.avatarUrl ?? null,
        rating: r.rating,
        text: r.text ?? null,
        createdAt: r.createdAt,
      };
    })
  );
});

router.post("/videos/:id/reviews", requireAuth, async (req, res): Promise<void> => {
  const params = CreateReviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Check purchase
  const [order] = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .innerJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(
      and(
        eq(ordersTable.userId, req.user!.userId),
        eq(ordersTable.status, "paid"),
        eq(orderItemsTable.videoId, params.data.id)
      )
    )
    .limit(1);
  if (!order) {
    res.status(403).json({ error: "Вы можете оставить отзыв только после покупки" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({ videoId: params.data.id, userId: req.user!.userId, rating: parsed.data.rating, text: parsed.data.text ?? null })
    .returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  res.status(201).json({
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
