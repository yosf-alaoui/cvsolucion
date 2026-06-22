import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Lock,
  MessageCircle,
  ShieldCheck,
  Target,
} from "lucide-react";
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
  getTrainingPricing,
  getTrainingPrograms,
  recordTrainingPurchase,
  type PublicTrainingProgram,
  type TrainingPriceKey,
  type TrainingPricingResponse,
} from "@/lib/trainingCheckout";

type PageLocale = "en" | "fr" | "ar";

type ProgramView = {
  id: TrainingPriceKey;
  badge: string;
  title: string;
  hours: string;
  duration: string;
  project: string;
  featured: boolean;
};

const fallbackPrograms: Record<TrainingPriceKey, Record<PageLocale, ProgramView>> = {
  level1: {
    en: {
      id: "level1",
      badge: "Level 1",
      title: "Core Designer",
      hours: "25 hours",
      duration: "2-3 weeks",
      project: "Start with room setup, cabinet placement, 3D presentation, cut lists, and print-ready documentation.",
      featured: false,
    },
    fr: {
      id: "level1",
      badge: "Niveau 1",
      title: "Core Designer",
      hours: "25 heures",
      duration: "2-3 semaines",
      project: "Demarrer avec la piece, le placement des cabinets, la presentation 3D, les cut lists et les documents d'impression.",
      featured: false,
    },
    ar: {
      id: "level1",
      badge: "المستوى 1",
      title: "Core Designer",
      hours: "25 ساعة",
      duration: "2-3 أسابيع",
      project: "البداية من إعداد الغرفة، وضع الخزائن، العرض ثلاثي الأبعاد، قوائم القطع، ووثائق الطباعة.",
      featured: false,
    },
  },
  level2: {
    en: {
      id: "level2",
      badge: "Level 2",
      title: "Catalog Engineer",
      hours: "30 hours",
      duration: "3-4 weeks",
      project: "Build stronger catalogs, assemblies, doors, hardware logic, pricing, and reporting workflows.",
      featured: false,
    },
    fr: {
      id: "level2",
      badge: "Niveau 2",
      title: "Catalog Engineer",
      hours: "30 heures",
      duration: "3-4 semaines",
      project: "Construire des catalogues, assemblies, portes, logique hardware, prix et rapports plus solides.",
      featured: false,
    },
    ar: {
      id: "level2",
      badge: "المستوى 2",
      title: "Catalog Engineer",
      hours: "30 ساعة",
      duration: "3-4 أسابيع",
      project: "بناء كتالوجات أقوى، assemblies، أبواب، hardware، التسعير، وتقارير الإنتاج.",
      featured: false,
    },
  },
  level3: {
    en: {
      id: "level3",
      badge: "Level 3",
      title: "Production Specialist",
      hours: "35 hours",
      duration: "4-5 weeks",
      project: "Move from design to production with S2M, CNC outputs, nesting, labels, and shop-ready files.",
      featured: false,
    },
    fr: {
      id: "level3",
      badge: "Niveau 3",
      title: "Production Specialist",
      hours: "35 heures",
      duration: "4-5 semaines",
      project: "Passer du design a la production avec S2M, sorties CNC, nesting, etiquettes et fichiers atelier.",
      featured: false,
    },
    ar: {
      id: "level3",
      badge: "المستوى 3",
      title: "Production Specialist",
      hours: "35 ساعة",
      duration: "4-5 أسابيع",
      project: "الانتقال من التصميم إلى الإنتاج عبر S2M، ملفات CNC، nesting، الملصقات، وملفات الورشة.",
      featured: false,
    },
  },
  level4: {
    en: {
      id: "level4",
      badge: "Level 4",
      title: "CV Consultant",
      hours: "25 hours",
      duration: "3-4 weeks",
      project: "Master UCS automation, catalog automation, implementation planning, and consulting-level troubleshooting.",
      featured: false,
    },
    fr: {
      id: "level4",
      badge: "Niveau 4",
      title: "CV Consultant",
      hours: "25 heures",
      duration: "3-4 semaines",
      project: "Maitriser UCS, automatisation catalogue, plan de deploiement et depannage niveau consultant.",
      featured: false,
    },
    ar: {
      id: "level4",
      badge: "المستوى 4",
      title: "CV Consultant",
      hours: "25 ساعة",
      duration: "3-4 أسابيع",
      project: "إتقان UCS، أتمتة الكتالوج، تخطيط التطبيق، وحل المشاكل بمستوى استشاري.",
      featured: false,
    },
  },
  bundle: {
    en: {
      id: "bundle",
      badge: "Career path",
      title: "Complete CV Professional Path",
      hours: "115 hours",
      duration: "4 levels",
      project: "The complete route from beginner designer to production-ready Cabinet Vision professional.",
      featured: true,
    },
    fr: {
      id: "bundle",
      badge: "Parcours carriere",
      title: "Parcours CV Professionnel Complet",
      hours: "115 heures",
      duration: "4 niveaux",
      project: "Le parcours complet du designer debutant au professionnel Cabinet Vision pret pour la production.",
      featured: true,
    },
    ar: {
      id: "bundle",
      badge: "مسار مهني",
      title: "المسار الكامل لاحتراف Cabinet Vision",
      hours: "115 ساعة",
      duration: "4 مستويات",
      project: "المسار الكامل من مصمم مبتدئ إلى محترف Cabinet Vision جاهز للإنتاج.",
      featured: true,
    },
  },
};

