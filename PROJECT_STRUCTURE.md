# هيكل المشروع (Project Structure)

Monorepo مبني بـ **pnpm workspaces** لمنصة دورات فيديو (video-courses).

```
Attached-Assets/
├── package.json                 # جذر الـ workspace
├── pnpm-workspace.yaml          # تعريف الحزم: artifacts/* + lib/* + scripts
├── pnpm-lock.yaml
├── tsconfig.json                # TypeScript للجذر
├── tsconfig.base.json           # إعدادات TypeScript المشتركة
├── replit.md
├── .gitignore
├── .npmrc
├── .replit
├── .replitignore
│
├── artifacts/                   # التطبيقات (Apps)
│   ├── api-server/              # Backend API (Express)
│   ├── video-courses/           # Frontend الرئيسي (React + Vite)
│   └── mockup-sandbox/          # بيئة معاينة المكوّنات
│
├── lib/                         # مكتبات مشتركة
│   ├── api-spec/                # مواصفة OpenAPI + Orval
│   ├── api-client-react/        # عميل API لـ React (مولَّد)
│   ├── api-zod/                 # مخططات Zod / Types (مولَّدة)
│   ├── db/                      # قاعدة البيانات (Drizzle ORM)
│   └── storage/                 # تخزين S3 (AWS SDK)
│
├── scripts/                     # سكربتات مساعدة
├── attached_assets/             # أصول مرفقة (صور، مراجع)
└── .agents/                     # ذاكرة ومهارات الوكيل
```

---

## 1. `artifacts/` — التطبيقات

### 1.1 `artifacts/api-server/` — خادم الـ API

```
api-server/
├── package.json
├── tsconfig.json
├── build.mjs
└── src/
    ├── index.ts
    ├── app.ts
    ├── lib/
    │   ├── auth.ts
    │   └── logger.ts
    ├── middlewares/
    │   └── requireAuth.ts
    └── routes/
        ├── index.ts
        ├── health.ts
        ├── auth.ts
        ├── videos.ts
        ├── categories.ts
        ├── cart.ts
        ├── favorites.ts
        ├── orders.ts
        ├── payments.ts
        ├── reviews.ts
        ├── analytics.ts
        └── admin.ts
```

### 1.2 `artifacts/video-courses/` — الواجهة الأمامية

```
video-courses/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── components.json
├── index.html
├── public/
│   ├── favicon.svg
│   └── robots.txt
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── app-router.tsx
    ├── index.css
    ├── components/
    │   ├── logo.tsx
    │   ├── layout/
    │   │   ├── navbar.tsx
    │   │   ├── footer.tsx
    │   │   ├── app-layout.tsx
    │   │   └── admin-layout.tsx
    │   └── ui/                    # 57 مكوّن UI (shadcn-style)
    ├── hooks/
    │   ├── use-auth.ts
    │   ├── use-cart.ts
    │   ├── use-favorites.ts
    │   ├── use-compare.ts
    │   ├── use-analytics.ts
    │   ├── use-theme.ts
    │   ├── use-toast.ts
    │   ├── use-mobile.tsx
    │   ├── use-debounce.ts
    │   └── use-scroll-reveal.ts
    ├── lib/
    │   └── utils.ts
    └── pages/
        ├── index.ts
        ├── home.tsx
        ├── catalog.tsx
        ├── video-detail.tsx
        ├── cart.tsx
        ├── checkout.tsx
        ├── payment.tsx
        ├── favorites.tsx
        ├── compare.tsx
        ├── profile.tsx
        ├── contacts.tsx
        ├── help.tsx
        ├── not-found.tsx
        ├── auth/
        │   ├── login.tsx
        │   └── register.tsx
        └── admin/
            ├── login.tsx
            ├── dashboard.tsx
            ├── videos.tsx
            ├── orders.tsx
            └── users.tsx
```

**مكوّنات UI** (`src/components/ui/`): accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input, input-group, input-otp, item, kbd, label, menubar, navigation-menu, page-preloader, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, states, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip.

### 1.3 `artifacts/mockup-sandbox/` — Sandbox للمكوّنات

