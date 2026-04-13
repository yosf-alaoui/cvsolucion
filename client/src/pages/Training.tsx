import { useEffect, useMemo, useState } from "react";
import { Check, Lock, MessageCircle, Sparkles } from "lucide-react";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import StripePaymentForm from "@/components/booking/StripePaymentForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import {
  createTrainingPaymentIntent,
  getTrainingPrograms,
  getTrainingPricing,
  recordTrainingPurchase,
  type PublicTrainingProgram,
  type TrainingPriceKey,
  type TrainingPricingResponse,
} from "@/lib/trainingCheckout";

type PageLocale = "en" | "fr" | "ar";
type LevelCopy = {
  id: TrainingPriceKey;
  badge: string;
  title: string;
  hours: string;
  duration: string;
  prerequisite: string;
  certification: string;
  project: string;
  modules: string[];
  featured?: boolean;
};

const levels: Record<PageLocale, LevelCopy[]> = {
  en: [
    ["level1", "Level 1 - Beginner", "Core Designer", "25 hours", "2-3 weeks", "No prerequisites", "Certification: CV Core Designer", "Final project: complete residential kitchen + closet", ["M1 - Environment & configuration - 3h", "M2 - Room layout - 5h", "M3 - Unit placement - 6h", "M4 - 3D render & presentation - 5h", "M5 - Cut List & printing - 6h"]],
    ["level2", "Level 2 - Intermediate", "Catalog Engineer", "30 hours", "3-4 weeks", "Level 1 required", "Certification: CV Catalog Engineer", "Final project: complete catalog (Garage or Semi-Custom)", ["M6 - Assembly Manager - 7h", "M7 - Catalog construction - 7h", "M8 - Door Catalog & Hardware - 5h", "M9 - xBidding & xReporting - 6h", "M10 - Countertops & shaping - 5h"]],
    ["level3", "Level 3 - Advanced", "Production Specialist", "35 hours", "4-5 weeks", "Level 2 required", "Certification: CV Production Specialist", "Final project: from design to complete CNC files", ["M11 - xMachining basics - 7h", "M12 - S2M Center and G-Code - 8h", "M13 - xOptimizer nesting - 6h", "M14 - xLabel & Paperless - 5h", "M15 - Complete design-to-CNC flow - 9h"]],
    ["level4", "Level 4 - Expert", "CV Consultant", "25 hours", "3-4 weeks", "Level 3 required", "Certification: Certified CV Consultant", "Final project: complete deployment for a manufacturer", ["M16 - Object Intelligence & UCS - 7h", "M17 - Catalog automation - 6h", "M18 - xCRM & project management - 5h", "M19 - Consulting workshop - 7h"]],
  ].map(([id, badge, title, hours, duration, prerequisite, certification, project, modules]) => ({ id, badge, title, hours, duration, prerequisite, certification, project, modules })) as LevelCopy[],
  fr: [
    ["level1", "Niveau 1 - Débutant", "Core Designer", "25 heures", "2-3 semaines", "Aucun prérequis", "Certification : CV Core Designer", "Projet final : cuisine résidentielle complète + closet", ["M1 - Environnement & configuration - 3h", "M2 - Mise en plan de la pièce - 5h", "M3 - Placement des unités - 6h", "M4 - Rendu 3D & présentation - 5h", "M5 - Cut List & impression - 6h"]],
    ["level2", "Niveau 2 - Intermédiaire", "Catalog Engineer", "30 heures", "3-4 semaines", "Niveau 1 requis", "Certification : CV Catalog Engineer", "Projet final : catalogue complet (Garage ou Semi-Custom)", ["M6 - Assembly Manager - 7h", "M7 - Construction du catalogue - 7h", "M8 - Door Catalogue & Hardware - 5h", "M9 - xBidding & xReporting - 6h", "M10 - Countertops & Shaping - 5h"]],
    ["level3", "Niveau 3 - Avancé", "Production Specialist", "35 heures", "4-5 semaines", "Niveau 2 requis", "Certification : CV Production Specialist", "Projet final : du design aux fichiers CNC complets", ["M11 - xMachining : bases - 7h", "M12 - S2M Center et G-Code - 8h", "M13 - xOptimizer (Nesting) - 6h", "M14 - xLabel & Paperless - 5h", "M15 - Flux complet design vers CNC - 9h"]],
    ["level4", "Niveau 4 - Expert", "CV Consultant", "25 heures", "3-4 semaines", "Niveau 3 requis", "Certification : Certified CV Consultant", "Projet final : déploiement complet pour un fabricant", ["M16 - Object Intelligence & UCS - 7h", "M17 - Automatisation du catalogue - 6h", "M18 - xCRM & gestion de projets - 5h", "M19 - Atelier consultation - 7h"]],
  ].map(([id, badge, title, hours, duration, prerequisite, certification, project, modules]) => ({ id, badge, title, hours, duration, prerequisite, certification, project, modules })) as LevelCopy[],
  ar: [
    ["level1", "المستوى 1 - مبتدئ", "Core Designer", "25 ساعة", "2-3 أسابيع", "بدون شروط مسبقة", "الشهادة: CV Core Designer", "المشروع النهائي: مطبخ سكني كامل + Closet", ["M1 - البيئة والإعداد - 3h", "M2 - تخطيط الغرفة - 5h", "M3 - وضع الوحدات - 6h", "M4 - العرض ثلاثي الأبعاد - 5h", "M5 - Cut List والطباعة - 6h"]],
    ["level2", "المستوى 2 - متوسط", "Catalog Engineer", "30 ساعة", "3-4 أسابيع", "المستوى 1 مطلوب", "الشهادة: CV Catalog Engineer", "المشروع النهائي: كتالوج كامل (Garage أو Semi-Custom)", ["M6 - Assembly Manager - 7h", "M7 - بناء الكتالوج - 7h", "M8 - الأبواب والهاردوير - 5h", "M9 - xBidding و xReporting - 6h", "M10 - Countertops والتشكيل - 5h"]],
    ["level3", "المستوى 3 - متقدم", "Production Specialist", "35 ساعة", "4-5 أسابيع", "المستوى 2 مطلوب", "الشهادة: CV Production Specialist", "المشروع النهائي: من التصميم إلى ملفات CNC كاملة", ["M11 - أساسيات xMachining - 7h", "M12 - S2M Center و G-Code - 8h", "M13 - xOptimizer Nesting - 6h", "M14 - xLabel و Paperless - 5h", "M15 - مسار كامل من التصميم إلى CNC - 9h"]],
    ["level4", "المستوى 4 - خبير", "CV Consultant", "25 ساعة", "3-4 أسابيع", "المستوى 3 مطلوب", "الشهادة: Certified CV Consultant", "المشروع النهائي: نشر كامل للنظام عند مصنع", ["M16 - Object Intelligence و UCS - 7h", "M17 - أتمتة الكتالوج - 6h", "M18 - xCRM وإدارة المشاريع - 5h", "M19 - ورشة الاستشارة - 7h"]],
  ].map(([id, badge, title, hours, duration, prerequisite, certification, project, modules]) => ({ id, badge, title, hours, duration, prerequisite, certification, project, modules })) as LevelCopy[],
};

