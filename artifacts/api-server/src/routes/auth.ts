import { Router, IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";
import {
  RegisterBody,
  LoginBody,
  UpdateMeBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, name } = parsed.data;

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email уже занят" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name, role: "user" })
    .returning();

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Неверный email или пароль" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Неверный email или пароль" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true, message: "Выход выполнен" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(401).json({ error: "Пользователь не найден" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    createdAt: user.createdAt,
  });
});

router.patch("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if ("phone" in parsed.data) updates.phone = parsed.data.phone ?? undefined;
  if ("avatarUrl" in parsed.data) updates.avatarUrl = parsed.data.avatarUrl ?? undefined;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.user!.userId))
    .returning();
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    createdAt: user.createdAt,
  });
});

router.get("/auth/me/videos", requireAuth, async (req, res): Promise<void> => {
  const { ordersTable, orderItemsTable, videosTable, categoriesTable } = await import("@workspace/db");
  const rows = await db
    .selectDistinctOn([videosTable.id])
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .innerJoin(videosTable, eq(orderItemsTable.videoId, videosTable.id))
    .leftJoin(categoriesTable, eq(videosTable.categoryId, categoriesTable.id))
    .where(eq(ordersTable.userId, req.user!.userId));

  const { reviewsTable } = await import("@workspace/db");
  const reviews = await db
    .select()
    .from(reviewsTable);

  res.json(
    rows.map((r) => {
      const videoReviews = reviews.filter((rv) => rv.videoId === r.videos.id);
      const avg = videoReviews.length
        ? videoReviews.reduce((s, rv) => s + rv.rating, 0) / videoReviews.length
        : 0;
      return {
        id: r.videos.id,
        title: r.videos.title,
        description: r.videos.description ?? null,
        thumbnailUrl: r.videos.thumbnailUrl ?? "",
        videoUrl: r.videos.videoUrl ?? null,
        durationSeconds: r.videos.durationSeconds ?? null,
        price: Number(r.videos.price),
        discountPrice: r.videos.discountPrice != null ? Number(r.videos.discountPrice) : null,
        categoryId: r.videos.categoryId ?? null,
        categoryName: r.categories?.name ?? null,
        viewCount: r.videos.viewCount,
        averageRating: Math.round(avg * 10) / 10,
        reviewCount: videoReviews.length,
        isFeatured: r.videos.isFeatured,
        isPublished: r.videos.isPublished,
        createdAt: r.videos.createdAt,
      };
    })
  );
});

export default router;