```
mockup-sandbox/
├── package.json
├── vite.config.ts
├── mockupPreviewPlugin.ts
├── components.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── mockups/
    │   └── ui/
    ├── hooks/
    └── lib/
        └── utils.ts
```

---

## 2. `lib/` — المكتبات المشتركة

### 2.1 `lib/api-spec/`

```
api-spec/
├── package.json
├── openapi.yaml                 # مواصفة الـ API
└── orval.config.ts              # توليد العملاء والمخططات
```

### 2.2 `lib/api-client-react/`

```
api-client-react/
├── package.json
└── src/
    ├── index.ts
    ├── custom-fetch.ts
    └── generated/
        ├── api.ts
        └── api.schemas.ts
```

### 2.3 `lib/api-zod/`

```
api-zod/
├── package.json
└── src/
    ├── index.ts
    └── generated/
        ├── api.ts
        └── types/               # أنواع مولَّدة (User, Video, Order, Cart, ...)
```

### 2.4 `lib/db/`

```
db/
├── package.json
├── drizzle.config.ts
└── src/
    ├── index.ts
    └── schema/
        ├── index.ts
        ├── users.ts
        ├── videos.ts
        ├── categories.ts
        ├── cart.ts
        ├── favorites.ts
        ├── orders.ts
        ├── reviews.ts
        ├── analytics.ts
        └── videoAccess.ts     # صلاحيات الوصول بعد الشراء
```

---

## 3. `scripts/`

```
scripts/
├── package.json
├── tsconfig.json
├── post-merge.sh
└── src/
    └── hello.ts
```

---

## 4. `attached_assets/`

أصول مرفقة للتصميم والمراجع:

- `hero-banner.jpg`
- `author-avatar.jpg`
- `thumb-1.jpg` / `thumb-2.jpg` / `thumb-3.jpg`
- `reference-site.png`
- ملف نصي مرجعي للموقع

---

## ملخص الحزم (pnpm workspace)

| المسار | الدور |
|--------|--------|
| `artifacts/api-server` | Backend API |
| `artifacts/video-courses` | Frontend (React + Vite + Wouter) |
| `artifacts/mockup-sandbox` | معاينة UI |
| `lib/api-spec` | OpenAPI + Orval |
| `lib/api-client-react` | React Query API client |
| `lib/api-zod` | Zod schemas / types |
| `lib/db` | Drizzle schema + DB |
| `lib/storage` | تخزين S3 (AWS SDK) |
| `scripts` | أدوات مساعدة |

---

## 5. التقنيات المستخدمة (Tech Stack)

| الطبقة | التقنية |
|--------|---------|
| إدارة الحزم | pnpm workspaces |
| اللغة | TypeScript 5.9 |
| Frontend | React 19 + Vite 7 + Wouter |
| UI | Tailwind CSS 4 + Radix UI + shadcn-style |
| State | Zustand (cart/favorites/compare) + React Query |
| Backend | Express 5 + esbuild |
| قاعدة البيانات | PostgreSQL + Drizzle ORM |
| التحقق | Zod v4 + drizzle-zod |
| توليد API | Orval (من OpenAPI) |
| المصادقة | JWT (Bearer token) |
| التخزين | AWS S3 (حزمة `@workspace/storage`) |
| السجلات | Pino |

---

