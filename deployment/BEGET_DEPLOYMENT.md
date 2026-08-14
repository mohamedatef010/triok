# دليل رفع وتشغيل المشروع على استضافة Beget (Beget VPS Deployment Guide)

تم إعداد هذا الدليل لرفع وتشغيل مشروع منصة الدورات بالكامل (الواجهة الأمامية والواجهة الخلفية) على خادم VPS من Beget باستخدام **Nginx** كمستقبل للطلبات وموزع لها، و**PM2** لتشغيل خادم الـ Node.js في الخلفية بشكل دائم.

> [!NOTE]
> هذا الدليل يفترض أنك تستخدم نظام تشغيل **Ubuntu 20.04** أو **22.04** أو **24.04 LTS** على سيرفر الـ VPS الخاص بك في Beget.
> لم يتم تعديل أو حذف أي ملف من ملفات الكود الخاصة بك، وتم إنشاء ملفات التكوين هذه بشكل مستقل تماماً لتجهيز بيئة التشغيل.

---

## 1. المتطلبات الأساسية وتثبيتها على السيرفر

قبل أي شيء، قم بالاتصال بسيرفر Beget عبر SSH باستخدام Terminal أو Git Bash:
```bash
ssh root@YOUR_SERVER_IP
```

قم بتحديث الحزم وتثبيت الأدوات الأساسية:
```bash
sudo apt update && sudo apt upgrade -y
```

### أ. تثبيت Node.js (الإصدار 20 LTS أو أحدث)
سندمج مستودع NodeSource لتثبيت Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```
تأكد من نجاح التثبيت: `node -v` و `npm -v`

### ب. تثبيت pnpm
نظراً لأن المشروع يعتمد على Monorepo بـ `pnpm workspaces` لإدارة الحزم:
```bash
sudo npm install -g pnpm
```

### ج. تثبيت PM2
لإدارة تشغيل خادم backend (Express API) في الخلفية وإعادة تشغيله تلقائياً في حال حدوث أي توقف:
```bash
sudo npm install -g pm2
```

### د. تثبيت FFmpeg (مهم جداً لمعالجة وتشفير الفيديوهات)
الخادم يستخدم FFmpeg لتحويل ملفات الفيديو المرفوعة إلى صيغة HLS (ملفات `.m3u8` و `.ts` مجزأة) لضمان حماية الفيديو وسرعة التشغيل:
```bash
sudo apt install ffmpeg -y
```
تأكد من التثبيت بـ: `ffmpeg -version`

### هـ. تثبيت Nginx
سيعمل Nginx كخادم ويب أساسي يستقبل الزوار ويخدم الملفات الثابتة للواجهة الأمامية (SPA Frontend) مباشرة، ويقوم بتحويل طلبات الـ API إلى خادم Express الخلفي:
```bash
sudo apt install nginx -y
```

### و. تثبيت PostgreSQL (اختياري إذا لم تكن تستخدم قاعدة بيانات خارجية)
إذا كنت تريد استضافة قاعدة البيانات على نفس السيرفر:
```bash
sudo apt install postgresql postgresql-contrib -y
```

---

## 2. رفع ملفات المشروع إلى السيرفر

يمكنك رفع الملفات بعدة طرق:
* **عبر Git (موصى به)**: قم برفع مشروعك إلى مستودع خاص (Private Repository) على GitHub أو GitLab، ثم قم بعمل `git clone` داخل السيرفر في المسار `/var/www/video-courses`.
* **عبر SFTP/FileZilla**: ارفع مجلد المشروع كاملاً إلى `/var/www/video-courses` (مع استبعاد مجلدات `node_modules` و `dist` لتوفير الوقت والمساحة).

تأكد من تعيين الصلاحيات الصحيحة للمجلد:
```bash
sudo chown -R www-data:www-data /var/www/video-courses
sudo chmod -R 755 /var/www/video-courses
```

---

## 3. تكوين متغيرات البيئة (`.env`) للإنتاج

في السيرفر، انتقل إلى مجلد المشروع واستخدم ملف الإعدادات الجاهز `.env.production.example`:
```bash
cd /var/www/video-courses
cp deployment/.env.production.example .env
nano .env
```

القيم معدة مسبقاً وجاهزة لبيانات السيرفر والدومين كالتالي:

```ini
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://xn----7sb1acdcpkxafxk9g.xn--p1ai

