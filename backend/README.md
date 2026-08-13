# Backend — الخادم والبيانات

> هذا المجلد **دليل تنقل فقط**. الملفات الفعلية لم تُنقل — ما زالت في أماكنها الأصلية داخل المشروع.

---

## أين الكود؟

| ماذا | المسار الفعلي |
|------|---------------|
| **خادم API** (Express) | `artifacts/api-server/` |
| **مواصفة API** (OpenAPI) | `lib/api-spec/openapi.yaml` |
| **مخططات Zod / Types** | `lib/api-zod/` |
| **قاعدة البيانات** (Drizzle ORM) | `lib/db/` |
| **تخزين S3** | `lib/storage/` |

---

## هيكل خادم API `artifacts/api-server/`

```
artifacts/api-server/
├── package.json
├── build.mjs               ← esbuild bundle
├── tsconfig.json
└── src/
    ├── index.ts            ← نقطة الدخول (تشغيل السيرفر)
    ├── app.ts              ← إعداد Express
    │
    ├── lib/
    │   ├── auth.ts         ← JWT / المصادقة
    │   ├── logger.ts       ← Pino logging
    │   └── videoProcessor.ts
    │
    ├── middlewares/
    │   └── requireAuth.ts  ← requireAuth + requireAdmin
    │
    └── routes/             ← كل endpoints هنا
        ├── index.ts        ← تجميع المسارات
        ├── health.ts       ← GET /healthz
        ├── auth.ts         ← تسجيل / دخول / logout / me
        ├── videos.ts       ← CRUD الفيديوهات
        ├── categories.ts   ← التصنيفات
        ├── cart.ts         ← السلة
        ├── favorites.ts    ← المفضلة
        ├── orders.ts       ← الطلبات
        ├── payments.ts     ← الدفع
        ├── reviews.ts      ← التقييمات
        ├── analytics.ts    ← تتبع الزيارات
        └── admin.ts        ← لوحة الإدارة
```

---

## هيكل قاعدة البيانات `lib/db/`

```
lib/db/
├── drizzle.config.ts
├── package.json
└── src/
    ├── index.ts            ← اتصال PostgreSQL
    └── schema/
        ├── index.ts
        ├── users.ts        ← المستخدمون (user / admin)
        ├── videos.ts       ← الدورات / HLS
        ├── categories.ts
        ├── cart.ts
        ├── favorites.ts
        ├── orders.ts
        ├── reviews.ts
        ├── analytics.ts
        └── videoAccess.ts  ← صلاحية بعد الشراء
```

---

## هيكل مواصفة API `lib/api-spec/`

```
lib/api-spec/
├── openapi.yaml            ← تعريف كل endpoints (المصدر الرئيسي)
├── orval.config.ts         ← إعداد التوليد التلقائي
└── package.json
```

**تدفق التعديل:**
1. عدّل `lib/api-spec/openapi.yaml`
2. شغّل: `pnpm --filter @workspace/api-spec run codegen`
3. نفّذ الـ route في `artifacts/api-server/src/routes/`

---

## ماذا تعدّل عند...

| المطلوب | اذهب إلى |
|---------|----------|
| إضافة/تعديل endpoint | `lib/api-spec/openapi.yaml` → codegen → `artifacts/api-server/src/routes/` |
| منطق المصادقة | `artifacts/api-server/src/lib/auth.ts` |
| حماية route | `artifacts/api-server/src/middlewares/requireAuth.ts` |
| إضافة جدول DB | `lib/db/src/schema/` |
| push schema للـ DB | `pnpm --filter @workspace/db run push` |
| تخزين ملفات S3 | `lib/storage/` |

---

## أوامر التشغيل

```bash
# من جذر المشروع (Attached-Assets/)

# تشغيل Backend في وضع التطوير (port 5000)
pnpm --filter @workspace/api-server run dev

# بناء
pnpm --filter @workspace/api-server run build

# تشغيل النسخة المبنية
pnpm --filter @workspace/api-server run start

# توليد كود API من OpenAPI
pnpm --filter @workspace/api-spec run codegen

# تحديث schema قاعدة البيانات
pnpm --filter @workspace/db run push
```

---

## متغيرات البيئة

| المتغير | مطلوب | الوصف |
|---------|-------|-------|
| `DATABASE_URL` | نعم | PostgreSQL connection string |
| `SESSION_SECRET` | نعم | مفتاح توقيع JWT |
| `PORT` | لا | المنفذ (افتراضي: 5000) |
| `NODE_ENV` | لا | development / production |

ملف `.env` في جذر المشروع أو `artifacts/api-server/.env`

---

## نقاط نهاية API (ملخص)

كل المسارات تبدأ بـ `/api`:

| المجموعة | أمثلة |
|----------|-------|
| Health | `GET /healthz` |
| Auth | `POST /auth/login`, `GET /auth/me` |
| Videos | `GET /videos`, `GET /videos/{id}` |
| Cart | `GET /cart`, `POST /cart/items` |
| Orders | `GET /orders`, `POST /orders` |
| Payments | `POST /payments/initiate` |
| Admin | `/admin/videos`, `/admin/users`, ... |

التفاصيل الكاملة في `lib/api-spec/openapi.yaml`

---

## التقنيات

- Express 5 + esbuild
- PostgreSQL + Drizzle ORM
- Zod v4 (validation)
- JWT (Bearer token)
- Pino (logging)
- AWS S3 (`lib/storage`)

---

## راجع أيضاً

- `../frontend/README.md` — الواجهة الأمامية
- `../PROJECT_STRUCTURE.md` — الدليل الكامل للمشروع
- `../LOCAL_SETUP.md` — إعداد البيئة المحلية