function localPath(locale: PageLocale, path: string) {
  if (locale === "fr") return path === "/" ? "/fr" : `/fr${path}`;
  if (locale === "ar") return path === "/" ? "/ar" : `/ar${path}`;
  return path;
}

function moneyLabel(amount: number, locale: PageLocale, currency: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function getCopy(locale: PageLocale) {
  const shared = {
    en: {
      seoTitle: "Cabinet Vision Training Programs | CVsolucion",
      meta: "Four progressive Cabinet Vision training levels with live remote instruction, certification projects, and secure online payment.",
      eyebrow: "Specialized Cabinet Vision training",
      h1: "From design to manufacturing, master CV end-to-end.",
      intro: "Four progressive levels for kitchen, cabinet, and furniture manufacturers. Live online training by a certified CV expert based in Quebec.",
      stats: [["4", "Certification levels"], ["115h", "Specialized content"], ["19", "Practical modules"], ["85%", "Eligible for Quebec funding"]],
      programLabel: "Complete program",
      programTitle: "Four levels, one coherent path.",
      programSubtitle: "Each level is autonomous and certified. Start where you are and progress at your pace.",
      pricingTitle: "Choose your level and pay securely",
      pricingSubtitle: "Prices appear only after login. Payment is processed inside the site with Stripe.",
      loginToSeePrice: "Log in to see price",
      signIn: "Sign in",
      select: "Select this level",
      selected: "Selected",
      completePath: "Complete CV Professional Path",
      bundleBadge: "Complete bundle",
      bundleText: "Levels 1 + 2 + 3 + 4, four capstone projects, and certifications included.",
      fundingTitle: "Quebec training funding can cover up to 85%.",
      fundingIntro: "Eligible Quebec companies may finance this training through MFOR, the 1% skills law, or CSMO-Bois. We provide the training plan, attendance sheets, agreement, and official invoice.",
      fundingCards: [["MFOR", "Main Emploi-Québec workforce training measure with possible reimbursement from 40% to 85%."], ["1% Skills Law", "Training can count as an eligible expense for companies subject to the 1% obligation."], ["CSMO-Bois", "Sector support for wood, furniture, and cabinet manufacturers."], ["Documents", "Training plan, signed agreement, attendance sheets, certificate, and official invoice."]],
      processTitle: "From enrollment to certification",
      process: ["Needs assessment", "Enrollment and funding documents", "Live remote training", "Level capstone project", "Certification and three months of follow-up"],
      contactTitle: "Not sure which level to choose?",
      contactText: "Send us your current setup and we will recommend the right starting point.",
      contactButton: "Ask for guidance",
      payTitle: "Training payment",
      subtotal: "Subtotal",
      cardFee: "Card payment fee",
      total: "Total due now",
      paySubtitle: "Confirm the selected training level and pay securely.",
      secure: "Secure payment by Stripe",
      cardNumber: "Card number",
      expiry: "Expiry",
      cvc: "CVC",
      missingCustomer: "Your login session is required before payment.",
      missingCard: "Enter all card fields to enable payment.",
      ready: "Payment is ready.",
      payNow: "Pay and confirm",
      processing: "Confirming payment...",
      preparing: "Preparing secure payment...",
      unavailable: "Payment is not available right now.",
      success: "Training payment confirmed. We will contact you with the next steps.",
    },
    fr: {
      seoTitle: "Formations Cabinet Vision | CVsolucion",
      meta: "Quatre niveaux progressifs de formation Cabinet Vision avec sessions en direct, projets certifiants et paiement securise en ligne.",
      eyebrow: "Formations spécialisées Cabinet Vision",
      h1: "Du design à la fabrication, maîtrisez CV entièrement.",
      intro: "4 niveaux progressifs pour les fabricants de cuisines, d'armoires et de mobilier. Formations en ligne, en direct, par un expert CV certifié basé au Québec.",
      stats: [["4", "Niveaux de certification"], ["115h", "Contenu spécialisé"], ["19", "Modules pratiques"], ["85%", "Finançable Emploi-Québec"]],
      programLabel: "Programme complet",
      programTitle: "Quatre niveaux, un parcours cohérent.",
      programSubtitle: "Chaque niveau est autonome et certifié. Commencez où vous en êtes, progressez à votre rythme.",
      pricingTitle: "Choisissez votre niveau et payez en sécurité",
      pricingSubtitle: "Les prix apparaissent uniquement après connexion. Le paiement est traité dans le site avec Stripe.",
      loginToSeePrice: "Connectez-vous pour voir le prix",
      signIn: "Se connecter",
      select: "Choisir ce niveau",
      selected: "Sélectionné",
      completePath: "Parcours CV Professionnel Complet",
      bundleBadge: "Parcours complet",
      bundleText: "Niveaux 1 + 2 + 3 + 4, quatre projets de fin de niveau et certifications incluses.",
      fundingTitle: "Le financement au Québec peut couvrir jusqu'à 85 %.",
      fundingIntro: "Les entreprises québécoises admissibles peuvent financer cette formation via MFOR, la loi du 1 %, ou CSMO-Bois. Nous fournissons le plan de formation, les présences, l'entente et la facture officielle.",
      fundingCards: [["MFOR", "Programme principal d'Emploi-Québec avec remboursement possible de 40 % à 85 %."], ["Loi du 1 %", "La formation peut être comptabilisée comme dépense admissible."], ["CSMO-Bois", "Support sectoriel pour les fabricants de bois, meubles et armoires."], ["Documents", "Plan de formation, entente signée, présences, attestation et facture officielle."]],
      processTitle: "De l'inscription à la certification",
      process: ["Évaluation des besoins", "Inscription et documents de financement", "Formation en direct à distance", "Projet de fin de niveau", "Certification et trois mois de suivi"],
      contactTitle: "Vous hésitez sur le niveau?",
      contactText: "Envoyez-nous votre setup actuel et nous recommandons le bon point de départ.",
      contactButton: "Demander une recommandation",
      payTitle: "Paiement formation",
      subtotal: "Sous-total",
      cardFee: "Frais de paiement par carte",
      total: "Total a payer",
      paySubtitle: "Confirmez le niveau choisi et payez en sécurité.",
      secure: "Paiement sécurisé par Stripe",
      cardNumber: "Numéro de carte",
      expiry: "Expiration",
      cvc: "CVC",
      missingCustomer: "Votre session de connexion est requise avant le paiement.",
      missingCard: "Entrez tous les champs carte pour activer le paiement.",
      ready: "Le paiement est prêt.",
      payNow: "Payer et confirmer",
      processing: "Confirmation du paiement...",
      preparing: "Préparation du paiement sécurisé...",
      unavailable: "Le paiement n'est pas disponible actuellement.",
      success: "Paiement formation confirmé. Nous vous contacterons pour les prochaines étapes.",
    },
    ar: {
      seoTitle: "تكوين Cabinet Vision | CVsolucion",
      meta: "أربعة مستويات تدريب Cabinet Vision مباشرة عن بعد مع مشاريع شهادة ودفع آمن داخل الموقع.",
      eyebrow: "تكوين متخصص في Cabinet Vision",
      h1: "من التصميم إلى التصنيع، أتقن CV بالكامل.",
      intro: "4 مستويات تدريجية لمصنعي المطابخ والخزائن والأثاث. تدريب مباشر عبر الإنترنت من خبير CV معتمد مقيم في كيبيك.",
      stats: [["4", "مستويات شهادة"], ["115h", "محتوى متخصص"], ["19", "وحدة تطبيقية"], ["85%", "قابل للتمويل في كيبيك"]],
      programLabel: "البرنامج الكامل",
      programTitle: "أربعة مستويات، مسار واحد منظم.",
      programSubtitle: "كل مستوى مستقل ومعتمد. ابدأ من مستواك الحالي وتقدم حسب وتيرتك.",
      pricingTitle: "اختر المستوى وادفع بأمان",
      pricingSubtitle: "الأسعار لا تظهر إلا بعد تسجيل الدخول. الدفع يتم داخل الموقع عبر Stripe.",
      loginToSeePrice: "سجل الدخول لرؤية السعر",
      signIn: "تسجيل الدخول",
      select: "اختر هذا المستوى",
      selected: "تم الاختيار",
      completePath: "المسار الاحترافي الكامل",
      bundleBadge: "المسار الكامل",
      bundleText: "المستويات 1 + 2 + 3 + 4، مشاريع نهاية المستوى، والشهادات مشمولة.",
      fundingTitle: "تمويل كيبيك يمكن أن يغطي حتى 85%.",
      fundingIntro: "الشركات المؤهلة في كيبيك يمكنها تمويل التدريب عبر MFOR أو قانون 1% أو CSMO-Bois. نوفر خطة التدريب، الحضور، الاتفاقية، والفاتورة الرسمية.",
      fundingCards: [["MFOR", "برنامج Emploi-Québec الرئيسي وقد يغطي من 40% إلى 85%."], ["قانون 1%", "يمكن احتساب التدريب كمصاريف تكوين مؤهلة."], ["CSMO-Bois", "دعم قطاعي لمصنعي الخشب والأثاث والخزائن."], ["الوثائق", "خطة تدريب، اتفاقية، أوراق حضور، شهادة، وفاتورة رسمية."]],
      processTitle: "من التسجيل إلى الشهادة",
      process: ["تقييم الاحتياج", "التسجيل ووثائق التمويل", "تدريب مباشر عن بعد", "مشروع نهاية المستوى", "شهادة وثلاثة أشهر متابعة"],
      contactTitle: "لست متأكدا من المستوى؟",
      contactText: "أرسل لنا إعدادك الحالي وسنقترح نقطة البداية المناسبة.",
      contactButton: "اطلب توجيها",
      payTitle: "دفع التدريب",
      subtotal: "المجموع الفرعي",
      cardFee: "رسوم الدفع بالبطاقة",
      total: "الإجمالي المستحق الآن",
      paySubtitle: "أكد مستوى التدريب المختار وادفع بأمان.",
      secure: "دفع آمن عبر Stripe",
      cardNumber: "رقم البطاقة",
      expiry: "تاريخ الانتهاء",
      cvc: "CVC",
      missingCustomer: "تسجيل الدخول مطلوب قبل الدفع.",
      missingCard: "أدخل كل خانات البطاقة لتفعيل الدفع.",
      ready: "الدفع جاهز.",
      payNow: "ادفع وأكد",
      processing: "جاري تأكيد الدفع...",
      preparing: "جاري تجهيز الدفع الآمن...",
      unavailable: "الدفع غير متاح حاليا.",
      success: "تم تأكيد دفع التدريب. سنتواصل معك بخصوص الخطوات التالية.",
    },
  };

  return { ...shared[locale], levels: levels[locale] };
}

export default function Training() {
  const { locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const pageLocale: PageLocale = locale === "fr" || locale === "ar" ? locale : "en";
  const copy = useMemo(() => getCopy(pageLocale), [pageLocale]);
  const [selectedLevel, setSelectedLevel] = useState<TrainingPriceKey>("level1");
  const [programRecords, setProgramRecords] = useState<PublicTrainingProgram[] | null>(null);
  const [pricing, setPricing] = useState<TrainingPricingResponse | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const programs = useMemo(() => {
    const fallbackPrograms: LevelCopy[] = [
      ...copy.levels,
      {
        id: "bundle",
        badge: copy.bundleBadge,
        title: copy.completePath,
        hours: "115 hours",
        duration: "4 levels",
        prerequisite: "",
        certification: "",
        project: copy.bundleText,
        modules: [],
        featured: true,
      },
    ];

    if (programRecords === null) return fallbackPrograms;

    return [...programRecords]
      .sort((a, b) => a.order - b.order)
      .map((program) => {
        const translated = program.translations[pageLocale]?.title
          ? program.translations[pageLocale]
          : program.translations.en;
        const fallback = fallbackPrograms.find((item) => item.id === program.key);
        return {
          id: program.key || program.id,
          badge: translated.badge || fallback?.badge || program.key,
          title: translated.title || fallback?.title || program.key,
          hours: translated.hours || fallback?.hours || "",
          duration: translated.duration || fallback?.duration || "",
          prerequisite: translated.prerequisite || fallback?.prerequisite || "",
          certification: translated.certification || fallback?.certification || "",
          project: translated.project || fallback?.project || "",
          modules: translated.modules?.length ? translated.modules : fallback?.modules || [],
          featured: program.featured,
        };
      });
  }, [copy, pageLocale, programRecords]);

  const displayLevels = programs.filter((program) => !program.featured && program.id !== "bundle");
  const selected = programs.find((level) => level.id === selectedLevel) ?? programs[0] ?? null;
  const selectedProgramId = selected?.id ?? "";
  const selectedPrice = getProgramPrice(selectedProgramId);
  const currency = pricing?.currency || "usd";
  const selectedCardPaymentFee = selectedPrice > 0 ? pricing?.cardPaymentFeeCents ?? 0 : 0;
  const selectedTotal = selectedPrice + selectedCardPaymentFee;
  const selectedPriceLabel = selectedPrice ? moneyLabel(selectedPrice, pageLocale, currency) : copy.loginToSeePrice;
  const selectedTotalLabel = selectedTotal ? moneyLabel(selectedTotal, pageLocale, currency) : copy.loginToSeePrice;
  const paymentReady = Boolean(selectedProgramId && user && pricing?.enabled && pricing.publishableKey && selectedPrice > 0);
  const loginHref = `${localPath(pageLocale, "/login")}?next=${encodeURIComponent(localPath(pageLocale, "/training"))}`;
  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", copy.contactText);

  function getProgramPrice(programId: TrainingPriceKey) {
    const programPrice = pricing?.programs?.find((program) => program.key === programId || program.id === programId)?.priceCents;
    if (typeof programPrice === "number") return programPrice;
    return pricing?.prices?.[programId as keyof TrainingPricingResponse["prices"]] ?? 0;
  }

  useEffect(() => {
    let cancelled = false;
    getTrainingPrograms()
      .then((response) => {
        if (!cancelled) setProgramRecords(response.programs);
      })
      .catch(() => {
        if (!cancelled) setProgramRecords(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!programs.some((program) => program.id === selectedLevel) && programs[0]) {
      setSelectedLevel(programs[0].id);
    }
  }, [programs, selectedLevel]);

  useEffect(() => {
    if (!user) {
      setPricing(null);
      setPaymentClientSecret(null);
      return;
    }
    getTrainingPricing()
      .then((response) => setPricing(response))
      .catch((error: Error) => setStatus({ tone: "error", text: error.message }));
  }, [user]);

  useEffect(() => {
    if (!paymentReady) {
      setPaymentClientSecret(null);
      return;
    }

    let cancelled = false;
    setPaymentClientSecret(null);
    setPaymentLoading(true);
    createTrainingPaymentIntent({ programId: selectedProgramId, locale: pageLocale })
      .then((response) => {
        if (!cancelled) setPaymentClientSecret(response.clientSecret);
      })
      .catch((error: Error) => {
        if (!cancelled) setStatus({ tone: "error", text: error.message });
      })
      .finally(() => {
        if (!cancelled) setPaymentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pageLocale, paymentReady, selectedProgramId]);

  async function handlePaymentSuccess(paymentIntentId: string) {
    await recordTrainingPurchase({ programId: selectedProgramId, paymentIntentId, locale: pageLocale });
    setStatus({ tone: "success", text: copy.success });
    setPaymentClientSecret(null);
  }

  function getPrice(level: TrainingPriceKey) {
    if (authLoading) return "...";
    if (!user) return copy.loginToSeePrice;
    const amount = getProgramPrice(level);
    return amount ? moneyLabel(amount, pageLocale, currency) : "...";
  }

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Course",
      name: copy.h1,
      description: copy.meta,
      provider: { "@type": "Organization", name: "CVsolucion", url: "https://cvsolucion.com" },
      hasCourseInstance: programs.map((level) => ({
        "@type": "CourseInstance",
        name: `${level.badge} - ${level.title}`,
        courseMode: "online",
        courseWorkload: level.hours,
      })),
    }),
    [copy, programs],
  );

  return (
    <div className="site-page min-h-screen bg-transparent">
      <Seo title={copy.seoTitle} description={copy.meta} type="website" structuredData={structuredData} />
      <Header />
      <main className="pt-32 pb-20">
        <section className="container">
          <div className="glass-card-strong relative overflow-hidden rounded-[36px] px-6 py-14 text-center sm:px-10 lg:px-16">
            <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-4 w-4" />
                {copy.eyebrow}
              </div>
              <h1 className="mx-auto mt-6 max-w-5xl text-4xl font-extrabold tracking-tight text-primary sm:text-6xl" style={{ fontFamily: "Playfair Display" }}>
                {copy.h1}
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">{copy.intro}</p>
              <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {copy.stats.map(([value, label]) => (
                  <div key={label} className="rounded-[24px] border border-primary/15 bg-white/75 p-5 shadow-sm">
                    <div className="text-3xl font-black text-primary">{value}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-600">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mt-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{copy.programLabel}</div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">{copy.programTitle}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">{copy.programSubtitle}</p>
          </div>
          <div className="mt-10 space-y-8">
            {displayLevels.map((level, index) => (
              <GlassCard key={level.id} className="card-static overflow-hidden rounded-[34px]">
                <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                  <div className="flex flex-col justify-between bg-primary/95 p-8 text-white">
                    <div>
                      <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">{level.badge}</div>
                      <div className="mt-8 text-7xl font-black text-white/20">{String(index + 1).padStart(2, "0")}</div>
                      <h3 className="mt-2 text-3xl font-black">{level.title}</h3>
                      <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
                        {[level.hours, level.duration, level.prerequisite].filter(Boolean).map((item) => (
                          <span key={item} className="rounded-full bg-white/12 px-3 py-1">{item}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm leading-7">
                      <strong className="block">{level.certification}</strong>
                      <span className="text-white/80">{level.project}</span>
                    </div>
                  </div>
                  <div className="grid gap-4 p-6 sm:p-8 md:grid-cols-2">
                    {level.modules.map((module) => (
                      <div key={module} className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white/78 p-4 text-sm font-semibold text-slate-700">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{module}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="container mt-16">
          <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">{copy.pricingTitle}</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">{copy.pricingSubtitle}</p>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {programs.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setSelectedLevel(level.id)}
                    className={`rounded-[28px] border p-6 text-left transition ${selectedLevel === level.id ? "border-primary bg-primary/8 shadow-lg" : "border-slate-200 bg-white/78 hover:border-primary/35"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{level.badge}</div>
                        <div className="mt-2 text-2xl font-black text-slate-950">{level.title}</div>
                        <div className="mt-1 text-sm text-slate-500">{level.hours} · {level.duration}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-primary">{getPrice(level.id)}</div>
                        {!user ? <Lock className="ml-auto mt-2 h-4 w-4 text-slate-400" /> : null}
                      </div>
                    </div>
                    <span className={`mt-5 inline-flex rounded-full px-4 py-2 text-sm font-bold ${selectedLevel === level.id ? "bg-primary text-white" : "bg-slate-100 text-slate-700"}`}>
                      {selectedLevel === level.id ? copy.selected : copy.select}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5 xl:sticky xl:top-28 xl:self-start">
              {selected ? (
                <GlassCard className="card-static rounded-[32px] p-7">
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{selected.badge}</div>
                  <h3 className="mt-3 text-3xl font-black text-slate-950">{selected.title}</h3>
                  <div className="mt-4 text-4xl font-black text-primary">{selectedPriceLabel}</div>
                  {user && selectedPrice > 0 ? (
                    <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">{copy.subtotal}</span>
                        <span className="font-semibold text-slate-900">{selectedPriceLabel}</span>
                      </div>
                      {selectedCardPaymentFee > 0 ? (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">{copy.cardFee}</span>
                          <span className="font-semibold text-slate-900">{moneyLabel(selectedCardPaymentFee, pageLocale, currency)}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
                        <span className="font-semibold text-slate-950">{copy.total}</span>
                        <span className="font-black text-primary">{selectedTotalLabel}</span>
                      </div>
                    </div>
                  ) : null}
                  <p className="mt-4 text-sm leading-7 text-slate-600">{selected.project}</p>
                  {!authLoading && !user ? (
                    <Button asChild className="mt-6 w-full rounded-full bg-primary text-white hover:bg-primary/90">
                      <a href={loginHref}>{copy.signIn}</a>
                    </Button>
                  ) : null}
                </GlassCard>
              ) : (
                <GlassCard className="card-static rounded-[32px] p-7 text-sm text-slate-600">{copy.unavailable}</GlassCard>
              )}

              {!user ? null : !pricing?.enabled ? (
                <GlassCard className="card-static rounded-[32px] p-7 text-sm text-slate-600">{copy.unavailable}</GlassCard>
              ) : paymentLoading ? (
                <GlassCard className="card-static rounded-[32px] p-7 text-sm text-slate-600">{copy.preparing}</GlassCard>
              ) : paymentClientSecret && pricing.publishableKey ? (
                <StripePaymentForm
                  publishableKey={pricing.publishableKey}
                  clientSecret={paymentClientSecret}
                  amountLabel={selectedTotalLabel}
                  billingReady={Boolean(user.email)}
                  billingDetails={{ name: user.email, email: user.email, phone: "" }}
                  copy={{
                    title: copy.payTitle,
                    subtitle: copy.paySubtitle,
                    secure: copy.secure,
                    number: copy.cardNumber,
                    expiry: copy.expiry,
                    cvc: copy.cvc,
                    missingCustomer: copy.missingCustomer,
                    missingCard: copy.missingCard,
                    ready: copy.ready,
                    payNow: copy.payNow,
                    processing: copy.processing,
                  }}
                  onSuccess={handlePaymentSuccess}
                />
              ) : null}

              {status ? (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${status.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                  {status.text}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="container mt-16">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <GlassCard className="card-static rounded-[32px] p-8">
              <h2 className="text-3xl font-black text-slate-950">{copy.fundingTitle}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{copy.fundingIntro}</p>
            </GlassCard>
            <div className="grid gap-5 sm:grid-cols-2">
              {copy.fundingCards.map(([title, body]) => (
                <GlassCard key={title} className="card-static rounded-[28px] p-6">
                  <h3 className="text-xl font-black text-primary">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="container mt-16">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">{copy.processTitle}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-5">
            {copy.process.map((step, index) => (
              <GlassCard key={step} className="card-static rounded-[28px] p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{index + 1}</div>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">{step}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="container mt-16">
          <GlassCard className="card-static rounded-[36px] p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-950">{copy.contactTitle}</h2>
                <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">{copy.contactText}</p>
              </div>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <Button className="rounded-full bg-green-500 px-6 text-white hover:bg-green-600">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {copy.contactButton}
                </Button>
              </a>
            </div>
          </GlassCard>
        </section>
      </main>
      <Footer />
    </div>
  );
}