function getCopy(locale: PageLocale) {
  return {
    en: {
      seoTitle: "Cabinet Vision Career Training | CVsolucion",
      seoDescription:
        "A career-focused Cabinet Vision training path with live remote instruction, production workflows, CNC integration, and secure online payment.",
      eyebrow: "Career training for Cabinet Vision",
      h1: "Build the Cabinet Vision skills factories actually need.",
      intro:
        "A practical training path for designers, engineers, CNC operators, and production teams who need to work faster, fix errors, and deliver clean shop output.",
      primaryCta: "Choose a program",
      secondaryCta: "Ask before enrolling",
      proof: ["Live remote training", "Real Cabinet Vision workflows", "Payment secured by Stripe"],
      outcomesTitle: "What this page is built to sell",
      outcomesIntro:
        "This offer is designed for ad traffic: it explains the result clearly and moves the visitor directly to secure enrollment.",
      outcomes: [
        ["Design confidence", "Set rooms, place cabinets, control presentation output, and avoid basic production mistakes."],
        ["Library control", "Understand catalog structure, assemblies, hardware, bidding, reports, and reusable standards."],
        ["Production readiness", "Move from design to S2M, CNC, nesting, labels, and clean files for the shop floor."],
        ["Career value", "Build a portfolio-style final project that proves the skill level, not just attendance."],
      ],
      pathTitle: "The learning path",
      pathIntro: "The complete route is split into clear levels so a student can start at the right point and keep progressing.",
      includesTitle: "Included in the career path",
      includes: [
        "Needs review before the first session",
        "Live remote training on practical Cabinet Vision cases",
        "Assignments and final project for each level",
        "Workflow recommendations for your shop or career goal",
        "Follow-up support after payment confirmation",
      ],
      pricingTitle: "Enroll and pay",
      pricingIntro: "Choose the full career path or one level. Prices appear after login because payment is tied to the customer account.",
      recommended: "Recommended for career growth",
      select: "Select",
      selected: "Selected",
      loginToSeePrice: "Sign in to see price",
      signIn: "Sign in and continue",
      subtotal: "Subtotal",
      cardFee: "Card payment fee",
      total: "Total due now",
      payTitle: "Training payment",
      paySubtitle: "Confirm your selected training program and pay securely.",
      secure: "Secure payment by Stripe",
      cardNumber: "Card number",
      expiry: "Expiry",
      cvc: "CVC",
      missingCustomer: "Your login session is required before payment.",
      missingCard: "Enter all card fields to enable payment.",
      ready: "Payment is ready.",
      payNow: "Pay and enroll",
      processing: "Confirming payment...",
      preparing: "Preparing secure payment...",
      unavailable: "Payment is not available right now.",
      success: "Training payment confirmed. We will contact you with the next steps.",
      contactTitle: "Need help choosing the right start?",
      contactText: "Send us your current Cabinet Vision level and your target job or production role.",
      contactButton: "Ask on WhatsApp",
    },
    fr: {
      seoTitle: "Formation carriere Cabinet Vision | CVsolucion",
      seoDescription:
        "Un parcours Cabinet Vision axe carriere avec formation en direct, workflows production, integration CNC et paiement securise.",
      eyebrow: "Formation carriere Cabinet Vision",
      h1: "Construisez les competences Cabinet Vision recherchees en atelier.",
      intro:
        "Un parcours pratique pour designers, programmeurs, operateurs CNC et equipes production qui veulent travailler plus vite, corriger les erreurs et sortir des fichiers propres.",
      primaryCta: "Choisir un programme",
      secondaryCta: "Demander avant inscription",
      proof: ["Formation en direct", "Workflows Cabinet Vision reels", "Paiement securise Stripe"],
      outcomesTitle: "Objectif de cette page",
      outcomesIntro:
        "Cette page est concue pour les publicites: elle explique le resultat et amene le visiteur vers l'inscription securisee.",
      outcomes: [
        ["Confiance design", "Configurer les pieces, placer les cabinets, controler la presentation et eviter les erreurs de base."],
        ["Controle bibliotheque", "Comprendre catalogues, assemblies, hardware, bidding, rapports et standards reutilisables."],
        ["Pret pour production", "Passer du design a S2M, CNC, nesting, etiquettes et fichiers propres pour l'atelier."],
        ["Valeur carriere", "Construire un projet final qui prouve le niveau, pas seulement la presence."],
      ],
      pathTitle: "Le parcours",
      pathIntro: "Le parcours complet est divise par niveaux pour commencer au bon endroit et progresser clairement.",
      includesTitle: "Inclus dans le parcours carriere",
      includes: [
        "Evaluation des besoins avant la premiere session",
        "Formation en direct sur des cas Cabinet Vision pratiques",
        "Exercices et projet final pour chaque niveau",
        "Recommandations workflow selon votre atelier ou objectif",
        "Suivi apres confirmation du paiement",
      ],
      pricingTitle: "Inscription et paiement",
      pricingIntro: "Choisissez le parcours complet ou un niveau. Les prix apparaissent apres connexion car le paiement est lie au compte client.",
      recommended: "Recommande pour la carriere",
      select: "Choisir",
      selected: "Selectionne",
      loginToSeePrice: "Connectez-vous pour voir le prix",
      signIn: "Se connecter et continuer",
      subtotal: "Sous-total",
      cardFee: "Frais carte",
      total: "Total maintenant",
      payTitle: "Paiement formation",
      paySubtitle: "Confirmez le programme choisi et payez en securite.",
      secure: "Paiement securise par Stripe",
      cardNumber: "Numero de carte",
      expiry: "Expiration",
      cvc: "CVC",
      missingCustomer: "Votre session de connexion est requise avant le paiement.",
      missingCard: "Entrez tous les champs carte pour activer le paiement.",
      ready: "Le paiement est pret.",
      payNow: "Payer et inscrire",
      processing: "Confirmation du paiement...",
      preparing: "Preparation du paiement securise...",
      unavailable: "Le paiement n'est pas disponible actuellement.",
      success: "Paiement formation confirme. Nous vous contacterons pour les prochaines etapes.",
      contactTitle: "Besoin d'aide pour choisir le depart?",
      contactText: "Envoyez votre niveau Cabinet Vision actuel et votre objectif de poste ou production.",
      contactButton: "Demander sur WhatsApp",
    },
    ar: {
      seoTitle: "تكوين مهني في Cabinet Vision | CVsolucion",
      seoDescription:
        "مسار تكوين مهني في Cabinet Vision مع تدريب مباشر عن بعد، سير عمل الإنتاج، ربط CNC، ودفع آمن داخل الموقع.",
      eyebrow: "تكوين مهني في Cabinet Vision",
      h1: "ابن المهارات التي تحتاجها المصانع فعليا في Cabinet Vision.",
      intro:
        "مسار عملي للمصممين، المبرمجين، مشغلي CNC، وفرق الإنتاج الذين يحتاجون إلى العمل بسرعة أكبر، إصلاح الأخطاء، وإخراج ملفات إنتاج نظيفة.",
      primaryCta: "اختر البرنامج",
      secondaryCta: "اسأل قبل التسجيل",
      proof: ["تكوين مباشر عن بعد", "سير عمل حقيقي في Cabinet Vision", "دفع آمن عبر Stripe"],
      outcomesTitle: "هدف هذه الصفحة",
      outcomesIntro:
        "هذه الصفحة مخصصة لزوار الإعلانات: تشرح النتيجة بوضوح وتقود الزائر مباشرة إلى التسجيل والدفع.",
      outcomes: [
        ["ثقة في التصميم", "إعداد الغرف، وضع الخزائن، التحكم في العرض، وتجنب أخطاء الإنتاج الأساسية."],
        ["تحكم في المكتبة", "فهم الكتالوجات، assemblies، hardware، التسعير، التقارير، والمعايير القابلة لإعادة الاستعمال."],
        ["جاهزية للإنتاج", "الانتقال من التصميم إلى S2M، CNC، nesting، الملصقات، وملفات جاهزة للورشة."],
        ["قيمة مهنية", "بناء مشروع نهائي يثبت مستوى المهارة وليس فقط حضور الدروس."],
      ],
      pathTitle: "مسار التعلم",
      pathIntro: "المسار الكامل مقسم إلى مستويات واضحة حتى يبدأ المتعلم من النقطة الصحيحة ويتقدم بدون ارتباك.",
      includesTitle: "ماذا يشمل المسار المهني",
      includes: [
        "مراجعة الاحتياج قبل أول حصة",
        "تكوين مباشر على حالات عملية في Cabinet Vision",
        "تمارين ومشروع نهائي لكل مستوى",
        "توصيات سير العمل حسب هدفك أو مصنعك",
        "متابعة بعد تأكيد الدفع",
      ],
      pricingTitle: "التسجيل والدفع",
      pricingIntro: "اختر المسار الكامل أو مستوى واحدا. الأسعار تظهر بعد تسجيل الدخول لأن الدفع مرتبط بحساب العميل.",
      recommended: "الأفضل للنمو المهني",
      select: "اختيار",
      selected: "مختار",
      loginToSeePrice: "سجل الدخول لرؤية السعر",
      signIn: "تسجيل الدخول والمتابعة",
      subtotal: "المجموع الفرعي",
      cardFee: "رسوم الدفع بالبطاقة",
      total: "المبلغ الآن",
      payTitle: "دفع التكوين",
      paySubtitle: "أكد البرنامج المختار وادفع بأمان.",
      secure: "دفع آمن عبر Stripe",
      cardNumber: "رقم البطاقة",
      expiry: "تاريخ الانتهاء",
      cvc: "CVC",
      missingCustomer: "يجب تسجيل الدخول قبل الدفع.",
      missingCard: "أدخل كل خانات البطاقة لتفعيل الدفع.",
      ready: "الدفع جاهز.",
      payNow: "ادفع وسجل",
      processing: "جاري تأكيد الدفع...",
      preparing: "جاري تجهيز الدفع الآمن...",
      unavailable: "الدفع غير متاح حاليا.",
      success: "تم تأكيد دفع التكوين. سنتواصل معك بخصوص الخطوات التالية.",
      contactTitle: "تحتاج مساعدة لاختيار نقطة البداية؟",
      contactText: "أرسل لنا مستواك الحالي في Cabinet Vision والوظيفة أو دور الإنتاج الذي تستهدفه.",
      contactButton: "اسأل عبر WhatsApp",
    },
  }[locale];
}

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

