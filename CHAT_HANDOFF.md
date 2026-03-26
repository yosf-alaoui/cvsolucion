# CVsolucion Chat Handoff

آخر تحديث لهذا الملخص:
- التاريخ: `2026-03-26`
- آخر commit: `d8b586f`

## 1. نظرة سريعة

هذا المشروع هو موقع `CVsolucion` لخدمات `Cabinet Vision` ويحتوي حالياً على:
- واجهة `React + Vite`
- خادم `Node/Express`
- تشغيل عبر `PM2`
- نظام مقالات متعدد اللغات
- نظام حجز مواعيد
- شات ذكي مع handoff إلى نموذج بيانات العميل
- تحسينات SEO أساسية ومهمة

## 2. الملفات الأهم

### الواجهة
- `client/src/App.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Booking.tsx`
- `client/src/pages/Articles.tsx`
- `client/src/pages/ArticleDetail.tsx`
- `client/src/pages/AdminDashboard.tsx`
- `client/src/pages/Login.tsx`
- `client/src/components/ChatWidget.tsx`
- `client/src/components/Seo.tsx`
- `client/src/index.css`

### الخادم
- `server/index.ts`
- `server/chatAssistant.ts`
- `server/bookingStore.ts`
- `server/articleStore.ts`
- `server/articleTranslation.ts`
- `server/contactStore.ts`
- `server/chatStore.ts`

## 3. حالة الشات الحالية

منطق الشات الأساسي موجود في:
- `server/chatAssistant.ts`
- `client/src/components/ChatWidget.tsx`
- `server/index.ts`

### ما يفعله الآن
- يستخدم `OpenAI Responses API`
- مربوط الآن بكائن prompt جاهز من OpenAI:
  - `pmpt_69c50c1ccf708195957c9b8b143df409001a07536ed2078a`
- صيغة الربط الحالية الصحيحة:
  - `prompt: { id: promptId }`
- الردود مضغوطة لتبقى قصيرة جداً
- إذا فهم نوع الخدمة، ينتقل مباشرة إلى نموذج البيانات

### أنواع الخدمة التي يلتقطها
- `support`
- `training`
- `design_pricing`
- `consultation`

### بيانات الـhandoff الإلزامية في الشات
- `name`
- `country`
- `email`
- `phone`

### ملاحظات مهمة للشات
- أي تعديل على شخصية الشات يبدأ من `server/chatAssistant.ts`
- أي تعديل على فورم الشات يبدأ من `client/src/components/ChatWidget.tsx`
- أي تعديل على حفظ المحادثات أو الـAPI يبدأ من `server/index.ts` و`server/chatStore.ts`

## 4. حالة الحجز الحالية

الملفات الأساسية:
- `client/src/pages/Booking.tsx`
- `client/src/lib/bookings.ts`
- `server/bookingStore.ts`
- `server/index.ts`

### ما يفعله الآن
- الحجز يتطلب تسجيل الدخول أولاً
- المستخدم يستطيع اختيار حتى `3` أوقات مفضلة
- أول وقت هو `Primary slot`
- الأوقات الأخرى تُرسل كبدائل داخل `notes`

### منطق المواعيد الحالي
- `standard`:
  - ساعات كيبيك
  - لا يعرض ساعات اليوم التي انتهت فعلاً
  - توجد مواعيد عرض مملوءة لإعطاء الثقة
- `express`:
  - اليوم والغد فقط
  - ساعات اليوم تتبع الوقت الحقيقي حتى المساء

### إذا ظهر خلل في المواعيد
- ابدأ من `server/bookingStore.ts`
- إذا كان الخلل في عرض الواجهة أو اختيار أكثر من وقت، ابدأ من `client/src/pages/Booking.tsx`

## 5. حالة المقالات الحالية

الملفات الأساسية:
- `client/src/components/admin/ArticlesManager.tsx`
- `client/src/pages/Articles.tsx`
- `client/src/pages/ArticleDetail.tsx`
- `client/src/lib/articleBody.ts`
- `server/articleStore.ts`
- `server/articleTranslation.ts`
- `server/index.ts`