# رابط قاعدة البيانات PostgreSQL (حاوية Docker على المنفذ 5034)
DATABASE_URL=postgresql://video_user:video_password@localhost:5034/video_courses_db

# مفاتيح الحماية والتوقيع لـ JWT و الجلسات
JWT_SECRET=super_secret_jwt_key_prod_beget_vps_2026_987654321
JWT_REFRESH_SECRET=super_secret_refresh_key_prod_beget_vps_2026_123456789
SESSION_SECRET=super_secret_session_key_prod_beget_vps_2026_abcdef123
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# إعدادات تخزين الفيديوهات والصور عبر MinIO (يمر عبر Nginx بـ HTTPS لتفادي Mixed Content)
S3_REGION=us-east-1
S3_ENDPOINT=https://xn----7sb1acdcpkxafxk9g.xn--p1ai
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123
S3_BUCKET=videos-prod
S3_FORCE_PATH_STYLE=true

# مسارات FFmpeg و FFprobe على السيرفر
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

# مجلد مؤقت لمعالجة الفيديوهات
VIDEO_TEMP_DIR=/var/tmp/video-processing
SEGMENT_URL_TTL_SECONDS=7200
PLAYBACK_MANIFEST_TOKEN_TTL_SECONDS=600
```

احفظ الملف بـ `Ctrl + O` ثم اضغط `Enter` ثم اخرج بـ `Ctrl + X`.

---

## 4. بناء المشروع (Build)

داخل مجلد المشروع `/var/www/video-courses` على السيرفر، قم بتشغيل الخطوات التالية لبناء تطبيقات الواجهة الأمامية والواجهة الخلفية:

1. **تثبيت التبعيات لـ Monorepo:**
   ```bash
   pnpm install
   ```

2. **توليد عميل الـ API ومخططات Zod (من مواصفة OpenAPI):**
   ```bash
   pnpm --filter @workspace/api-spec run codegen
   ```

3. **بناء خادم الواجهة الخلفية (Backend API Server):**
   ```bash
   pnpm --filter @workspace/api-server run build
   ```
   *سيقوم هذا ببناء ملفات الخادم في `artifacts/api-server/dist/index.mjs`.*

4. **بناء الواجهة الأمامية (Frontend SPA):**
   ```bash
   pnpm --filter @workspace/video-courses run build
   ```
   *سيقوم هذا ببناء الواجهة الأمامية ووضع الملفات الثابتة في `artifacts/video-courses/dist/public` ليتم قراءتها بواسطة Nginx.*

---

## 5. إعداد قاعدة البيانات PostgreSQL

إذا قمت بتثبيت PostgreSQL محلياً على السيرفر:

1. ادخل إلى سطر أوامر PostgreSQL:
   ```bash
   sudo -i -u postgres psql
   ```
2. أنشئ قاعدة البيانات والمستخدم وصلاحياته:
   ```sql
   CREATE DATABASE video_courses;
   CREATE USER db_user WITH PASSWORD 'db_password';
   GRANT ALL PRIVILEGES ON DATABASE video_courses TO db_user;
   ALTER DATABASE video_courses OWNER TO db_user;
   \q
   ```
3. قم بتطبيق الـ Schema والـ Migrations الخاصة بقاعدة البيانات (Drizzle ORM):
   ```bash
   pnpm --filter @workspace/db run push
   ```

---

## 6. تشغيل خادم الـ API باستخدام PM2

الآن سنقوم بتشغيل خادم الـ Node.js (API) ليعمل باستمرار في الخلفية على المنفذ `3000`:

1. ابدأ تشغيل الخادم باستخدام PM2 (موصى به باستخدام ملف التكوين لتجنب أخطاء المتغيرات البيئية):
   ```bash
   pm2 start ecosystem.config.cjs
   ```
   *أو يمكنك تشغيله يدوياً عبر تمرير إعدادات منفصلة لـ Node لتشغيل ملفات البيئة:*
   ```bash
   pm2 start artifacts/api-server/dist/index.mjs --name "video-courses-api" --node-args="--env-file=.env" --update-env
   ```
2. تأكد من تشغيل الخادم بنجاح وبدون أخطاء:
   ```bash
   pm2 status
   pm2 logs video-courses-api
   ```
3. احفظ حالة PM2 وتأكد من تشغيله تلقائياً عند إعادة تشغيل السيرفر (System startup script):
   ```bash
   pm2 save
   pm2 startup
   ```
   *(قم بنسخ وتشغيل الأمر الناتج من `pm2 startup` لتفعيل تشغيل الخدمة مع النظام).*

---

## 7. إعداد خادم Nginx وتفعيل SSL (Let's Encrypt)

لقد أعددنا لك ملف الإعدادات الجاهز [nginx.conf](file:///c:/Users/moham/Downloads/Attached-Assets/Attached-Assets/deployment/nginx.conf).

### أ. نسخ ملف الإعدادات وتخصيصه
1. انسخ محتويات ملف [nginx.conf](file:///c:/Users/moham/Downloads/Attached-Assets/Attached-Assets/deployment/nginx.conf) إلى ملف جديد في Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/video-courses.conf
   ```