function normalizeLocale(locale: string): PageLocale {
  return locale === "fr" || locale === "ar" ? locale : "en";
}

function programFromRecord(program: PublicTrainingProgram, locale: PageLocale): ProgramView {
  const fallback = fallbackPrograms[program.key]?.[locale] || fallbackPrograms[program.key]?.en;
  if (fallback) {
    return { ...fallback, id: program.key || program.id, featured: program.featured || fallback.featured };
  }

  const translation = program.translations[locale]?.title ? program.translations[locale] : program.translations.en;
  return {
    id: program.key || program.id,
    badge: translation.badge || program.key || "Training",
    title: translation.title || program.key || "Training program",
    hours: translation.hours || "",
    duration: translation.duration || "",
    project: translation.project || "",
    featured: program.featured,
  };
}

export default function TrainingCareer() {
  const { locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const pageLocale = normalizeLocale(locale);
  const copy = useMemo(() => getCopy(pageLocale), [pageLocale]);
  const [programRecords, setProgramRecords] = useState<PublicTrainingProgram[] | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<TrainingPriceKey>("bundle");
  const [pricing, setPricing] = useState<TrainingPricingResponse | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const programs = useMemo(() => {
    if (programRecords === null) {
      return ["bundle", "level1", "level2", "level3", "level4"].map((key) => fallbackPrograms[key][pageLocale]);
    }

    return [...programRecords]
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.order - b.order;
      })
      .map((program) => programFromRecord(program, pageLocale));
  }, [pageLocale, programRecords]);

  const selectedProgram = programs.find((program) => program.id === selectedProgramId) || programs[0] || null;
  const currency = pricing?.currency || "usd";
  const selectedPrice = selectedProgram ? getProgramPrice(selectedProgram.id) : 0;
  const selectedFee = selectedPrice > 0 ? pricing?.cardPaymentFeeCents ?? 0 : 0;
  const selectedTotal = selectedPrice + selectedFee;
  const selectedPriceLabel = selectedPrice ? moneyLabel(selectedPrice, pageLocale, currency) : copy.loginToSeePrice;
  const selectedTotalLabel = selectedTotal ? moneyLabel(selectedTotal, pageLocale, currency) : copy.loginToSeePrice;
  const loginHref = `${localPath(pageLocale, "/login")}?next=${encodeURIComponent(localPath(pageLocale, "/training/career"))}`;
  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", copy.contactText);
  const paymentReady = Boolean(selectedProgram?.id && user && pricing?.enabled && pricing.publishableKey && selectedPrice > 0);

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
    if (!programs.length) return;
    if (programs.some((program) => program.id === selectedProgramId)) return;
    const preferred = programs.find((program) => program.id === "bundle") || programs.find((program) => program.featured) || programs[0];
    setSelectedProgramId(preferred.id);
  }, [programs, selectedProgramId]);

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
    if (!paymentReady || !selectedProgram?.id) {
      setPaymentClientSecret(null);
      return;
    }

    let cancelled = false;
    setPaymentClientSecret(null);
    setPaymentLoading(true);
    createTrainingPaymentIntent({ programId: selectedProgram.id, locale: pageLocale })
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
  }, [pageLocale, paymentReady, selectedProgram?.id]);

  async function handlePaymentSuccess(paymentIntentId: string) {
    if (!selectedProgram?.id) return;
    await recordTrainingPurchase({ programId: selectedProgram.id, paymentIntentId, locale: pageLocale });
    setStatus({ tone: "success", text: copy.success });
    setPaymentClientSecret(null);
  }

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Course",
      name: copy.seoTitle,
      description: copy.seoDescription,
      provider: { "@type": "Organization", name: "CVsolucion", url: "https://cvsolucion.com" },
      courseMode: "online",
      hasCourseInstance: programs.map((program) => ({
        "@type": "CourseInstance",
        name: program.title,
        courseMode: "online",
        courseWorkload: program.hours,
      })),
    }),
    [copy, programs],
  );

  return (
    <div className="site-page min-h-screen bg-transparent">
      <Seo title={copy.seoTitle} description={copy.seoDescription} type="website" structuredData={structuredData} />
      <Header />
      <main className="pb-20 pt-28">
        <section className="container">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="py-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <BriefcaseBusiness className="h-4 w-4" />
                {copy.eyebrow}
              </div>
              <h1 className="mt-7 max-w-4xl text-4xl font-black text-slate-950 sm:text-6xl">
                {copy.h1}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">{copy.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-primary px-6 text-white hover:bg-primary/90">
                  <a href="#career-payment">
                    <CreditCard className="mr-2 h-5 w-5" />
                    {copy.primaryCta}
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-full bg-white/80 px-6">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    {copy.secondaryCta}
                  </a>
                </Button>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {copy.proof.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 text-sm font-semibold text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <GlassCard className="card-static rounded-[32px] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.16em] text-primary">{copy.outcomesTitle}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{copy.outcomesIntro}</p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {copy.outcomes.map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white/78 p-4">
                    <div className="flex items-center gap-2 text-base font-black text-slate-950">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      {title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </section>

        <section className="container mt-16">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <GraduationCap className="h-4 w-4" />
                {copy.pathTitle}
              </div>
              <h2 className="mt-5 text-3xl font-black text-slate-950 sm:text-5xl">{copy.pathTitle}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{copy.pathIntro}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {programs.map((program, index) => (
                <GlassCard key={program.id} className={`card-static rounded-[28px] p-6 ${program.featured ? "md:col-span-2 border-primary/35" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{program.badge}</div>
                      <h3 className="mt-2 text-2xl font-black text-slate-950">{program.title}</h3>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">{String(index + 1).padStart(2, "0")}</div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{program.project}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                    {[program.hours, program.duration].filter(Boolean).map((item) => (
                      <span key={item} className="rounded-full bg-white/80 px-3 py-1 shadow-sm">{item}</span>
                    ))}
                    {program.featured ? <span className="rounded-full bg-primary px-3 py-1 text-white">{copy.recommended}</span> : null}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="container mt-16">
          <GlassCard className="card-static rounded-[32px] p-7 sm:p-9">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-3xl font-black text-slate-950">{copy.includesTitle}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {copy.includes.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/78 p-4 text-sm font-semibold leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        <section id="career-payment" className="container mt-16 scroll-mt-28">
          <div className="grid gap-8 xl:grid-cols-[1fr_430px]">
            <div>
              <h2 className="text-3xl font-black text-slate-950 sm:text-5xl">{copy.pricingTitle}</h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{copy.pricingIntro}</p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {programs.map((program) => {
                  const active = selectedProgram?.id === program.id;
                  const amount = getProgramPrice(program.id);
                  const priceLabel = !user || authLoading ? copy.loginToSeePrice : amount ? moneyLabel(amount, pageLocale, currency) : copy.unavailable;
                  return (
                    <button
                      key={program.id}
                      type="button"
                      onClick={() => setSelectedProgramId(program.id)}
                      className={`rounded-[28px] border p-5 text-left transition ${active ? "border-primary bg-primary/8 shadow-lg" : "border-slate-200 bg-white/78 hover:border-primary/35"} ${program.featured ? "md:col-span-2" : ""}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{program.badge}</div>
                          <div className="mt-2 text-2xl font-black text-slate-950">{program.title}</div>
                          <div className="mt-1 text-sm font-semibold text-slate-500">{program.hours} / {program.duration}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black text-primary">{priceLabel}</div>
                          {!user ? <Lock className="ml-auto mt-2 h-4 w-4 text-slate-400" /> : null}
                        </div>
                      </div>
                      <div className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-primary text-white" : "bg-slate-100 text-slate-700"}`}>
                        {active ? copy.selected : copy.select}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5 xl:sticky xl:top-28 xl:self-start">
              {selectedProgram ? (
                <GlassCard className="card-static rounded-[32px] p-7">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{selectedProgram.badge}</div>
                  <h3 className="mt-3 text-3xl font-black text-slate-950">{selectedProgram.title}</h3>
                  <div className="mt-4 text-4xl font-black text-primary">{selectedPriceLabel}</div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{selectedProgram.project}</p>
                  {user && selectedPrice > 0 ? (
                    <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-white/75 p-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">{copy.subtotal}</span>
                        <span className="font-semibold text-slate-900">{selectedPriceLabel}</span>
                      </div>
                      {selectedFee > 0 ? (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">{copy.cardFee}</span>
                          <span className="font-semibold text-slate-900">{moneyLabel(selectedFee, pageLocale, currency)}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
                        <span className="font-semibold text-slate-950">{copy.total}</span>
                        <span className="font-black text-primary">{selectedTotalLabel}</span>
                      </div>
                    </div>
                  ) : null}
                  {!authLoading && !user ? (
                    <Button asChild className="mt-6 w-full rounded-full bg-primary text-white hover:bg-primary/90">
                      <a href={loginHref} rel="nofollow">
                        {copy.signIn}
                      </a>
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
          <GlassCard className="card-static rounded-[32px] p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-950">{copy.contactTitle}</h2>
                <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">{copy.contactText}</p>
              </div>
              <Button asChild className="rounded-full bg-green-500 px-6 text-white hover:bg-green-600">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {copy.contactButton}
                </a>
              </Button>
            </div>
          </GlassCard>
        </section>
      </main>
      <Footer />
    </div>
  );
}
