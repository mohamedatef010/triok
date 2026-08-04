import { Router, IRouter } from "express";
import { db, siteVisitsTable, ordersTable, usersTable, videosTable, orderItemsTable } from "@workspace/db";
import { sql, desc, eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/admin/analytics/overview", requireAdmin, async (_req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);

  const [{ totalRevenue }] = await db
    .select({ totalRevenue: sql<number>`coalesce(sum(total::numeric), 0)::float` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "paid"));

  const [{ totalOrders }] = await db
    .select({ totalOrders: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "paid"));

  const [{ totalUsers }] = await db
    .select({ totalUsers: sql<number>`count(*)::int` })
    .from(usersTable);

  const [{ totalViews }] = await db
    .select({ totalViews: sql<number>`coalesce(sum(view_count), 0)::int` })
    .from(videosTable);

  const [{ revenueToday }] = await db
    .select({ revenueToday: sql<number>`coalesce(sum(total::numeric), 0)::float` })
    .from(ordersTable)
    .where(sql`status = 'paid' AND created_at::date = ${today}::date`);

  const [{ ordersToday }] = await db
    .select({ ordersToday: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(sql`status = 'paid' AND created_at::date = ${today}::date`);

  const [visitRow] = await db
    .select({ count: siteVisitsTable.count })
    .from(siteVisitsTable)
    .where(eq(siteVisitsTable.visitDate, today));

  res.json({
    totalRevenue: Math.round((totalRevenue ?? 0) * 100) / 100,
    totalOrders: totalOrders ?? 0,
    totalUsers: totalUsers ?? 0,
    totalViews: totalViews ?? 0,
    revenueToday: Math.round((revenueToday ?? 0) * 100) / 100,
    ordersToday: ordersToday ?? 0,
    visitorsToday: visitRow?.count ?? 0,
  });
});

router.get("/admin/analytics/daily-visitors", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({ date: siteVisitsTable.visitDate, count: siteVisitsTable.count })
    .from(siteVisitsTable)
    .orderBy(siteVisitsTable.visitDate)
    .limit(30);
  res.json(rows.map((r) => ({ date: r.date, count: r.count })));
});

router.get("/admin/analytics/video-views", requireAdmin, async (_req, res): Promise<void> => {
  const videos = await db
    .select()
    .from(videosTable)
    .orderBy(desc(videosTable.viewCount))
    .limit(10);

  const rows = await Promise.all(
    videos.map(async (v) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orderItemsTable)
        .where(eq(orderItemsTable.videoId, v.id));
      return {
        videoId: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl ?? null,
        viewCount: v.viewCount,
        purchaseCount: count ?? 0,
      };
    })
  );

  res.json(rows);
});

router.post("/analytics/visit", async (req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  await db
    .insert(siteVisitsTable)
    .values({ visitDate: today, count: 1 })
    .onConflictDoUpdate({
      target: siteVisitsTable.visitDate,
      set: { count: sql`site_visits.count + 1` },
    });
  res.json({ success: true, message: null });
});

export default router;
