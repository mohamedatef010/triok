import { Router, IRouter } from "express";
import { db, usersTable, ordersTable, orderItemsTable, videosTable, categoriesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken } from "../lib/auth";
import { requireAdmin } from "../middlewares/requireAuth";
import {
  AdminLoginBody,
  AdminListOrdersQueryParams,
  AdminListUsersQueryParams,
  AdminListVideosQueryParams,
  SetVideoDiscountBody,
  SetVideoDiscountParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, username));

  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Неверные данные для входа" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Неверные данные для входа" });
    return;
  }

  const token = signToken({ userId: user.id, role: "admin" });
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

router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminListOrdersQueryParams.safeParse(req.query);
  const page = parsed.data?.page ?? 1;
  const limit = parsed.data?.limit ?? 20;
  const offset = (page - 1) * limit;

  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit)
    .offset(offset);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(ordersTable);

  const rows = await Promise.all(
    orders.map(async (order) => {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
      const itemRows = await Promise.all(
        items.map(async (item) => {
          const [video] = await db.select().from(videosTable).where(eq(videosTable.id, item.videoId));
          return { videoId: item.videoId, title: video?.title ?? "Видео", thumbnailUrl: video?.thumbnailUrl ?? null, price: Number(item.price) };
        })
      );
      return { id: order.id, userId: order.userId, status: order.status, total: Number(order.total), paymentMethod: order.paymentMethod ?? null, paymentId: order.paymentId ?? null, items: itemRows, createdAt: order.createdAt };
    })
  );

  res.json({ orders: rows, total: total ?? 0, page, limit });
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminListUsersQueryParams.safeParse(req.query);
  const page = parsed.data?.page ?? 1;
  const limit = parsed.data?.limit ?? 20;
  const offset = (page - 1) * limit;

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(usersTable);

  res.json({
    users: users.map((u) => ({ id: u.id, email: u.email, name: u.name, phone: u.phone ?? null, avatarUrl: u.avatarUrl ?? null, role: u.role, createdAt: u.createdAt })),
    total: total ?? 0,
    page,
    limit,
  });
});

router.get("/admin/videos", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminListVideosQueryParams.safeParse(req.query);
  const page = parsed.data?.page ?? 1;
  const limit = parsed.data?.limit ?? 20;
  const offset = (page - 1) * limit;

  const videos = await db.select().from(videosTable).orderBy(desc(videosTable.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(videosTable);
  const cats = await db.select().from(categoriesTable);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));

  res.json({
    videos: videos.map((v) => ({
      id: v.id, title: v.title, description: v.description ?? null,
      thumbnailUrl: v.thumbnailUrl ?? "", videoUrl: v.videoUrl ?? null,
      durationSeconds: v.durationSeconds ?? null,
      price: Number(v.price), discountPrice: v.discountPrice != null ? Number(v.discountPrice) : null,
      categoryId: v.categoryId ?? null, categoryName: catMap.get(v.categoryId ?? -1) ?? null,
      viewCount: v.viewCount, averageRating: 0, reviewCount: 0,
      isFeatured: v.isFeatured, isPublished: v.isPublished, createdAt: v.createdAt,
    })),
    total: total ?? 0, page, limit,
  });
});

router.patch("/admin/videos/:id/discount", requireAdmin, async (req, res): Promise<void> => {
  const params = SetVideoDiscountParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = SetVideoDiscountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [video] = await db
    .update(videosTable)
    .set({ discountPrice: parsed.data.discountPrice != null ? String(parsed.data.discountPrice) : null })
    .where(eq(videosTable.id, params.data.id))
    .returning();
  if (!video) { res.status(404).json({ error: "Видео не найдено" }); return; }
  res.json({ id: video.id, title: video.title, description: video.description ?? null, thumbnailUrl: video.thumbnailUrl ?? "", videoUrl: video.videoUrl ?? null, durationSeconds: video.durationSeconds ?? null, price: Number(video.price), discountPrice: video.discountPrice != null ? Number(video.discountPrice) : null, categoryId: video.categoryId ?? null, categoryName: null, viewCount: video.viewCount, averageRating: 0, reviewCount: 0, isFeatured: video.isFeatured, isPublished: video.isPublished, createdAt: video.createdAt });
});

export default router;
