import { Router, IRouter } from "express";
import { db, categoriesTable, videosTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth";
import { CreateCategoryBody, UpdateCategoryBody, UpdateCategoryParams, DeleteCategoryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  const counts = await db
    .select({
      categoryId: videosTable.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(videosTable)
    .where(eq(videosTable.isPublished, true))
    .groupBy(videosTable.categoryId);
  const countMap = new Map(counts.map((c) => [c.categoryId, c.count]));
  res.json(
    cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      videoCount: countMap.get(c.id) ?? 0,
    }))
  );
});

router.post("/categories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [cat] = await db
    .insert(categoriesTable)
    .values(parsed.data)
    .returning();
  res.status(201).json({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description ?? null, videoCount: 0 });
});

router.patch("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [cat] = await db
    .update(categoriesTable)
    .set(parsed.data)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();
  if (!cat) { res.status(404).json({ error: "Категория не найдена" }); return; }
  res.json({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description ?? null, videoCount: 0 });
});

router.delete("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.update(videosTable).set({ categoryId: null }).where(eq(videosTable.categoryId, params.data.id));
  await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
