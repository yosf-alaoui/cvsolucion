export const LAST_UPDATED = "04/2026";

const CONTACT_EMAIL = "contact@cvsolucion.com";
const WHATSAPP_NUMBER_DISPLAY = "+1 438 807 8747";
const WHATSAPP_LINK = "https://wa.me/14388078747";

export function PrivacyPolicyContent({ locale = "en" }: { locale?: "en" | "fr" | "ar" }) {
  if (locale === "ar") {
    return (
      <div>
        <p>
          توضح سياسة الخصوصية هذه كيف تقوم CVsolucion بجمع المعلومات الشخصية واستخدامها وحمايتها عند زيارة الموقع أو طلب الدعم أو التواصل معنا.
        </p>

        <p><strong>آخر تحديث:</strong> {LAST_UPDATED}</p>

        <h4>1) المعلومات التي نجمعها</h4>
        <ul>
          <li>بيانات التواصل مثل الاسم والبريد الإلكتروني والهاتف واسم الشركة عند تقديمها.</li>
          <li>تفاصيل الخدمة المتعلقة بإعداد Cabinet Vision والمكتبات والمخرجات والمشكلات التقنية.</li>
          <li>بيانات تقنية أساسية مثل نوع الجهاز والمتصفح والصفحات التي تمت زيارتها.</li>
        </ul>

        <h4>2) كيفية استخدام المعلومات</h4>
        <ul>
          <li>الرد على الطلبات وتقديم الخدمات المطلوبة.</li>
          <li>تشخيص المشكلات وتقديم التوصيات.</li>
          <li>تحسين الموقع وجودة الخدمة.</li>
          <li>التواصل مع العميل بخصوص الطلب أو الحجز.</li>
        </ul>

        <h4>3) ملفات الارتباط والتحليلات</h4>
        <p>قد نستخدم أدوات تحليل وملفات ارتباط لفهم الاستخدام وتحسين التجربة. يمكنك التحكم فيها من خلال إعدادات المتصفح.</p>

        <h4>4) مشاركة البيانات</h4>
        <p>لا نبيع بياناتك. وقد نشارك بيانات محدودة فقط عند الحاجة مع مزودي الاستضافة أو التحليلات أو عند وجود التزام قانوني.</p>

        <h4>5) الأمان</h4>
        <p>نطبق وسائل حماية معقولة، ولكن لا يوجد نظام آمن بنسبة 100%.</p>

        <h4>6) الاحتفاظ بالبيانات</h4>
        <p>نحتفظ بالبيانات طالما كان ذلك ضروريًا لتقديم الخدمة أو للامتثال القانوني أو لحل النزاعات.</p>

        <h4>7) حقوقك</h4>
        <p>يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها وفقًا للقانون المعمول به.</p>

        <h4>8) التواصل</h4>
        <p>
          البريد الإلكتروني: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <br />
          واتساب: <a className="underline" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">{WHATSAPP_NUMBER_DISPLAY}</a>
        </p>
      </div>
    );
  }

  if (locale === "fr") {
    return (
      <div>
        <p>
          Cette politique de confidentialite explique comment CVsolucion collecte, utilise et protege les informations personnelles lorsque vous visitez notre site, demandez du support ou nous contactez.
        </p>

        <p><strong>Derniere mise a jour :</strong> {LAST_UPDATED}</p>

        <h4>1) Informations collecteess</h4>
        <ul>
          <li>Coordonnees: nom, email, telephone, entreprise si fournie.</li>
          <li>Informations de service: details sur votre configuration Cabinet Vision, bibliotheques, sorties CNC et problemes.</li>
          <li>Donnees techniques de base: appareil, navigateur, pages visitees.</li>
        </ul>

        <h4>2) Utilisation des informations</h4>
        <ul>
          <li>Repondre a vos demandes et fournir les services.</li>
          <li>Diagnostiquer les problemes et proposer des solutions.</li>
          <li>Ameliorer le site et la qualite du support.</li>
          <li>Communiquer avec vous a propos de vos demandes ou bookings.</li>
        </ul>

        <h4>3) Cookies et analytics</h4>
        <p>Nous pouvons utiliser des cookies et outils analytics pour comprendre l'utilisation du site et ameliorer l'experience.</p>

        <h4>4) Partage</h4>
        <p>Nous ne vendons pas vos donnees. Un partage limite peut avoir lieu avec des prestataires techniques ou lorsque la loi l'exige.</p>

        <h4>5) Securite</h4>
        <p>Nous appliquons des mesures de protection raisonnables, sans pouvoir garantir une securite absolue.</p>

        <h4>6) Conservation</h4>
        <p>Nous conservons les donnees aussi longtemps que necessaire pour le service, la conformite legale ou la resolution de litiges.</p>

        <h4>7) Vos droits</h4>
        <p>Vous pouvez demander l'acces, la correction ou la suppression de vos donnees selon la loi applicable.</p>

        <h4>8) Contact</h4>
        <p>
          Email : <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <br />
          WhatsApp : <a className="underline" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">{WHATSAPP_NUMBER_DISPLAY}</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <p>
        This Privacy Policy explains how CVsolucion collects, uses, and protects personal information when you visit our website, request support, or contact us.
      </p>

      <p><strong>Last updated:</strong> {LAST_UPDATED}</p>

      <h4>1) What we collect</h4>
      <ul>
        <li>Contact information such as name, email, phone, and company name when provided.</li>
        <li>Service information related to your Cabinet Vision setup, libraries, outputs, and technical issues.</li>
        <li>Basic technical data such as device type, browser, and visited pages.</li>
      </ul>

      <h4>2) How we use information</h4>
      <ul>
        <li>Respond to requests and deliver services.</li>
        <li>Diagnose issues and recommend solutions.</li>
        <li>Improve the website and support quality.</li>
        <li>Communicate with you about your request or booking.</li>
      </ul>

      <h4>3) Cookies and analytics</h4>
      <p>We may use cookies and analytics tools to understand usage and improve the experience.</p>

      <h4>4) Sharing</h4>
      <p>We do not sell your data. Limited sharing may occur with technical providers or when required by law.</p>

      <h4>5) Security</h4>
      <p>We apply reasonable protections, but no system is 100% secure.</p>

      <h4>6) Retention</h4>
      <p>We keep data only as long as needed for service delivery, legal compliance, or dispute resolution.</p>

      <h4>7) Your rights</h4>
      <p>You may request access, correction, or deletion of your data, subject to applicable law.</p>

      <h4>8) Contact</h4>
      <p>
        Email: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <br />
        WhatsApp: <a className="underline" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">{WHATSAPP_NUMBER_DISPLAY}</a>
      </p>
    </div>
  );
}

