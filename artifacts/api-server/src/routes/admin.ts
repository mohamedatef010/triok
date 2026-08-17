import { Router, IRouter } from "express";
import { db, usersTable, ordersTable, orderItemsTable, videosTable, categoriesTable, siteSettingsTable } from "@workspace/db";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { generateUploadUrl, s3Client } from "@workspace/storage";
import { eq, sql, desc } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { 
  signAccessToken, 
  signRefreshToken, 
  REFRESH_COOKIE_NAME, 
  refreshCookieOptions 
} from "../lib/auth";
import { requireAdmin } from "../middlewares/requireAuth";
import {
  AdminLoginBody,
  AdminListOrdersQueryParams,
  AdminListUsersQueryParams,
  AdminListVideosQueryParams,
  SetVideoDiscountBody,
  SetVideoDiscountParams,
} from "@workspace/api-zod";
import { authLimiter } from "../middlewares/rateLimiter";
import { optimizeAuthorVideoFromS3 } from "../lib/authorMediaProcessor";

const router: IRouter = Router();

router.post("/admin/login", authLimiter, async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, username.toLowerCase().trim()));

  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Неверные данные для входа" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Неверные данные для входа" });
    return;
  }

  const token = signAccessToken({ userId: user.id, role: "admin" }, user.passwordHash);
  const refreshToken = signRefreshToken({ userId: user.id, role: "admin" }, user.passwordHash);


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

/* ── Author media (public read via API proxy) ── */
router.get("/author-media/:filename", async (req, res): Promise<void> => {
  const filename = req.params.filename as string;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  const bucket = process.env.S3_BUCKET || "video-courses";
  const key = `author-media/${filename}`;

  try {
    const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (response.ContentType) {
      res.setHeader("Content-Type", response.ContentType);
    }
    res.setHeader("Cache-Control", "public, max-age=86400");

    const stream = response.Body as NodeJS.ReadableStream;
    stream.pipe(res);
  } catch (error) {
    req.log.error(error);
    res.status(404).json({ error: "Not found" });
  }
});

/* ── Site Settings (public read) ── */
router.get("/site-settings/:key", async (req, res): Promise<void> => {
  // Prevent any browser/CDN/proxy caching so admin changes always appear immediately
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const key = req.params.key as string;
  const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
  if (!setting) { res.status(404).json({ error: "Not found" }); return; }
  try {
    res.json({ key: setting.key, value: JSON.parse(setting.value) });
  } catch {
    res.json({ key: setting.key, value: setting.value });
  }
});

/* ── Site Settings (admin read) ── */
router.get("/admin/site-settings/:key", requireAdmin, async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const key = req.params.key as string;
  const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
  if (!setting) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    res.json({ key: setting.key, value: JSON.parse(setting.value) });
  } catch {
    res.json({ key: setting.key, value: setting.value });
  }
});

/* ── Site Settings (admin write) ── */
router.put("/admin/site-settings/:key", requireAdmin, async (req, res): Promise<void> => {
  const key = req.params.key as string;
  const body = z.object({ value: z.any() }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const valueStr = JSON.stringify(body.data.value);
  const [existing] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
  if (existing) {
    await db.update(siteSettingsTable).set({ value: valueStr }).where(eq(siteSettingsTable.key, key));
  } else {
    await db.insert(siteSettingsTable).values({ key, value: valueStr });
  }
  res.json({ success: true, key, value: body.data.value });
});

/* ── Author Section Video Upload (optimized for web) ── */
router.post("/admin/upload-author-video-url", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const key = `author-media/temp/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
    const uploadUrl = await generateUploadUrl(key, "video/mp4");
    res.json({ uploadUrl, key });
  } catch (error) {
    _req.log.error(error);
    res.status(500).json({ error: "Failed to generate video upload URL" });
  }
});

router.post("/admin/process-author-video", requireAdmin, async (req, res): Promise<void> => {
  const parsed = z.object({ key: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const result = await optimizeAuthorVideoFromS3(parsed.data.key);
    res.json(result);
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "Failed to process video" });
  }
});

/* ── Image Upload (WebP — server-side upload, no presigned URL needed) ── */
router.post("/admin/upload-image", requireAdmin, async (req, res): Promise<void> => {
  try {
    const contentType = req.headers["content-type"] || "image/webp";
    if (!contentType.startsWith("image/")) {
      res.status(400).json({ error: "Only image uploads are accepted" });
      return;
    }

    // Collect raw binary from request body
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });
    const body = Buffer.concat(chunks);
    if (body.length === 0) {
      res.status(400).json({ error: "Empty image body" });
      return;
    }

    const key = `images/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const bucket = process.env.S3_BUCKET || "video-courses";

    // Upload directly from server to MinIO (avoids browser→MinIO connectivity issues)
    const { uploadFile } = await import("@workspace/storage");
    await uploadFile(key, body, "image/webp");

    const publicUrl = `/api/thumbnails/${key.replace("images/", "")}`;
    res.json({ url: publicUrl, key });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

/* ── Legacy presigned URL endpoint (kept for backward compatibility) ── */
router.post("/admin/upload-image-url", requireAdmin, async (req, res): Promise<void> => {
  try {
    const key = `images/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const uploadUrl = await generateUploadUrl(key, "image/webp");
    const publicUrl = `/api/thumbnails/${key.replace("images/", "")}`;
    res.json({ uploadUrl, url: publicUrl, key });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/* ── Thumbnail Proxy (serve uploaded thumbnails from S3) ── */
async function serveThumbnail(req: any, res: any): Promise<void> {
  const filename = req.params.filename as string;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  const bucket = process.env.S3_BUCKET || "video-courses";
  const key = `images/${filename}`;

  try {
    const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.setHeader("Content-Type", response.ContentType || "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const stream = response.Body as NodeJS.ReadableStream;
    stream.pipe(res);
  } catch {
    res.status(404).json({ error: "Not found" });
  }
}

/* Original public path (kept intact) */
router.get("/thumbnails/:filename", serveThumbnail);
/* Alias under /admin/thumbnails (same handler, same behavior) */
router.get("/admin/thumbnails/:filename", serveThumbnail);

/* ── Demo/preview video proxy (full file for all visitors) ── */
router.get("/preview-videos/:filename", async (req, res): Promise<void> => {
  const filename = req.params.filename as string;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  const bucket = process.env.S3_BUCKET || "video-courses";
  const key = `preview-videos/${filename}`;
  const range = typeof req.headers.range === "string" ? req.headers.range : undefined;

  try {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(range ? { Range: range } : {}),
    }));
    if (!response.Body) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.setHeader("Content-Type", response.ContentType || "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400");
    if (response.ContentLength != null) {
      res.setHeader("Content-Length", String(response.ContentLength));
    }
    if (range && response.ContentRange) {
      res.status(206);
      res.setHeader("Content-Range", response.ContentRange);
    }

    const stream = response.Body as NodeJS.ReadableStream;
    stream.pipe(res);
  } catch (error) {
    req.log.error(error);
    res.status(404).json({ error: "Not found" });
  }
});

export default router;
