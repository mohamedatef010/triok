import { Router, IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { 
  signAccessToken, 
  signRefreshToken, 
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions 
} from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";
import {
  RegisterBody,
  LoginBody,
  UpdateMeBody,
} from "@workspace/api-zod";
import { authLimiter, refreshLimiter } from "../middlewares/rateLimiter";

const router: IRouter = Router();

router.post("/auth/register", authLimiter, async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, name } = parsed.data;

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));
  if (existing) {
    res.status(409).json({ error: "Email уже занят" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ email: email.toLowerCase().trim(), passwordHash, name: name.trim(), role: "user" })
    .returning();

  const accessToken = signAccessToken({ userId: user.id, role: user.role }, user.passwordHash);
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role }, user.passwordHash);

  // Set secure HttpOnly cookie for refresh token
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

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
    token: accessToken,
  });
});

router.post("/auth/login", authLimiter, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));
  if (!user) {
    res.status(401).json({ error: "Неверный email или пароль" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Неверный email или пароль" });
    return;
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role }, user.passwordHash);
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role }, user.passwordHash);

  // Set secure HttpOnly cookie for refresh token
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

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
    token: accessToken,
  });
});

router.post("/auth/refresh", refreshLimiter, async (req, res): Promise<void> => {
  const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  const tokenFromBody = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined;
  const refreshToken = tokenFromCookie || tokenFromBody;

  if (!refreshToken) {
    res.status(401).json({ error: "Токен обновления не найден" });
    return;
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
    res.status(401).json({ error: "Недействительный или истекший токен обновления" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId));

  if (!user) {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
    res.status(401).json({ error: "Пользователь не найден" });
    return;
  }

  // Issue new access token and rotated refresh token (with updated pwfp from current passwordHash)
  const newAccessToken = signAccessToken({ userId: user.id, role: user.role }, user.passwordHash);
  const newRefreshToken = signRefreshToken({ userId: user.id, role: user.role }, user.passwordHash);

  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions);

  res.json({
    token: newAccessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
  res.clearCookie("auth_token", { path: "/" });
  res.clearCookie("admin_token", { path: "/" });
  res.json({ success: true, message: "Выход выполнен" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  // Prevent proxy/CDN from ever caching this user-specific response
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");

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
  if (parsed.data.name != null) updates.name = parsed.data.name.trim();
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
  const { ordersTable, orderItemsTable, videosTable, categoriesTable, reviewsTable } = await import("@workspace/db");
  const rows = await db
    .selectDistinctOn([videosTable.id])
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .innerJoin(videosTable, eq(orderItemsTable.videoId, videosTable.id))
    .leftJoin(categoriesTable, eq(videosTable.categoryId, categoriesTable.id))
    .where(eq(ordersTable.userId, req.user!.userId));

  if (rows.length === 0) {
    res.json([]);
    return;
  }

  // Fetch only reviews relevant to the purchased videos
  const videoIds = rows.map((r) => r.videos.id);
  const reviews = await db
    .select({ videoId: reviewsTable.videoId, rating: reviewsTable.rating })
    .from(reviewsTable)
    .where(inArray(reviewsTable.videoId, videoIds));

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

