import { Router, IRouter } from "express";
import { db, ordersTable, orderItemsTable, videosTable, cartItemsTable, videoAccessTable, siteSettingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { ListOrdersResponse, CreateOrderBody, GetOrderParams } from "@workspace/api-zod";

const router: IRouter = Router();

// Helper to validate and calculate promo discount
async function getPromoDiscount(promoCodeInput: string | null | undefined, totalAmount: number) {
  if (!promoCodeInput || typeof promoCodeInput !== "string") return { valid: false, discount: 0 };
  const cleanCode = promoCodeInput.trim().toUpperCase();
  if (!cleanCode) return { valid: false, discount: 0 };

  const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "game_promocode"));
  let promoData: any = {
    code: "MAGIC20",
    discountPercent: 20,
    discountType: "percent",
    isActive: true,
  };

  if (setting) {
    try {
      promoData = JSON.parse(setting.value);
    } catch {}
  }

  if (promoData.isActive && promoData.code && promoData.code.trim().toUpperCase() === cleanCode) {
    let discount = 0;
    if (promoData.discountType === "fixed" && promoData.discountAmount) {
      discount = Math.min(Number(promoData.discountAmount), totalAmount);
    } else {
      const percent = Number(promoData.discountPercent || 20);
      discount = Math.round((totalAmount * percent) / 100);
    }
    return {
      valid: true,
      code: promoData.code.toUpperCase(),
      discount,
      discountPercent: promoData.discountPercent || 20,
      discountAmount: promoData.discountAmount || 0,
      discountType: promoData.discountType || "percent",
      description: promoData.description || `Скидка по промокоду ${promoData.code}`,
    };
  }

  return { valid: false, discount: 0 };
}

// Validate promo code endpoint (Public)
router.post("/promocode/validate", async (req, res): Promise<void> => {
  const code = typeof req.body?.code === "string" ? req.body.code.trim().toUpperCase() : "";
  if (!code) {
    res.status(400).json({ valid: false, message: "Введите промокод" });
    return;
  }

  const result = await getPromoDiscount(code, 1000);
  if (!result.valid) {
    res.status(400).json({ valid: false, message: "Неверный или неактивный промокод" });
    return;
  }

  res.json(result);
});

async function buildOrderRow(order: typeof ordersTable.$inferSelect) {
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  const itemRows = await Promise.all(
    items.map(async (item) => {
      const [video] = await db.select().from(videosTable).where(eq(videosTable.id, item.videoId));
      return {
        videoId: item.videoId,
        title: video?.title ?? "Видео",
        thumbnailUrl: video?.thumbnailUrl ?? null,
        price: Number(item.price),
      };
    })
  );

  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    total: Number(order.total),
    paymentMethod: order.paymentMethod ?? null,
    paymentId: order.paymentId ?? null,
    items: itemRows,
    createdAt: order.createdAt,
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, req.user!.userId))
    .orderBy(ordersTable.createdAt);
  const rows = await Promise.all(orders.map(buildOrderRow));
  res.json(rows);
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  let videoIds: number[] = [];

  if (parsed.data.fromCart) {
    const cartItems = await db
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.userId, req.user!.userId));
    videoIds = cartItems.map((c) => c.videoId);
  } else if (parsed.data.videoId) {
    videoIds = [parsed.data.videoId];
  }

  if (videoIds.length === 0) {
    res.status(400).json({ error: "Нет товаров для заказа" });
    return;
  }
  
  // Check if any video is already purchased
  const existingAccess = await db
    .select()
    .from(videoAccessTable)
    .where(and(eq(videoAccessTable.userId, req.user!.userId)));
    
  const ownedVideoIds = new Set(existingAccess.map(a => a.videoId));
  const alreadyOwned = videoIds.filter(id => ownedVideoIds.has(id));
  
  if (alreadyOwned.length > 0) {
    res.status(400).json({ error: "Вы уже приобрели этот курс ранее" });
    return;
  }

  const videos = await Promise.all(
    videoIds.map(async (id) => {
      const [v] = await db.select().from(videosTable).where(eq(videosTable.id, id));
      return v;
    })
  );

  const validVideos = videos.filter(Boolean) as (typeof videosTable.$inferSelect)[];
  const subtotal = validVideos.reduce(
    (s, v) => s + (v.discountPrice != null ? Number(v.discountPrice) : Number(v.price)),
    0
  );

  // Check and apply promo code discount
  const promoCodeInput = typeof req.body?.promoCode === "string" ? req.body.promoCode : null;
  const promoCheck = await getPromoDiscount(promoCodeInput, subtotal);
  const finalTotal = Math.max(0, subtotal - promoCheck.discount);

  const [order] = await db
    .insert(ordersTable)
    .values({ userId: req.user!.userId, total: String(finalTotal), status: "pending" })
    .returning();

  await db.insert(orderItemsTable).values(
    validVideos.map((v) => ({
      orderId: order.id,
      videoId: v.id,
      price: String(v.discountPrice != null ? Number(v.discountPrice) : Number(v.price)),
    }))
  );

  res.status(201).json(await buildOrderRow(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.userId, req.user!.userId)));
  if (!order) { res.status(404).json({ error: "Заказ не найден" }); return; }
  res.json(await buildOrderRow(order));
});

export default router;