### ما يفعله الآن
- إنشاء المقال من الداشبورد
- حفظ متعدد اللغات
- ترجمة تلقائية عند الحفظ إلى اللغتين الأخريين باستخدام OpenAI
- عرض المقال حسب لغة الموقع

### إذا ظهر خلل في الترجمة
- ابدأ من `server/articleTranslation.ts`
- ثم راجع بنية التخزين في `server/articleStore.ts`

## 6. حالة SEO الحالية

الملفات الأساسية:
- `server/seo.ts`
- `server/index.ts`
- `client/index.html`
- `client/src/components/Seo.tsx`

### ما تم سابقاً
- fallback HTML قابل للفهرسة
- `canonical`
- `hreflang`
- `robots.txt`
- `sitemap.xml`
- structured data
- `www -> non-www 301`

## 7. النشر والتشغيل

### محلياً
استخدم:
- `pnpm.cmd run check`
- `pnpm.cmd run build`

ملحوظة:
- في بعض جلسات PowerShell، `pnpm` قد يفشل بسبب execution policy
- استخدم `pnpm.cmd` بدل `pnpm`

### على الخادم
- الخادم يعمل عبر `PM2`
- اسم العملية:
  - `cvsolucion`

النشر المستخدم مؤخراً:
- بناء `dist`
- ضغطها في `dist-deploy.tar.gz`
- رفعها إلى الخادم
- فكها داخل `/var/www/cvsolucion`
- إعادة تشغيل `pm2`

### معلومات تشغيل مهمة
- الدومين الأساسي: `https://cvsolucion.com`
- هناك خادم نشر فعلي تم استخدامه سابقاً
- لا تحفظ كلمات المرور أو الأسرار داخل هذا الملف

## 8. النسخ المرجعية

نسخ تم تثبيتها سابقاً:
- `v1.0`
- `v2.0`
- `v3.0`

آخر نسخة عمل حالية في Git:
- `d8b586f`

## 9. آخر تعديلات مهمة قبل هذا الملخص

- `3b06697` فرض handoff للشات بعد فهم نوع الخدمة
- `574037b` فرض تسجيل الدخول قبل الحجز
- `c7b5f72` تحسين اختيار عدة أوقات في الحجز + تعديل prompt الشات
- `d58d263` تنظيف إشارة `[[SUPPORT_FORM]]`
- `f4050c1` الحفاظ على سؤال قصير بعد التحية
- `c24b0eb` ربط الشات بـ prompt object من OpenAI
- `d8b586f` تصحيح صيغة مرجع الـprompt إلى `prompt: { id: ... }`

## 10. أشياء يجب أن يعرفها أي شات جديد فوراً

- لا تعتمد على `vite dev` للحكم النهائي على الشكل
- الأفضل دائماً التحقق على build الإنتاج
- لا تُخزن أسرار أو كلمات مرور داخل ملفات المشروع
- يوجد ملفات غير متتبعة في الجذر مثل:
  - أرشيفات
  - تقارير PDF
  - ملفات lighthouse
  - هذه ليست تعديلات كود ولا يجب اعتبارها جزءاً من العمل

## 11. نقطة البداية لأي شات جديد

إذا بدأ شات جديد، فهذه هي الأولويات لفهم المشروع بسرعة:
1. اقرأ هذا الملف أولاً
2. اقرأ `server/index.ts`
3. اقرأ `server/chatAssistant.ts`
4. اقرأ `client/src/components/ChatWidget.tsx`
5. اقرأ `client/src/pages/Booking.tsx`
6. اقرأ `server/bookingStore.ts`
7. اقرأ `client/src/components/admin/ArticlesManager.tsx`
8. اقرأ `server/articleTranslation.ts`

## 12. الهدف من هذا الملف

هذا الملف موجود حتى لا يضيع الشات الجديد في:
- إعادة اكتشاف بنية المشروع
- نسيان آخر القرارات
- الخلط بين ما هو مستقر وما هو تجريبي

