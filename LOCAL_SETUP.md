# إعداد بيئة التطوير المحلية (Local Development Setup)

تم تصميم بيئة التطوير المحلية هذه لتكون **مطابقة تماماً لبيئة الإنتاج**. هذا يعني أن الكود الذي سيعمل لديك محلياً سيعمل على السيرفر (Production) دون الحاجة لتغيير أي سطر من الكود، فقط ستحتاج إلى تغيير قيم متغيرات البيئة.

تعتمد البيئة على:
- **MinIO**: كبديل محلي مطابق تماماً لـ AWS S3.
- **PostgreSQL**: كقاعدة بيانات.
- **FFmpeg**: لمعالجة وتحويل الفيديوهات إلى صيغة HLS بشكل تلقائي.

---

## 🛠 المتطلبات المسبقة (Prerequisites)

تأكد من تثبيت البرامج التالية على جهازك قبل البدء:

1. **Docker Desktop** (يجب أن يكون يعمل في الخلفية).
2. **Node.js** و **npm** (أو **pnpm**).
3. **FFmpeg**:
   - **على Windows**: افتح PowerShell كمسؤول (Administrator) وشغل: `choco install ffmpeg`
   - **على macOS**: `brew install ffmpeg`
   - **على Linux (Ubuntu)**: `sudo apt update && sudo apt install ffmpeg`

---

## 🚀 التثبيت السريع (الخطوة الواحدة)

قمنا بإعداد سكريبتات ذكية تقوم بكل شيء بالنيابة عنك:

### لمستخدمي Windows:
افتح PowerShell في مجلد المشروع وقم بتشغيل:
```powershell
.\scripts\setup-local.ps1
```

### لمستخدمي macOS / Linux:
افتح الطرفية (Terminal) في مجلد المشروع وقم بتشغيل:
```bash
chmod +x scripts/*.sh
./scripts/setup-local.sh
```

**ماذا يفعل السكريبت؟**
- يفحص وجود Docker و FFmpeg.
- يشغل الحاويات (MinIO, Postgres).
- ينسخ `.env.example` إلى `.env`.
- ينشئ باكت `videos-dev` في MinIO ويضبط سياسة CORS لتوافق المتصفح.
- يثبت الحزم `npm install`.
- يجهز قاعدة البيانات ويشغل הـ Migrations.

---

## ▶️ تشغيل النظام

بعد الانتهاء من الإعداد، يمكنك تشغيل النظام كاملاً (الخادم والواجهة) باستخدام:

**على Windows:**
```powershell
.\scripts\start-local.ps1
```

**على macOS / Linux:**
```bash
./scripts/start-local.sh
```

ستكون الخدمات متاحة على:
- **واجهة التطبيق (Frontend)**: http://localhost:5173
- **خادم الواجهة الخلفية (API)**: http://localhost:3000
- **لوحة تحكم MinIO**: http://localhost:9001 (minioadmin / minioadmin123)

---

## 🛑 إيقاف البيئة وتنظيفها

لإيقاف الخدمات بأمان ومسح الملفات المؤقتة للفيديوهات:

**إيقاف عادي (يحافظ على قاعدة البيانات وملفات MinIO):**
```powershell
# Windows
.\scripts\stop-local.ps1

# Unix
./scripts/stop-local.sh
```

**تنظيف شامل (يحذف جميع البيانات للبدء من الصفر):**
```powershell
# Windows
.\scripts\stop-local.ps1 -CleanAll

# Unix
./scripts/stop-local.sh --clean-all
```

---

## 🧪 اختبار النظام

لتتأكد من أن كل شيء يعمل بشكل سليم:

1. **دخول MinIO**: افتح `http://localhost:9001` وتأكد أن Bucket `videos-dev` موجود وإعدادات الوصول الخاصة به صحيحة (Private & CORS Active).
2. **رفع فيديو**: ادخل لوحة تحكم التطبيق كأدمن، قم بإنشاء دورة جديدة وارفع فيديو. سيبدأ الرفع مباشرة لـ MinIO (تأكد من أنك ترى الملف في لوحة MinIO).
3. **معالجة الفيديو**: أرسل طلب لمعالجة الفيديو (Process). ستعمل أداة FFmpeg في الخلفية وتنشئ ملفات `.m3u8` وقطع `.ts` للمعاينة (Preview) والكامل (Full).
4. **المشاهدة (المعاينة)**: افتح الفيديو كمستخدم عادي غير دافع، تأكد من توقف الفيديو بعد مدة المعاينة المجانية.
5. **المشاهدة الكاملة**: قم بإتمام طلب شراء للفيديو (Demo)، وبعد نجاح الدفع ستتمكن من إكمال الفيديو بنجاح.

---

## ⚙️ التهيئة اليدوية (اختياري)

إذا كنت لا تفضل السكريبتات الآلية وتريد إعداد كل شيء بنفسك، فهذه هي الخطوات:
1. `docker-compose up -d`
2. `cp .env.example .env` (وأيضاً ضعه في `artifacts/api-server/.env`)
3. `npm install`
4. ادخل لوحة MinIO (منفذ 9001) وأنشئ Bucket باسم `videos-dev`.
5. استخدم Postman أو أداة `mc` لضبط CORS للـ Bucket ليسمح بـ `http://localhost:5173`.
6. `npm run -w @workspace/db db:push`
7. `npm run dev`

---

## ❓ حل المشاكل الشائعة

- **خطأ CORS عند مشاهدة الفيديو**: 
  هذا يعني أن MinIO لا يسمح للمتصفح بقراءة الملف. تأكد من أن خطوة ضبط CORS في سكريبت `setup-local` نجحت، أو قم بضبطه يدوياً باستخدام لوحة تحكم MinIO أو سكريبتات `mc`.
- **خطأ 500 أثناء المعالجة (Processing Error)**:
  السبب الأرجح هو أن FFmpeg غير مثبت على نظامك، أو أن المسار المؤقت (Temp Directory) المُعرّف في `.env` (`VIDEO_TEMP_DIR`) لا توجد له صلاحيات للكتابة.
- **تطبيق Vite لا يجد الـ API**:
  تأكد من تشغيل `npm run dev` من جذر المشروع (Root) أو استخدام سكريبت `start-local` لضمان تشغيل الخادمين سوياً.

---

## 🚀 الانتقال للإنتاج (Deployment / Production)

نظراً لأن البيئة المحلية مطابقة للإنتاج، لا يوجد أي تغيير يذكر في الكود. **كل ما عليك فعله في سيرفر الإنتاج هو تغيير القيم في ملف `.env`:**

| المتغير المحلي (Local) | متغير الإنتاج (Production) | ملاحظات |
|-----------------|----------------------|---------|
| `NODE_ENV="development"` | `NODE_ENV="production"` | يغير سلوك الـ Logs والـ Express |
| `DATABASE_URL` | PostgreSQL URL الحقيقي | |
| `S3_ENDPOINT` | مسار S3 الحقيقي (AWS/R2/Space) | اتركها فارغة لـ AWS S3 الأصلي، واستخدم الرابط لـ Cloudflare R2 |
| `S3_BUCKET` | `videos-prod` | استبدل باكت التطوير بالباكت الإنتاجي |
| `S3_FORCE_PATH_STYLE` | `false` | عطلها إذا كنت تستخدم AWS S3. أبقها `true` إذا استخدمت MinIO |
| `FRONTEND_URL` | الدومين الخاص بك (مثلاً `https://mycourse.com`) | |
| `JWT_SECRET` | كلمة مرور قوية جداً (مثلاً `openssl rand -base64 32`) | **مهم جداً للحماية!** |

بالإضافة لذلك، تأكد من تثبيت FFmpeg فعلياً على الخادم الإنتاجي.