export function TermsContent({ locale = "en" }: { locale?: "en" | "fr" | "ar" }) {
  if (locale === "ar") {
    return (
      <div>
        <p>
          مرحبًا بك في CVsolucion. عند الوصول إلى موقعنا أو استخدام خدماتنا، فإنك توافق على شروط وأحكام الاستخدام التالية.
        </p>

        <p><strong>آخر تحديث:</strong> {LAST_UPDATED}</p>

        <h4>1) الخدمات</h4>
        <p>تقدم CVsolucion خدمات استشارية احترافية متعلقة بـ Cabinet Vision، وتشمل على سبيل المثال لا الحصر:</p>
        <ul>
          <li>إعداد البرنامج وتهيئته</li>
          <li>إنشاء المكتبات وتخصيصها</li>
          <li>الدعم التقني وحل المشكلات</li>
          <li>جلسات التدريب والاستشارات</li>
        </ul>
        <p>يتم تقديم جميع الخدمات عن بُعد ما لم يتم الاتفاق على خلاف ذلك.</p>

        <h4>2) الحجز والدفع</h4>
        <ul>
          <li>يجب حجز جميع الجلسات عبر الموقع.</li>
          <li>يجب إتمام الدفع مسبقًا لتأكيد الحجز.</li>
          <li>تتم معالجة المدفوعات بأمان عبر مزودي دفع خارجيين مثل Stripe.</li>
          <li>العميل مسؤول عن صحة معلومات الفوترة.</li>
        </ul>

        <h4>3) سياسة الاسترجاع</h4>
        <ul>
          <li>لا يتم تقديم استرجاع بعد تنفيذ الجلسة.</li>
          <li>إذا تم الإلغاء قبل 24 ساعة على الأقل من الموعد، فقد يتم عرض إعادة جدولة أو استرجاع.</li>
          <li>الجلسات الفائتة بدون إشعار مسبق غير قابلة للاسترجاع.</li>
        </ul>

        <h4>4) مسؤوليات العميل</h4>
        <p>يوافق العميل على:</p>
        <ul>
          <li>تقديم معلومات دقيقة</li>
          <li>توفير الوصول إلى البرامج والملفات المطلوبة</li>
          <li>التواجد في الوقت المحدد للجلسة</li>
        </ul>
        <p>أي تأخير أو مشكلة ناتجة عن العميل لا تؤهل للاسترجاع.</p>

        <h4>5) الملكية الفكرية</h4>
        <p>
          جميع المواد والسكربتات والمكتبات والحلول المقدمة تبقى ملكية فكرية لـ CVsolucion ما لم يتم الاتفاق على غير ذلك.
          يُمنح العميل ترخيص استخدام داخلي لأغراض العمل فقط، ولا يسمح بإعادة التوزيع أو إعادة البيع.
        </p>

        <h4>6) تحديد المسؤولية</h4>
        <p>لا تتحمل CVsolucion المسؤولية عن:</p>
        <ul>
          <li>خسائر الإنتاج</li>
          <li>أخطاء الآلات</li>
          <li>سوء استخدام البرامج أو الإعدادات</li>
        </ul>
        <p>جميع التوصيات تقدم على أساس إرشاد مهني.</p>

        <h4>7) السرية</h4>
        <p>يتم التعامل مع بيانات العملاء وتفاصيل المشاريع بسرية، ولن تتم مشاركتها مع أي طرف ثالث.</p>

        <h4>8) التعديلات</h4>
        <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم نشر أي تحديثات على هذه الصفحة.</p>

        <h4>9) القانون المعمول به</h4>
        <p>تخضع هذه الشروط للقوانين المعمول بها في الجهة القضائية التي تعمل ضمنها CVsolucion.</p>

        <h4>10) التواصل</h4>
        <p>
          البريد الإلكتروني: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    );
  }

  if (locale === "fr") {
    return (
      <div>
        <p>
          Bienvenue chez CVsolucion. En accedant a notre site ou en utilisant nos services, vous acceptez les presentes conditions d'utilisation.
        </p>

        <p><strong>Derniere mise a jour :</strong> {LAST_UPDATED}</p>

        <h4>1) Services</h4>
        <p>CVsolucion fournit des services professionnels lies a Cabinet Vision, notamment :</p>
        <ul>
          <li>Configuration et parametrage du logiciel</li>
          <li>Creation et personnalisation de bibliotheques</li>
          <li>Support technique et depannage</li>
          <li>Formation et conseil</li>
        </ul>
        <p>Tous les services sont fournis a distance, sauf accord contraire.</p>

        <h4>2) Reservation et paiement</h4>
        <ul>
          <li>Toutes les sessions doivent etre reservees via le site web.</li>
          <li>Le paiement est requis a l'avance pour confirmer la reservation.</li>
          <li>Les paiements sont traites de maniere securisee via des prestataires tiers, notamment Stripe.</li>
          <li>Le client est responsable de l'exactitude des informations de facturation.</li>
        </ul>

        <h4>3) Politique de remboursement</h4>
        <ul>
          <li>Aucun remboursement une fois la session realisee.</li>
          <li>En cas d'annulation au moins 24 heures avant la session, un report ou un remboursement peut etre propose.</li>
          <li>Toute session manquee sans preavis n'est pas remboursable.</li>
        </ul>

        <h4>4) Responsabilites du client</h4>
        <p>Le client s'engage a :</p>
        <ul>
          <li>Fournir des informations exactes</li>
          <li>Assurer l'acces aux logiciels et fichiers necessaires</li>
          <li>Etre present a l'heure prevue</li>
        </ul>
        <p>Les retards ou problemes causes par le client ne donnent pas droit a remboursement.</p>

        <h4>5) Propriete intellectuelle</h4>
        <p>
          Tous les supports, scripts, bibliotheques et solutions fournis restent la propriete intellectuelle de CVsolucion sauf accord contraire.
          Le client recoit une licence d'utilisation interne uniquement. Toute revente ou redistribution est interdite.
        </p>

        <h4>6) Limitation de responsabilite</h4>
        <p>CVsolucion n'est pas responsable des :</p>
        <ul>
          <li>Pertes de production</li>
          <li>Erreurs machine</li>
          <li>Mauvais usage du logiciel ou des configurations</li>
        </ul>
        <p>Toutes les recommandations sont fournies a titre de conseil professionnel.</p>

        <h4>7) Confidentialite</h4>
        <p>Toutes les donnees client et details de projet sont traites comme confidentiels et ne sont pas partages avec des tiers.</p>

        <h4>8) Modifications</h4>
        <p>Nous nous reservons le droit de modifier ces conditions a tout moment. Les mises a jour seront publiees sur cette page.</p>

        <h4>9) Droit applicable</h4>
        <p>Ces conditions sont regies par les lois applicables dans la juridiction ou CVsolucion exerce ses activites.</p>

        <h4>10) Contact</h4>
        <p>
          Email : <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <p>
        Welcome to CVsolucion. By accessing or using our website and services, you agree to the following Terms and Conditions.
      </p>

      <p><strong>Last updated:</strong> {LAST_UPDATED}</p>

      <h4>1) Services</h4>
      <p>CVsolucion provides professional consulting services related to Cabinet Vision, including but not limited to:</p>
      <ul>
        <li>Software setup and configuration</li>
        <li>Library creation and customization</li>
        <li>Technical support and troubleshooting</li>
        <li>Training sessions and consulting</li>
      </ul>
      <p>All services are delivered remotely unless otherwise agreed.</p>

      <h4>2) Booking and Payments</h4>
      <ul>
        <li>All sessions must be booked through the website.</li>
        <li>Payment is required in advance to confirm the booking.</li>
        <li>Payments are processed securely via third-party providers such as Stripe.</li>
        <li>The client is responsible for ensuring correct billing information.</li>
      </ul>

      <h4>3) Refund Policy</h4>
      <ul>
        <li>No refunds once the session has been delivered.</li>
        <li>If cancellation is made at least 24 hours before the scheduled session, a rescheduling or refund may be offered.</li>
        <li>Missed sessions without prior notice are non-refundable.</li>
      </ul>

      <h4>4) Client Responsibilities</h4>
      <p>The client agrees to:</p>
      <ul>
        <li>Provide accurate information</li>
        <li>Ensure access to required software and files</li>
        <li>Be present at the scheduled time</li>
      </ul>
      <p>Delays or issues caused by the client do not qualify for refunds.</p>

      <h4>5) Intellectual Property</h4>
      <p>
        All materials, scripts, libraries, and solutions provided remain the intellectual property of CVsolucion unless otherwise agreed.
        The client is granted a usage license for internal business purposes only. Redistribution or resale is not allowed.
      </p>

      <h4>6) Limitation of Liability</h4>
      <p>CVsolucion is not responsible for:</p>
      <ul>
        <li>Production losses</li>
        <li>Machine errors</li>
        <li>Misuse of software or configurations</li>
      </ul>
      <p>All recommendations are provided as professional guidance.</p>

      <h4>7) Confidentiality</h4>
      <p>All client data and project details are treated as confidential and will not be shared with third parties.</p>

      <h4>8) Modifications</h4>
      <p>We reserve the right to modify these Terms at any time. Updates will be posted on this page.</p>

      <h4>9) Governing Law</h4>
      <p>These Terms are governed by the laws of the jurisdiction where CVsolucion operates.</p>

      <h4>10) Contact</h4>
      <p>
        For any questions, contact: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </div>
  );
}
