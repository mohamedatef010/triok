# 🚀 دليل التحديث الشامل والمباشر من GitHub إلى سيرفر Beget VPS

هذا الدليل يشرح كيفية سحب التحديثات وتشغيل كل أجزاء الموقع (الواجهة، الخلفية، قاعدة البيانات، رفع الفيديوهات والصور عبر MinIO و Nginx) بنجاح 100% وبدون أي تعارض أو أخطاء.

---

## 📌 بيانات السيرفر والمشروع:
* **اسم الدومين:** `классный-фокус.рф` (Punycode: `xn----7sb1acdcpkxafxk9g.xn--p1ai`)
* **مسار المشروع على السيرفر:** `/var/www/video-courses`
* **بريد وكلمة مرور حساب الأدمن:** يتم تعيينها في ملف `.env` عبر `ADMIN_EMAIL` و `ADMIN_PASSWORD` (ثم تنفيذ `pnpm --filter scripts run seed-admin`)


---

## ⚡ الطريقة الأولى: التحديث التلقائي الفوري (بأمر واحد)

بعد رفعك للتعديلات من جهازك إلى GitHub عبر:
```bash
git add .
git commit -m "update: latest changes"
git push origin main
```

ادخل إلى السيرفر عبر SSH وشغّل هذا الأمر فقط:
```bash
cd /var/www/video-courses && bash deployment/deploy.sh
```

**هذا السكريبت يقوم تلقائياً بـ:**
1. سحب أحدث كود من GitHub (`git pull`).
2. فحص وتشغيل خدمات Docker (قاعدة البيانات + MinIO + Redis).
3. تجهيز مجلد المعالجة المؤقت للفيديوهات `/var/tmp/video-processing`.
4. تثبيت الحزم والمكتبات المطلوبة `pnpm install`.
5. تطبيق أي تعديلات في جداول قاعدة البيانات `db run push`.
6. التحقق من وجود حساب الأدمن `seed-admin`.
7. بناء خادم الـ API والواجهة الأمامية `run build`.
8. تحديث وضبط Nginx وإعادة تشغيل الخادم عبر PM2 بدون أي انقطاع للخدمة.

---

## 🛠️ الطريقة الثانية: التحديث اليدوي (خطوة بخطوة)

إذا أردت تنفيذ خطوات التحديث يدوياً خطوة بخطوة:

### 1. الدخول للسيرفر ومجلد المشروع
```bash
ssh root@5.35.87.221
cd /var/www/video-courses
```

### 2. سحب آخر التحديثات من GitHub
```bash
git pull origin main
```

### 3. تثبيت أي مكتبات جديدة
```bash
pnpm install
```

### 4. بناء المشروع وتحديث قاعدة البيانات
```bash
# تطبيق أي تحديث على جداول قاعدة البيانات
pnpm --filter @workspace/db run push

# بناء الخادم الخلفي (API)
pnpm --filter @workspace/api-server run build

# بناء الواجهة الأمامية (Frontend SPA)
pnpm --filter @workspace/video-courses run build
```

### 5. إعادة تشغيل الـ API و Nginx
```bash
# إعادة تشغيل الـ API مع تحديث المتغيرات
pm2 restart ecosystem.config.cjs --update-env

# إعادة تحميل Nginx
sudo cp deployment/nginx.conf /etc/nginx/sites-available/video-courses.conf
sudo nginx -t && sudo systemctl reload nginx
```

---

## ⚙️ ملف المتغيرات البيئية للإنتاج (`.env`)

تأكد دائماً أن ملف `.env` داخل `/var/www/video-courses/.env` على السيرفر مضبوط بالقيم التالية:

```ini
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://xn----7sb1acdcpkxafxk9g.xn--p1ai
DATABASE_URL=postgresql://video_user:video_password@localhost:5034/video_courses_db

JWT_SECRET=super_secret_jwt_key_prod_beget_vps_2026_987654321
JWT_REFRESH_SECRET=super_secret_refresh_key_prod_beget_vps_2026_123456789
SESSION_SECRET=super_secret_session_key_prod_beget_vps_2026_abcdef123
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

S3_REGION=us-east-1
S3_ENDPOINT=https://xn----7sb1acdcpkxafxk9g.xn--p1ai
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123
S3_BUCKET=videos-prod
S3_FORCE_PATH_STYLE=true

FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
VIDEO_TEMP_DIR=/var/tmp/video-processing
SEGMENT_URL_TTL_SECONDS=7200
PLAYBACK_MANIFEST_TOKEN_TTL_SECONDS=600
```

---

## 🔍 أوامر الفحص والمراقبة السريعة

* **متابعة سجلات وأخطاء خادم الـ API مباشرة:**
  ```bash
  pm2 logs video-courses-api --lines 50
  ```

* **فحص حالة حاويات Docker:**
  ```bash
  docker ps
  ```

* **فحص استجابة الـ API:**
  ```bash
  curl -I https://xn----7sb1acdcpkxafxk9g.xn--p1ai/api/healthz
  ```