2. لقد قمنا بالفعل بتضمين الدومين الخاص بك `классный-фокус.рф` (بصيغة Punycode: `xn----7sb1acdcpkxafxk9g.xn--p1ai`) داخل ملف `nginx.conf` الجاهز، لذا لا تحتاج لتعديله إلا إذا قمت بتغيير الدومين لاحقاً.
3. تأكد من أن مسار الـ `root` يطابق المسار الذي رفعت فيه مشروعك:
   `/var/www/video-courses/artifacts/video-courses/dist/public;`
4. احفظ واخرج (`Ctrl + O`, `Enter`, `Ctrl + X`).

### ب. تفعيل الموقع واختبار الإعدادات
1. أنشئ رابطاً رمزياً (Symlink) لتفعيل الموقع في Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/video-courses.conf /etc/nginx/sites-enabled/
   ```
2. قم بتعطيل الموقع الافتراضي لـ Nginx لتجنب التعارض:
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```
3. اختبر إعدادات Nginx للتأكد من خلوها من الأخطاء الإملائية والتقنية:
   ```bash
   sudo nginx -t
   ```
   *(يجب أن يظهر لك رسالة تفيد بأن التكوين ناجح: `syntax is ok` و `test is successful`)*.

4. أعد تشغيل Nginx لتطبيق التغييرات:
   ```bash
   sudo systemctl restart nginx
   ```

### ج. تفعيل شهادة SSL المجانية (Certbot / Let's Encrypt)
لحماية بيانات المستخدمين وتأمين الاتصال (HTTPS)، نقوم بتثبيت شهادة SSL مجانية:

1. ثبت Certbot وإضافة Nginx:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
2. قم بتشغيل Certbot للحصول على الشهادة وتحديث إعدادات Nginx تلقائياً (نستخدم صيغة Punycode للدومين الروسي):
   ```bash
   sudo certbot --nginx -d xn----7sb1acdcpkxafxk9g.xn--p1ai -d www.xn----7sb1acdcpkxafxk9g.xn--p1ai
   ```
3. اتبع التعليمات على الشاشة (ادخل بريدك الإلكتروني ووافق على الشروط). سيقوم Certbot تلقائياً بتحديث ملف `video-courses.conf` وربطه بالشهادات المنشأة وإعادة تشغيل Nginx.

---

## 8. التحقق والاختبار

الآن بعد إتمام الخطوات:
1. قم بزيارة موقعك عبر المتصفح: `https://классный-фокус.рф` (أو بالصيغة `https://xn----7sb1acdcpkxafxk9g.xn--p1ai`). يجب أن تفتح واجهة المستخدم مباشرة وبسرعة فائقة.
2. اختبر تسجيل الدخول أو استعلام الـ API بزيارة: `https://классный-фокус.рф/api/healthz`. يجب أن ترجع النتيجة كـ JSON: `{"status":"ok"}`.
3. اختبر رفع فيديو من لوحة التحكم للتأكد من أن السيرفر يعالج الفيديو باستخدام FFmpeg ويرفعه إلى S3/R2 بنجاح وبدون مشاكل CORS أو قيود حجم الملفات الكبيرة.

---
**مبارك! تم نشر موقعك وتشغيله بنجاح وأمان وبأفضل إعدادات الأداء على سيرفر Beget.**