## 6. مسارات الواجهة الأمامية (Frontend Routes)

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/` | `home.tsx` | الصفحة الرئيسية |
| `/catalog` | `catalog.tsx` | كatalog الدورات |
| `/video/:id` | `video-detail.tsx` | تفاصيل دورة |
| `/cart` | `cart.tsx` | سلة التسوق |
| `/checkout` | `checkout.tsx` | إتمام الشراء |
| `/payment/:orderId` | `payment.tsx` | صفحة الدفع |
| `/favorites` | `favorites.tsx` | المفضلة |
| `/compare` | `compare.tsx` | مقارنة الدورات |
| `/profile` | `profile.tsx` | الملف الشخصي |
| `/help` | `help.tsx` | المساعدة |
| `/contacts` | `contacts.tsx` | التواصل |
| `/auth/login` | `auth/login.tsx` | تسجيل الدخول |
| `/auth/register` | `auth/register.tsx` | إنشاء حساب |
| `/admm` | `admin/login.tsx` | دخول لوحة الإدارة |
| `/admm/dashboard` | `admin/dashboard.tsx` | لوحة التحكم |
| `/admm/videos` | `admin/videos.tsx` | إدارة الفيديوهات |
| `/admm/orders` | `admin/orders.tsx` | إدارة الطلبات |
| `/admm/users` | `admin/users.tsx` | إدارة المستخدمين |

**Aliases في Vite:**
- `@/` → `src/`
- `@assets/` → `attached_assets/`

---

## 7. نقاط نهاية الـ API (Backend Routes)

جميع المسارات تبدأ بـ `/api` وتُعرَّف في `lib/api-spec/openapi.yaml` وتُنفَّذ في `artifacts/api-server/src/routes/`.

| المجموعة | المسارات | الملف |
|----------|----------|-------|
| Health | `GET /healthz` | `health.ts` |
| Auth | `POST /auth/register`, `/login`, `/logout`, `GET/PATCH /auth/me`, `GET /auth/me/videos` | `auth.ts` |
| Categories | `GET/POST /categories`, `GET/PATCH/DELETE /categories/{id}` | `categories.ts` |
| Videos | `GET /videos`, `/featured`, `/stats`, `GET/PATCH/DELETE /videos/{id}`, `/view`, `/related`, `/similar`, `/reviews` | `videos.ts` |
| Reviews | `PATCH/DELETE /reviews/{id}` | `reviews.ts` |
| Cart | `GET /cart`, `POST /cart/items`, `DELETE /cart/items/{videoId}` | `cart.ts` |
| Favorites | `GET /favorites`, `POST/DELETE /favorites/{videoId}` | `favorites.ts` |
| Orders | `GET/POST /orders`, `GET /orders/{id}` | `orders.ts` |
| Payments | `POST /payments/initiate`, `/webhook`, `GET /payments/{orderId}/status` | `payments.ts` |
| Admin | `/admin/login`, `/admin/orders`, `/users`, `/videos`, `/videos/{id}/discount`, `/analytics/*` | `admin.ts` |
| Analytics | `POST /analytics/visit` | `analytics.ts` |

**Middlewares:**
- `requireAuth` — يتحقق من JWT للمستخدم
- `requireAdmin` — يتحقق من صلاحيات المدير

---

## 8. قاعدة البيانات (Database Schema)

PostgreSQL عبر Drizzle ORM. الملفات في `lib/db/src/schema/`.

| الجدول | الملف | الوصف |
|--------|-------|-------|
| `users` | `users.ts` | المستخدمون (user / admin) |
| `categories` | `categories.ts` | تصنيفات الدورات |
| `videos` | `videos.ts` | الدورات/الفيديوهات + HLS + معالجة |
| `reviews` | `reviews.ts` | التقييمات |
| `cart_items` | `cart.ts` | عناصر السلة |
| `favorites` | `favorites.ts` | المفضلة |
| `orders` | `orders.ts` | الطلبات |
| `order_items` | `orders.ts` | عناصر الطلب |
| `video_access` | `videoAccess.ts` | صلاحية الوصول بعد الشراء |
| `site_visits` | `analytics.ts` | زيارات الموقع |

**Enums:**
- `user_role`: `user` | `admin`
- `video_processing_status`: `none` | `uploaded` | `processing` | `ready` | `failed`
- `order_status`: (في `orders.ts`)

---

## 9. تدفق البيانات (Data Flow)

```
openapi.yaml
    │
    ├── orval codegen ──► lib/api-client-react/   (React Query hooks)
    │                 └──► lib/api-zod/           (Zod types)
    │
    ▼
artifacts/api-server  ◄──►  PostgreSQL (lib/db)
    │
    ▼
artifacts/video-courses  (fetch /api + Bearer token)
```

1. **تعديل API:** عدّل `lib/api-spec/openapi.yaml`
2. **توليد الكود:** `pnpm --filter @workspace/api-spec run codegen`
3. **تنفيذ الـ routes:** في `artifacts/api-server/src/routes/`
4. **استخدام من Frontend:** عبر hooks من `@workspace/api-client-react`

---

## 10. التشغيل والبناء (Commands)

```bash
# تثبيت التبعيات
pnpm install

# فحص الأنواع (كل الحزم)
pnpm run typecheck

# بناء كل شيء
pnpm run build

# ── Backend ──
pnpm --filter @workspace/api-server run dev     # port 5000
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start

# ── Frontend ──
pnpm --filter @workspace/video-courses run dev    # port 5000 (Vite)
pnpm --filter @workspace/video-courses run build
pnpm --filter @workspace/video-courses run serve

# ── DB ──
pnpm --filter @workspace/db run push              # push schema (dev)

# ── API Codegen ──
pnpm --filter @workspace/api-spec run codegen
```

---

## 11. متغيرات البيئة (Environment)

| المتغير | مطلوب | الوصف |
|---------|-------|-------|
| `DATABASE_URL` | نعم | PostgreSQL connection string |
| `SESSION_SECRET` | نعم | مفتاح توقيع JWT |
| `PORT` | لا | المنفذ (افتراضي: 5000) |
| `BASE_PATH` | لا | مسار أساسي للـ frontend |
| `NODE_ENV` | لا | `development` / `production` |

---

## 12. Hooks و State Management

| Hook | الملف | الوظيفة |
|------|-------|---------|
| `useAuth` | `use-auth.ts` | تسجيل الدخول/الخروج والمستخدم الحالي |
| `useCart` | `use-cart.ts` | سلة التسوق (Zustand + localStorage) |
| `useFavorites` | `use-favorites.ts` | المفضلة (Zustand + localStorage) |
| `useCompare` | `use-compare.ts` | مقارنة الدورات |
| `useAnalytics` | `use-analytics.ts` | تتبع الزيارات |
| `useTheme` | `use-theme.ts` | الوضع الفاتح/الداكن |
| `useScrollReveal` | `use-scroll-reveal.ts` | تأثيرات الظهور عند التمرير |
| `useDebounce` | `use-debounce.ts` | تأخير الإدخال |
| `useMobile` | `use-mobile.tsx` | كشف الشاشات الصغيرة |
| `useToast` | `use-toast.ts` | إشعارات Toast |

**المصادقة:**
- `auth_token` في localStorage — للمستخدمين
- `admin_token` في localStorage — للمدير
- يُحقن تلقائياً في `Authorization: Bearer` عبر interceptor في `App.tsx`

---

## 13. `lib/storage/` — تخزين S3

```
storage/
├── package.json          # @workspace/storage
└── tsconfig.json
```

حزمة AWS S3 (`@aws-sdk/client-s3` + presigner) — جاهزة للاستخدام مع رفع/تشغيل الفيديوهات (HLS keys في جدول `videos`).

---

## 14. `.agents/` — ذاكرة الوكيل

```
.agents/
├── memory/
│   ├── MEMORY.md
│   └── video-courses-platform.md   # قرارات معمارية وملاحظات
└── skills/
```

**ملاحظات مهمة (من الذاكرة):**
- Admin: `admin@videomontazh.ru` / `admin123`
- User: `user@example.com` / `user123`
- Zod v4 يجب externalize في `api-server/build.mjs`
- `useListOrders()` يرجع `Order[]` مباشرة (بدون wrapper)
- `thumbnailUrl` الفارغ يجب معالجته: `src={video.thumbnailUrl || undefined}`

---

## 15. علاقات الحزم (Dependencies)

```
video-courses
  └── @workspace/api-client-react
        └── (generated from api-spec)

api-server
  ├── @workspace/api-zod
  └── @workspace/db
        └── drizzle-orm + pg

api-spec
  └── orval → generates api-client-react + api-zod
```

---

## 16. ملفات التكوين الرئيسية

| الملف | الغرض |
|-------|-------|
| `pnpm-workspace.yaml` | تعريف workspace + catalog للإصدارات |
| `tsconfig.base.json` | إعدادات TypeScript المشتركة |
| `lib/api-spec/orval.config.ts` | إعداد Orval للتوليد |
| `lib/db/drizzle.config.ts` | إعداد Drizzle Kit |
| `artifacts/api-server/build.mjs` | esbuild bundle للـ API |
| `artifacts/video-courses/vite.config.ts` | Vite + aliases + Replit plugins |
| `artifacts/video-courses/components.json` | shadcn/ui config |
| `.replit` | إعدادات Replit deployment |
