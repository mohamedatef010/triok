# Frontend — الواجهة الأمامية

> هذا المجلد **دليل تنقل فقط**. الملفات الفعلية لم تُنقل — ما زالت في أماكنها الأصلية داخل المشروع.

---

## أين الكود؟

| ماذا | المسار الفعلي |
|------|---------------|
| **التطبيق الرئيسي** (React + Vite) | `artifacts/video-courses/` |
| **Sandbox للمكوّنات** (معاينة UI) | `artifacts/mockup-sandbox/` |
| **عميل API لـ React** (hooks مولَّدة) | `lib/api-client-react/` |
| **الصور والأصول** | `attached_assets/` |

---

## هيكل التطبيق الرئيسي `artifacts/video-courses/`

```
artifacts/video-courses/
├── index.html              ← نقطة الدخول HTML
├── vite.config.ts          ← إعدادات Vite
├── package.json
├── public/                 ← favicon, robots.txt
└── src/
    ├── main.tsx            ← نقطة الدخول React
    ├── App.tsx             ← التطبيق + React Query + Auth
    ├── app-router.tsx      ← كل المسارات (Routes)
    ├── index.css           ← Tailwind + أنماط عامة
    │
    ├── pages/              ← الصفحات (كل route هنا)
    │   ├── home.tsx        ← /
    │   ├── catalog.tsx     ← /catalog
    │   ├── video-detail.tsx← /video/:id
    │   ├── cart.tsx        ← /cart
    │   ├── checkout.tsx    ← /checkout
    │   ├── payment.tsx     ← /payment/:orderId
    │   ├── favorites.tsx   ← /favorites
    │   ├── compare.tsx     ← /compare
    │   ├── profile.tsx     ← /profile
    │   ├── help.tsx        ← /help
    │   ├── contacts.tsx    ← /contacts
    │   ├── auth/           ← login, register
    │   └── admin/          ← لوحة الإدارة (/admm/*)
    │
    ├── components/
    │   ├── layout/         ← navbar, footer, layouts
    │   ├── ui/             ← 57 مكوّن shadcn-style
    │   └── logo.tsx
    │
    ├── hooks/              ← use-auth, use-cart, use-favorites, ...
    └── lib/
        └── utils.ts        ← cn() ومساعدات
```

---

## ماذا تعدّل عند...

| المطلوب | اذهب إلى |
|---------|----------|
| تغيير صفحة أو إضافة route | `artifacts/video-courses/src/pages/` + `app-router.tsx` |
| تغيير الشريط العلوي أو التذييل | `artifacts/video-courses/src/components/layout/` |
| تغيير مكوّن UI (زر، بطاقة، ...) | `artifacts/video-courses/src/components/ui/` |
| تغيير منطق السلة/المفضلة | `artifacts/video-courses/src/hooks/` |
| تغيير استدعاءات API | `lib/api-client-react/src/generated/` (مولَّد — لا تعدّل يدوياً) |
| تغيير شكل API | عدّل `lib/api-spec/openapi.yaml` ثم شغّل codegen |
| تغيير الصور | `attached_assets/` |

---

## أوامر التشغيل

```bash
# من جذر المشروع (Attached-Assets/)

# تشغيل Frontend في وضع التطوير
pnpm --filter @workspace/video-courses run dev

# بناء للإنتاج
pnpm --filter @workspace/video-courses run build

# تشغيل النسخة المبنية
pnpm --filter @workspace/video-courses run serve
```

---

## التقنيات

- React 19 + Vite 7 + Wouter (routing)
- Tailwind CSS 4 + Radix UI
- Zustand (cart, favorites, compare)
- React Query (من `@workspace/api-client-react`)

---

## راجع أيضاً

- `../backend/README.md` — الخادم وقاعدة البيانات
- `../PROJECT_STRUCTURE.md` — الدليل الكامل للمشروع
