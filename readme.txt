مشروع: cvsolucion

البيئة على السيرفر:
- نظام: Ubuntu 24.04
- Node: 20.19.6
- npm: 10.8.2
- pnpm: 10.27.0

المسارات والنسخ:
- المسار الحي: /var/www/cvsolucion
- مسار staging: /var/www/cvsolucion_update
- نسخة احتياطية قديمة: /root/backup-cvsolucion-20260111-0953.tar.gz
- عند كل نشر: احتفظ بـ /var/www/cvsolucion_prev_YYYYMMDD-HHMM للتراجع السريع.

التشغيل:
- PM2: اسم العملية cvsolucion يشغّل dist/index.js (من مشروع Node) على المنفذ 3000.
  أوامر أساسية: pm2 restart cvsolucion / pm2 logs cvsolucion --lines 50 / pm2 ls
- Nginx: proxy إلى 127.0.0.1:3000 مع SSL وملفات ثابتة وكاش.
  الملف: /etc/nginx/sites-available/cvsolucion.conf (مفعل عبر sites-enabled)

البيئة (.env) المطلوبة داخل مجلد النشر:
- VITE_SUPABASE_URL=https://fdwknruflhlshhhcximb.supabase.co
- VITE_SUPABASE_ANON_KEY= (المفتاح الذي زودته)
- تأكد من نسخ .env بعد فك الأرشيف وقبل build.

تغييرات مهمة (كود ووظائف):
- إضافة تكامل Supabase Auth وإخفاء الأسعار حتى تسجيل الدخول وتأكيد البريد.
- صفحة Login: عرض/إخفاء كلمة المرور، نسيان كلمة المرور، تدفق استعادة كلمة المرور (updateUser) مع إعادة توجيه بعد النجاح.
- Header: زر لغة + زر Sign in/up كروابط menu، إزالة زر WhatsApp من الهيدر. عند تسجيل الدخول يظهر فقط Sign out.
- إصلاحات Training/hero والترجمات: تمت إعادة بناء translations.ts بترجمات إنج/فر/عربية نظيفة. (الملف كبير؛ يُرجى الاحتفاظ به كما هو).
- CSP في Nginx تم تحديثه ليسمح Supabase و j.clarity.ms.

سياسة الأمان (CSP) في Nginx (سطر واحد فقط):
- يحتوي connect-src على:
  https://fdwknruflhlshhhcximb.supabase.co و wss://fdwknruflhlshhhcximb.supabase.co
  https://*.supabase.co و wss://*.supabase.co
  https://e.clarity.ms https://c.clarity.ms https://j.clarity.ms
  وبقية النطاقات (GA/FB/Tag Manager/Tawk/WhatsApp...).
- إذا عدلت، تأكد من بقاء سطر واحد فقط لـ add_header Content-Security-Policy.
- اختبار وإعادة تحميل: nginx -t && systemctl reload nginx
- تحقق من الهيدر: curl -I https://cvsolucion.com/login | grep -i content-security-policy

خطوات نشر مختصرة:
1) من جهازك: tar -czf cvsolucion.tar.gz --exclude=node_modules --exclude=dist --exclude=.git .
2) ارفع الأرشيف إلى /root أو /var/www/cvsolucion_update.
3) على السيرفر:
   cd /var/www/cvsolucion_update
   rm -rf ./*
   mv /root/cvsolucion.tar.gz .
   tar -xzf cvsolucion.tar.gz
   rm cvsolucion.tar.gz
   [ -f /var/www/cvsolucion/.env ] && cp /var/www/cvsolucion/.env .env   # أو ضع القيم يدوياً
   pnpm install --frozen-lockfile
   pnpm run build
4) تبديل سريع:
   cd /var/www
   mv cvsolucion cvsolucion_prev_$(date +%Y%m%d-%H%M)
   mv cvsolucion_update cvsolucion
   pm2 restart cvsolucion
   pm2 logs cvsolucion --lines 50
5) عند تعديل Nginx: nginx -t && systemctl reload nginx
6) للتراجع: احذف cvsolucion، أعد تسمية cvsolucion_prev_* إلى cvsolucion، ثم pm2 restart.

ملاحظات:
- أخطاء “Blocked by client” تأتي من إضافات المتصفح (Adblock/Privacy)، ليست من السيرفر.
- أخطاء Supabase/CSP تُحل بإضافة النطاقات داخل connect-src في السطر نفسه.
- عند الاستعادة من البريد: رابط الاستعادة يضيف ?recovery=1 ويجب أن يحتوي access_token/refresh_token في الهاش ليحدث updateUser بنجاح.
- ملفات الترجمة ضخمة؛ احتفظ بالنسخة الحالية (client/src/i18n/translations.ts) لأنها تحتوي الترجمات المصححة والـ SEO.
- التشغيل على المنفذ 3000 خلف Nginx (80/443)، ملفات ثابتة تُقدّم عبر Nginx.