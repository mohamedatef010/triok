# ابدأ من هنا — دليل سريع للمشروع

منصة **دورات فيديو** (video-courses) — monorepo بـ pnpm workspaces.

---

## خريطة سريعة

```
Attached-Assets/                    ← جذر المشروع (افتح هذا في Cursor)
│
├── frontend/README.md              ← 📱 كل ما يخص الواجهة (دليل)
├── backend/README.md               ← 🖥️  كل ما يخص الخادم (دليل)
├── PROJECT_STRUCTURE.md            ← 📋 الدليل التفصيلي الكامل
├── LOCAL_SETUP.md                  ← ⚙️  إعداد البيئة المحلية
│
├── artifacts/                      ← التطبيقات القابلة للتشغيل
│   ├── api-server/                 ← 🖥️  BACKEND (Express API)
│   ├── video-courses/              ← 📱 FRONTEND (React + Vite)
│   └── mockup-sandbox/             ← 🎨 معاينة مكوّنات UI
│
├── lib/                            ← مكتبات مشتركة
│   ├── api-spec/                   ← 🖥️  OpenAPI spec
│   ├── api-zod/                    ← 🖥️  Zod types (مولَّد)
│   ├── api-client-react/           ← 📱 React Query client (مولَّد)
│   ├── db/                         ← 🖥️  PostgreSQL + Drizzle
│   └── storage/                    ← 🖥️  AWS S3
│
├── attached_assets/                ← 📱 صور وأصول Frontend
├── scripts/                        ← سكربتات مساعدة (setup, start, stop)
├── package.json                    ← جذر workspace
└── pnpm-workspace.yaml             ← تعريف الحزم
```

---



## Frontend vs Backend — باختصار


|                       | Frontend 📱                | Backend 🖥️              |
| --------------------- | -------------------------- | ------------------------ |
| **التطبيق الرئيسي**   | `artifacts/video-courses/` | `artifacts/api-server/`  |
| **اللغة / Framework** | React 19 + Vite            | Express 5 + TypeScript   |
| **قاعدة البيانات**    | —                          | `lib/db/`                |
| **API Client**        | `lib/api-client-react/`    | —                        |
| **API Spec**          | (يستهلك)                   | `lib/api-spec/` (يُعرّف) |
| **الصور**             | `attached_assets/`         | —                        |
| **التخزين السحابي**   | —                          | `lib/storage/`           |


---



## تشغيل سريع

```bash
# 1. تثبيت التبعيات (مرة واحدة)
pnpm install

# 2. Backend
pnpm --filter @workspace/api-server run dev

# 3. Frontend (نافذة terminal ثانية)
pnpm --filter @workspace/video-courses run dev
```

أو استخدم السكربتات الجاهزة:

- Windows: `scripts/start-local.ps1`
- Linux/Mac: `scripts/start-local.sh`

---



## أين أذهب؟


| أريد أن...         | اذهب إلى                                                          |
| ------------------ | ----------------------------------------------------------------- |
| أفهم Frontend      | `[frontend/README.md](frontend/README.md)`                        |
| أفهم Backend       | `[backend/README.md](backend/README.md)`                          |
| أعدّل صفحة ويب     | `artifacts/video-courses/src/pages/`                              |
| أعدّل API endpoint | `lib/api-spec/openapi.yaml` ثم `artifacts/api-server/src/routes/` |
| أعدّل جدول DB      | `lib/db/src/schema/`                                              |
| أرى كل التفاصيل    | `[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)`                    |


---

> **ملاحظة:** مجلدا `frontend/` و `backend/` في الجذر هما **أدلة تنقل فقط** — لم تُنقل الملفات الفعلية حتى لا يتعطل المشروع. المسارات الحقيقية ما زالت كما في `artifacts/` و `lib/`.

```bash
docker-compose up -d
pnpm --parallel --filter "@workspace/video-courses" --filter "@workspace/api-server" run dev
```

> **بيانات المدير (Admin):** يتم ضبط البريد الإلكتروني وكلمة المرور من خلال ملف `.env` عبر `ADMIN_EMAIL` و `ADMIN_PASSWORD` ثم تشغيل سكربت `pnpm --filter scripts run seed-admin`.