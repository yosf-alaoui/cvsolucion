import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Laptop,
  Lock,
  MessageCircle,
  MonitorUp,
  PlayCircle,
  ShieldCheck,
  Wrench,
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

type FaqItem = {
  question: string;
  answer: string;
};

type TextPair = [string, string];
type ModuleItem = [string, string[]];

type CareerCopy = {
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  heroHeadlineTop: string;
  heroHeadlineBottom: string;
  heroSubheading: string;
  heroPoints: string[];
  enrollNow: string;
  seeHowItWorks: string;
  helpCta: string;
  beforeLabel: string;
  afterLabel: string;
  shopFloorLabel: string;
  designOfficeLabel: string;
  shopFloorAlt: string;
  designOfficeAlt: string;
  moveKicker: string;
  moveTitle: string;
  moveBody: string;
  whereYouAreTitle: string;
  whereYouAreLabel: string;
  whereYouAre: string[];
  whereYouGoTitle: string;
  whereYouGoLabel: string;
  whereYouGo: string[];
  spineTitle: string;
  spineText: string;
  barrierKicker: string;
  barrierTitle: string;
  barrierBody: string;
  withoutTitle: string;
  withoutBody: string;
  withTitle: string;
  withBody: string;
  deliveryKicker: string;
  deliveryTitle: string;
  deliveryBody: string;
  otherTrainingTitle: string;
  otherTraining: string[];
  cvsolucionTrainingTitle: string;
  cvsolucionTraining: string[];
  scheduleKicker: string;
  scheduleTitle: string;
  scheduleBody: string;
  scheduleCards: TextPair[];
  learnKicker: string;
  learnTitle: string;
  learnBody: string;
  modules: ModuleItem[];
  audienceKicker: string;
  audienceTitle: string;
  audienceBody: string;
  audience: string[];
  notNeedTitle: string;
  notNeedBody: string;
  needTitle: string;
  needBody: string;
  packagesKicker: string;
  packagesTitle: string;
  packagesIntro: string;
  recommended: string;
  select: string;
  selected: string;
  loginToSeePrice: string;
  signIn: string;
  subtotal: string;
  cardFee: string;
  total: string;
  payTitle: string;
  paySubtitle: string;
  secure: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  missingCustomer: string;
  missingCard: string;
  ready: string;
  payNow: string;
  processing: string;
  preparing: string;
  unavailable: string;
  success: string;
  faqKicker: string;
  faqTitle: string;
  faq: FaqItem[];
  finalTitle: string;
  finalBody: string;
  teamTraining: string;
  teamTrainingLink: string;
  askQuestion: string;
  contactText: string;
};

const fallbackPrograms: Record<PageLocale, Record<TrainingPriceKey, ProgramView>> = {
  en: {
    bundle: {
      id: "bundle",
      badge: "Career package",
      title: "Full shop-to-design path",
      hours: "115 hours",
      duration: "4 levels",
      project: "The complete route from shop-floor experience to Cabinet Vision design and production confidence.",
      featured: true,
    },
    level1: {
      id: "level1",
      badge: "Foundation",
      title: "Getting started in Cabinet Vision",
      hours: "25 hours",
      duration: "2-3 weeks",
      project: "Job, room, and cabinet setup from scratch with clean modeling habits used in real shops.",
      featured: false,
    },
    level2: {
      id: "level2",
      badge: "Workflow",
      title: "Catalog and shop standards",
      hours: "30 hours",
      duration: "3-4 weeks",
      project: "Build stronger cabinets, assemblies, hardware logic, pricing habits, and reporting workflows.",
      featured: false,
    },
    level3: {
      id: "level3",
      badge: "Production",
      title: "From design to shop-ready files",
      hours: "35 hours",
      duration: "4-5 weeks",
      project: "Learn reports, cut lists, labels, S2M logic, CNC handoff, and the habits that earn shop trust.",
      featured: false,
    },
    level4: {
      id: "level4",
      badge: "Advanced",
      title: "Automation and consultant-level practice",
      hours: "25 hours",
      duration: "3-4 weeks",
      project: "Practice higher-level troubleshooting, automation thinking, and implementation planning.",
      featured: false,
    },
  },
  fr: {
    bundle: {
      id: "bundle",
      badge: "Parcours carriere",
      title: "Parcours complet atelier-design",
      hours: "115 heures",
      duration: "4 niveaux",
      project: "Le parcours complet pour passer de l'experience atelier a une vraie maitrise Cabinet Vision en design et production.",
      featured: true,
    },
    level1: {
      id: "level1",
      badge: "Fondation",
      title: "Debuter dans Cabinet Vision",
      hours: "25 heures",
      duration: "2-3 semaines",
      project: "Configurer un job, une piece et des cabinets avec les bonnes habitudes utilisees dans les vrais ateliers.",
      featured: false,
    },
    level2: {
      id: "level2",
      badge: "Workflow",
      title: "Catalogues et standards atelier",
      hours: "30 heures",
      duration: "3-4 semaines",
      project: "Construire des cabinets plus solides, des assemblies, une logique hardware, des prix et des rapports plus fiables.",
      featured: false,
    },
    level3: {
      id: "level3",
      badge: "Production",
      title: "Du design aux fichiers atelier",
      hours: "35 heures",
      duration: "4-5 semaines",
      project: "Apprendre les rapports, cut lists, etiquettes, logique S2M, sortie CNC et les habitudes qui gagnent la confiance de l'atelier.",
      featured: false,
    },
    level4: {
      id: "level4",
      badge: "Avance",
      title: "Automatisation et pratique consultant",
      hours: "25 heures",
      duration: "3-4 semaines",
      project: "Pratiquer le troubleshooting avance, la logique d'automatisation et la planification d'implementation.",
      featured: false,
    },
  },
  ar: {
    bundle: {
      id: "bundle",
      badge: "مسار مهني",
      title: "المسار الكامل من الورشة إلى التصميم",
      hours: "115 ساعة",
      duration: "4 مستويات",
      project: "المسار الكامل للانتقال من خبرة الورشة إلى إتقان Cabinet Vision في التصميم والإنتاج.",
      featured: true,
    },
    level1: {
      id: "level1",
      badge: "الأساسيات",
      title: "البداية في Cabinet Vision",
      hours: "25 ساعة",
      duration: "2-3 أسابيع",
      project: "إعداد المشروع والغرفة والخزائن من الصفر مع عادات عمل نظيفة تستعملها الورش الحقيقية.",
      featured: false,
    },
    level2: {
      id: "level2",
      badge: "سير العمل",
      title: "الكتالوجات ومعايير الورشة",
      hours: "30 ساعة",
      duration: "3-4 أسابيع",
      project: "بناء خزائن وassemblies أقوى، ومنطق hardware، وتسعير، وتقارير أكثر ثباتا.",
      featured: false,
    },
    level3: {
      id: "level3",
      badge: "الإنتاج",
      title: "من التصميم إلى ملفات الورشة",
      hours: "35 ساعة",
      duration: "4-5 أسابيع",
      project: "تعلم التقارير، قوائم القطع، الملصقات، S2M، تسليم CNC، والعادات التي تجعل الورشة تثق في ملفاتك.",
      featured: false,
    },
    level4: {
      id: "level4",
      badge: "متقدم",
      title: "الأتمتة وممارسة بمستوى استشاري",
      hours: "25 ساعة",
      duration: "3-4 أسابيع",
      project: "تدريب على حل المشاكل المتقدمة، التفكير في الأتمتة، وتخطيط التطبيق داخل الورشة.",
      featured: false,
    },
  },
};

const pageSectionClass = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10 xl:px-12";

const careerImages = {
  shopFloor: "/images/training-career-shop-floor.jpg",
  designOffice: "/images/training-career-design-office.jpg",
};

const copyByLocale = {
  en: {
    seoTitle: "From Shop Floor to Design Office | Cabinet Vision Career Training | CVsolucion",
    seoDescription:
      "Already working in a cabinet shop? Learn Cabinet Vision and move from production to design. Live training with a real instructor, full software access, schedule set around your availability.",
    eyebrow: "Cabinet Vision career training",
    heroHeadlineTop: "Same shop floor.",
    heroHeadlineBottom: "Different paycheck.",
    heroSubheading:
      "You already work in the industry. This training takes you from the shop floor to the design office on the exact software cabinet shops across Canada and the US run on.",
    heroPoints: [
      "Shop floor -> Design office",
      "No license or computer required",
      "Live expert, not pre-recorded videos",
      "Schedule set around your work hours",
    ],
    enrollNow: "Enroll Now",
    seeHowItWorks: "See How It Works",
    helpCta: "Need help? Contact us",
    beforeLabel: "Before",
    afterLabel: "After",
    shopFloorLabel: "Shop floor",
    designOfficeLabel: "Design office",
    shopFloorAlt: "Cabinet shop worker assembling cabinets on the shop floor",
    designOfficeAlt: "Cabinet Vision designer working at a computer in the design office",
    moveKicker: "The move you're making",
    moveTitle: "Shop floor -> Design office. Same industry. Bigger role.",
    moveBody:
      "You already know cabinets from the inside: how they are built, how they fit, what works on the floor. That knowledge does not go away. You take it with you into the design role, and it makes you better at it than someone who has never built a thing.",
    whereYouAreTitle: "Where you are",
    whereYouAreLabel: "Shop floor",
    whereYouAre: [
      "Assembling, installing, operating machines",
      "Building what someone else designed",
      "Expertise in how cabinets actually work",
    ],
    whereYouGoTitle: "Where you're going",
    whereYouGoLabel: "Design office",
    whereYouGo: [
      "Designing jobs and running Cabinet Vision",
      "Creating the files the shop builds from",
      "Higher-paying role in the same industry",
    ],
    spineTitle: "Shop floor -> Design office",
    spineText: "Same industry. Same skills you already have. One software standing in between.",
    barrierKicker: "No barrier to entry",
    barrierTitle: "No Cabinet Vision license. No special computer. Nothing to buy.",
    barrierBody:
      "Cabinet Vision licenses cost thousands of dollars. That is exactly why most shop-floor workers never get the chance to learn it on their own. We remove that barrier completely.",
    withoutTitle: "Without this training",
    withoutBody:
      "To train on Cabinet Vision alone, you would need to buy an expensive individual license and a computer powerful enough to run it. Most people cannot. So the gap stays.",
    withTitle: "With this training",
    withBody:
      "You get connected directly to a powerful computer with Cabinet Vision already set up and running. The software access is included. No purchase, no installation, no setup on your end. Just open and start training.",
    deliveryKicker: "How training is delivered",
    deliveryTitle: "A real expert. Live. Not a video.",
    deliveryBody:
      "You are not buying access to a video library you watch alone and hope something sticks. You train directly with an instructor who works in this industry: in real time, on real jobs, with real feedback.",
    otherTrainingTitle: "Other training",
    otherTraining: [
      "Pre-recorded videos you watch at your own pace",
      "No one to answer your questions as they come up",
      "Generic exercises that do not reflect real shop work",
      "You figure out what to do with what you learned",
    ],
    cvsolucionTrainingTitle: "CVsolucion training",
    cvsolucionTraining: [
      "Live sessions with an instructor and real-time guidance",
      "Questions answered in the moment, not later",
      "Real cabinet jobs, built the way shops expect",
      "You leave with files and skills you can use immediately",
    ],
    scheduleKicker: "Flexible scheduling",
    scheduleTitle: "Your schedule. Your availability. We work around you.",
    scheduleBody:
      "You have a job. You have shifts. Your training schedule is set directly with you based on when you are actually available, not when it is convenient for us.",
    scheduleCards: [
      [
        "We set the timing together",
        "Before training starts, we coordinate directly with you to find sessions that work with your work schedule: mornings, evenings, weekends. You decide.",
      ],
      [
        "Any time zone",
        "Whether you are in British Columbia, Ontario, Quebec, or anywhere in the US, training is scheduled in your local time with no confusion.",
      ],
      [
        "No rush, no pressure",
        "Training is paced to your availability. If you can only do a few hours a week, we build around that. The goal is for you to actually learn.",
      ],
    ],
    learnKicker: "What you'll learn",
    learnTitle: "From your first job setup to a file the shop trusts.",
    learnBody:
      "No generic software demos. Every module is built around what shops actually expect from someone running Cabinet Vision.",
    modules: [
      [
        "Foundation: Getting started in Cabinet Vision",
        [
          "Job, room, and cabinet setup from scratch",
          "Clean modeling habits used in real shops",
          "Reading and building a job the way shops expect",
        ],
      ],
      [
        "Production: From design to shop-ready files",
        [
          "Basic reports, cut lists, and labels",
          "How your design connects to CNC and production",
          "The habits that earn a designer the shop's trust",
        ],
      ],
      [
        "Practice: Building real confidence",
        [
          "Work on real jobs, not generic exercises",
          "Direct, live feedback from your instructor",
          "Leave with a job file you can show",
        ],
      ],
    ],
    audienceKicker: "Is this for you?",
    audienceTitle: "Built for people already in the shop.",
    audienceBody:
      "This training is for anyone already working in cabinet, millwork, or furniture manufacturing who wants to move toward design and higher-paying roles in the same industry they already know.",
    audience: ["Installers and assemblers", "Machine operators", "CNC technicians", "Anyone ready to design"],
    notNeedTitle: "What you do not need",
    notNeedBody: "A design degree. Years of CAD experience. Your own Cabinet Vision license. None of it.",
    needTitle: "What you do need",
    needBody:
      "You already understand cabinets from working in a shop. That is the hard part. The software is what we teach you.",
    packagesKicker: "Training packages",
    packagesTitle: "Choose your training package.",
    packagesIntro: "Live instructor. Real software access. Schedule set around your availability.",
    recommended: "Recommended",
    select: "Select",
    selected: "Selected",
    loginToSeePrice: "Sign in to see price",
    signIn: "Sign in and continue",
    subtotal: "Subtotal",
    cardFee: "Card payment fee",
    total: "Total due now",
    payTitle: "Training payment",
    paySubtitle: "Confirm your selected training package and pay securely.",
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
    faqKicker: "Questions",
    faqTitle: "Common questions",
    faq: [
      {
        question: "Do I need to already own Cabinet Vision?",
        answer: "No. You get direct access to the software during training. No license purchase required.",
      },
      {
        question: "I'm not a designer. Can I really learn this?",
        answer:
          "Yes. Most students start with zero design software experience but already understand cabinets from working in a shop. That industry knowledge is the hard part. The software is what we teach.",
      },
      {
        question: "Is this training remote?",
        answer: "Yes. Sessions are delivered remotely with direct software access and live guidance.",
      },
      {
        question: "What if my work schedule changes or I can't make a session?",
        answer:
          "Scheduling is set directly with you before training starts, based on your availability. If something changes, we coordinate together to find a solution.",
      },
      {
        question: "Is this a recorded course, or do I train with a real person?",
        answer:
          "You train live with a real instructor, never a pre-recorded video course. You also get connected to a dedicated computer with Cabinet Vision already running.",
      },
      {
        question: "Will this actually help me get a better position?",
        answer:
          "Cabinet Vision is the standard design software in cabinet and millwork shops across Canada and the US. Knowing it is typically what separates production roles from design roles.",
      },
    ],
    finalTitle: "Same shop. Different role.",
    finalBody: "You already belong in this industry. This is how you move up in it.",
    teamTraining: "Looking to train your whole team instead?",
    teamTrainingLink: "See team Cabinet Vision training",
    askQuestion: "Ask a question",
    contactText: "Hello CVsolucion, I want to ask about Cabinet Vision career training before enrolling.",
  },
  fr: {
    seoTitle: "De l'atelier au bureau de design | Formation carriere Cabinet Vision | CVsolucion",
    seoDescription:
      "Vous travaillez deja dans un atelier de cabinets? Apprenez Cabinet Vision et passez de la production au design. Formation en direct, acces logiciel inclus, horaire selon vos disponibilites.",
    eyebrow: "Formation carriere Cabinet Vision",
    heroHeadlineTop: "Meme atelier.",
    heroHeadlineBottom: "Meilleur role.",
    heroSubheading:
      "Vous travaillez deja dans l'industrie. Cette formation vous aide a passer de l'atelier au bureau de design avec le logiciel utilise par les ateliers de cabinets au Canada et aux Etats-Unis.",
    heroPoints: [
      "Atelier -> Bureau de design",
      "Aucune licence ni ordinateur requis",
      "Expert en direct, pas des videos preenregistrees",
      "Horaire adapte a vos heures de travail",
    ],
    enrollNow: "S'inscrire",
    seeHowItWorks: "Voir comment ca marche",
    helpCta: "Besoin d'aide ? Contactez-nous",
    beforeLabel: "Avant",
    afterLabel: "Apres",
    shopFloorLabel: "Atelier",
    designOfficeLabel: "Bureau de design",
    shopFloorAlt: "Travailleur d'atelier assemblant des cabinets",
    designOfficeAlt: "Designer Cabinet Vision travaillant sur ordinateur au bureau de design",
    moveKicker: "Le changement que vous faites",
    moveTitle: "Atelier -> Bureau de design. Meme industrie. Role plus fort.",
    moveBody:
      "Vous connaissez deja les cabinets de l'interieur: comment ils sont fabriques, comment ils s'installent et ce qui fonctionne vraiment en atelier. Cette experience ne disparait pas. Vous l'amenez dans le design, et elle vous rend plus solide qu'une personne qui n'a jamais construit.",
    whereYouAreTitle: "Votre point de depart",
    whereYouAreLabel: "Atelier",
    whereYouAre: [
      "Assemblage, installation ou operation de machines",
      "Construire ce que quelqu'un d'autre a dessine",
      "Comprendre comment les cabinets fonctionnent vraiment",
    ],
    whereYouGoTitle: "La destination",
    whereYouGoLabel: "Bureau de design",
    whereYouGo: [
      "Designer des jobs et travailler dans Cabinet Vision",
      "Creer les fichiers que l'atelier va fabriquer",
      "Un role mieux valorise dans la meme industrie",
    ],
    spineTitle: "Atelier -> Bureau de design",
    spineText: "Meme industrie. Memes connaissances terrain. Un logiciel a maitriser pour changer de role.",
    barrierKicker: "Aucune barriere d'entree",
    barrierTitle: "Pas de licence Cabinet Vision. Pas d'ordinateur special. Rien a acheter.",
    barrierBody:
      "Les licences Cabinet Vision coutent des milliers de dollars. C'est pour cette raison que beaucoup de personnes en atelier n'ont jamais l'occasion de l'apprendre seules. Nous enlevons cette barriere.",
    withoutTitle: "Sans cette formation",
    withoutBody:
      "Pour apprendre seul, il faudrait acheter une licence Cabinet Vision couteuse et un ordinateur assez puissant. Pour la plupart des gens, ce n'est pas realiste. Le blocage reste donc en place.",
    withTitle: "Avec cette formation",
    withBody:
      "Vous etes connecte directement a un ordinateur puissant ou Cabinet Vision est deja installe et pret a l'emploi. L'acces logiciel est inclus. Pas d'achat, pas d'installation, pas de configuration de votre cote.",
    deliveryKicker: "Comment se passe la formation",
    deliveryTitle: "Un vrai expert. En direct. Pas une video.",
    deliveryBody:
      "Vous n'achetez pas une bibliotheque de videos a regarder seul en esperant comprendre. Vous travaillez avec un formateur de l'industrie, en temps reel, sur de vrais jobs et avec un vrai retour.",
    otherTrainingTitle: "Autres formations",
    otherTraining: [
      "Videos preenregistrees a regarder seul",
      "Personne pour repondre a vos questions au moment ou elles arrivent",
      "Exercices generiques loin du vrai travail atelier",
      "Vous devez deviner comment appliquer ce que vous avez vu",
    ],
    cvsolucionTrainingTitle: "Formation CVsolucion",
    cvsolucionTraining: [
      "Sessions en direct avec un formateur et de l'accompagnement reel",
      "Questions traitees au moment ou elles apparaissent",
      "Vrais jobs de cabinets, construits comme l'atelier les attend",
      "Vous repartez avec des fichiers et des competences utilisables",
    ],
    scheduleKicker: "Horaire flexible",
    scheduleTitle: "Votre horaire. Vos disponibilites. Nous nous adaptons.",
    scheduleBody:
      "Vous avez un travail, des quarts et des contraintes. L'horaire est fixe directement avec vous selon vos vraies disponibilites, pas selon un calendrier impose.",
    scheduleCards: [
      [
        "Nous choisissons les heures ensemble",
        "Avant de commencer, nous coordonnons avec vous des sessions compatibles avec votre horaire: matin, soir, fin de semaine. Vous decidez.",
      ],
      [
        "Tous les fuseaux horaires",
        "Que vous soyez en Colombie-Britannique, Ontario, Quebec ou ailleurs aux Etats-Unis, les sessions sont planifiees dans votre heure locale.",
      ],
      [
        "Pas de pression inutile",
        "La formation avance selon vos disponibilites. Si vous ne pouvez faire que quelques heures par semaine, nous construisons autour de cela.",
      ],
    ],
    learnKicker: "Ce que vous allez apprendre",
    learnTitle: "Du premier job jusqu'au fichier que l'atelier peut utiliser.",
    learnBody:
      "Pas de demonstration logicielle generique. Chaque module est construit autour de ce que les ateliers attendent vraiment d'une personne qui utilise Cabinet Vision.",
    modules: [
      [
        "Fondation: commencer dans Cabinet Vision",
        [
          "Creer un job, une piece et des cabinets depuis zero",
          "Utiliser des habitudes propres pour les vrais ateliers",
          "Lire et construire un job comme l'atelier l'attend",
        ],
      ],
      [
        "Production: du design aux fichiers atelier",
        [
          "Rapports, cut lists et etiquettes de base",
          "Comprendre le lien entre design, CNC et production",
          "Les habitudes qui donnent confiance a l'atelier",
        ],
      ],
      [
        "Pratique: construire une vraie confiance",
        [
          "Travailler sur de vrais jobs, pas des exercices abstraits",
          "Recevoir un retour direct du formateur",
          "Repartir avec un fichier que vous pouvez montrer",
        ],
      ],
    ],
    audienceKicker: "Est-ce pour vous?",
    audienceTitle: "Concu pour les personnes deja en atelier.",
    audienceBody:
      "Cette formation est faite pour les personnes qui travaillent deja en cabinets, millwork ou fabrication de mobilier et qui veulent aller vers le design et des roles mieux payes dans la meme industrie.",
    audience: ["Installateurs et assembleurs", "Operateurs de machines", "Techniciens CNC", "Toute personne prete a designer"],
    notNeedTitle: "Ce dont vous n'avez pas besoin",
    notNeedBody: "Pas besoin de diplome en design, d'annees de CAD ou de votre propre licence Cabinet Vision.",
    needTitle: "Ce dont vous avez besoin",
    needBody:
      "Vous comprenez deja les cabinets parce que vous travaillez en atelier. C'est la partie difficile. Le logiciel, c'est ce que nous vous enseignons.",
    packagesKicker: "Forfaits de formation",
    packagesTitle: "Choisissez votre forfait.",
    packagesIntro: "Formateur en direct. Acces logiciel reel. Horaire selon vos disponibilites.",
    recommended: "Recommande",
    select: "Choisir",
    selected: "Selectionne",
    loginToSeePrice: "Connectez-vous pour voir le prix",
    signIn: "Se connecter et continuer",
    subtotal: "Sous-total",
    cardFee: "Frais de paiement par carte",
    total: "Total a payer maintenant",
    payTitle: "Paiement de la formation",
    paySubtitle: "Confirmez le forfait choisi et payez en securite.",
    secure: "Paiement securise par Stripe",
    cardNumber: "Numero de carte",
    expiry: "Expiration",
    cvc: "CVC",
    missingCustomer: "Votre session de connexion est requise avant le paiement.",
    missingCard: "Entrez toutes les informations de carte pour activer le paiement.",
    ready: "Le paiement est pret.",
    payNow: "Payer et s'inscrire",
    processing: "Confirmation du paiement...",
    preparing: "Preparation du paiement securise...",
    unavailable: "Le paiement n'est pas disponible pour le moment.",
    success: "Paiement confirme. Nous vous contacterons pour les prochaines etapes.",
    faqKicker: "Questions",
    faqTitle: "Questions frequentes",
    faq: [
      {
        question: "Dois-je deja posseder Cabinet Vision?",
        answer: "Non. Vous obtenez un acces direct au logiciel pendant la formation. Aucun achat de licence n'est requis.",
      },
      {
        question: "Je ne suis pas designer. Est-ce que je peux vraiment apprendre?",
        answer:
          "Oui. Beaucoup d'apprenants commencent sans experience de logiciel design, mais comprennent deja les cabinets parce qu'ils travaillent en atelier. Cette experience terrain est un avantage.",
      },
      {
        question: "La formation est-elle a distance?",
        answer: "Oui. Les sessions se font a distance avec acces logiciel direct et accompagnement en direct.",
      },
      {
        question: "Que se passe-t-il si mon horaire de travail change?",
        answer:
          "L'horaire est fixe avec vous avant le debut de la formation selon vos disponibilites. Si quelque chose change, nous coordonnons une solution.",
      },
      {
        question: "Est-ce une formation video ou avec une vraie personne?",
        answer:
          "Vous travaillez en direct avec un vrai formateur. Ce n'est pas un cours video preenregistre. Vous etes aussi connecte a un ordinateur dedie avec Cabinet Vision deja pret.",
      },
      {
        question: "Est-ce que cela peut vraiment m'aider a obtenir un meilleur role?",
        answer:
          "Cabinet Vision est un logiciel standard dans les ateliers de cabinets et de millwork au Canada et aux Etats-Unis. Le connaitre peut faire la difference entre un role production et un role design.",
      },
    ],
    finalTitle: "Meme atelier. Nouveau role.",
    finalBody: "Vous avez deja votre place dans cette industrie. Voici comment monter en niveau.",
    teamTraining: "Vous voulez former toute votre equipe?",
    teamTrainingLink: "Voir la formation Cabinet Vision pour equipes",
    askQuestion: "Poser une question",
    contactText: "Bonjour CVsolucion, je veux poser une question sur la formation carriere Cabinet Vision avant de m'inscrire.",
  },
  ar: {
    seoTitle: "من الورشة إلى مكتب التصميم | تدريب مهني Cabinet Vision | CVsolucion",
    seoDescription:
      "هل تعمل بالفعل في ورشة خزائن أو مطابخ؟ تعلم Cabinet Vision وانتقل من الإنتاج إلى التصميم. تدريب مباشر مع مدرب حقيقي، وصول كامل للبرنامج، وجدولة حسب وقتك.",
    eyebrow: "تدريب مهني في Cabinet Vision",
    heroHeadlineTop: "نفس الورشة.",
    heroHeadlineBottom: "دور أفضل.",
    heroSubheading:
      "أنت تعمل بالفعل في المجال. هذا التدريب يساعدك على الانتقال من أرضية الورشة إلى مكتب التصميم باستعمال نفس البرنامج الذي تعتمد عليه ورش الخزائن والمطابخ في كندا والولايات المتحدة.",
    heroPoints: [
      "من الورشة إلى مكتب التصميم",
      "لا تحتاج رخصة أو كمبيوتر خاص",
      "مدرب مباشر وليس فيديوهات مسجلة",
      "جدولة حسب ساعات عملك",
    ],
    enrollNow: "سجل الآن",
    seeHowItWorks: "شاهد كيف يعمل",
    helpCta: "تحتاج مساعدة؟ تواصل معنا",
    beforeLabel: "قبل",
    afterLabel: "بعد",
    shopFloorLabel: "الورشة",
    designOfficeLabel: "مكتب التصميم",
    shopFloorAlt: "عامل في ورشة خزائن يقوم بتركيب وتجميع الخزائن",
    designOfficeAlt: "مصمم Cabinet Vision يعمل على الكمبيوتر في مكتب التصميم",
    moveKicker: "الانتقال الذي ستقوم به",
    moveTitle: "من الورشة إلى مكتب التصميم. نفس المجال. دور أكبر.",
    moveBody:
      "أنت تعرف الخزائن من الداخل: كيف تُصنع، كيف تُركب، وما الذي ينجح فعلا داخل الورشة. هذه الخبرة لا تضيع. ستأخذها معك إلى التصميم، وهذا يجعلك أقوى من شخص لم يعمل بيده داخل الورشة.",
    whereYouAreTitle: "مكانك الآن",
    whereYouAreLabel: "الورشة",
    whereYouAre: [
      "تجميع، تركيب، أو تشغيل آلات",
      "تصنع ما صممه شخص آخر",
      "تفهم كيف تعمل الخزائن فعليا",
    ],
    whereYouGoTitle: "إلى أين ستنتقل",
    whereYouGoLabel: "مكتب التصميم",
    whereYouGo: [
      "تصميم المشاريع والعمل داخل Cabinet Vision",
      "إنشاء الملفات التي ستبني منها الورشة",
      "دور أعلى قيمة داخل نفس المجال",
    ],
    spineTitle: "من الورشة إلى مكتب التصميم",
    spineText: "نفس المجال. نفس الخبرة العملية التي تملكها. برنامج واحد تحتاج إلى إتقانه لتغيير دورك.",
    barrierKicker: "بدون عوائق للدخول",
    barrierTitle: "لا تحتاج رخصة Cabinet Vision. لا تحتاج كمبيوتر خاص. لا شيء تشتريه.",
    barrierBody:
      "رخص Cabinet Vision مكلفة جدا. لهذا لا يحصل كثير من عمال الورش على فرصة تعلمه بأنفسهم. في هذا التدريب نزيل هذا العائق بالكامل.",
    withoutTitle: "بدون هذا التدريب",
    withoutBody:
      "لكي تتدرب وحدك ستحتاج إلى شراء رخصة Cabinet Vision مكلفة وكمبيوتر قوي لتشغيله. هذا غير واقعي لمعظم الناس، لذلك يبقى الباب مغلقا.",
    withTitle: "مع هذا التدريب",
    withBody:
      "نوصلك مباشرة بكمبيوتر قوي عليه Cabinet Vision جاهز للعمل. الوصول إلى البرنامج مشمول. لا شراء، لا تثبيت، ولا إعداد من جهتك.",
    deliveryKicker: "طريقة التدريب",
    deliveryTitle: "خبير حقيقي. مباشر. ليس فيديو.",
    deliveryBody:
      "أنت لا تشتري مكتبة فيديوهات تشاهدها وحدك وتتمنى أن تفهم. ستتدرب مباشرة مع مدرب يعمل في هذا المجال، في الوقت الحقيقي، على مشاريع حقيقية، مع تصحيح مباشر.",
    otherTrainingTitle: "تدريبات أخرى",
    otherTraining: [
      "فيديوهات مسجلة تشاهدها وحدك",
      "لا يوجد من يجيب عن أسئلتك وقت ظهورها",
      "تمارين عامة لا تشبه العمل الحقيقي داخل الورشة",
      "تحتاج أن تخمن كيف تطبق ما تعلمته",
    ],
    cvsolucionTrainingTitle: "تدريب CVsolucion",
    cvsolucionTraining: [
      "حصص مباشرة مع مدرب وتوجيه حقيقي",
      "إجابات فورية على أسئلتك أثناء التدريب",
      "مشاريع خزائن حقيقية بالطريقة التي تتوقعها الورشة",
      "تخرج بملفات ومهارات يمكنك استعمالها مباشرة",
    ],
    scheduleKicker: "جدولة مرنة",
    scheduleTitle: "وقتك أنت. توفرّك أنت. نحن نتكيف معك.",
    scheduleBody:
      "لديك عمل وساعات والتزامات. لهذا يتم تحديد مواعيد التدريب معك مباشرة حسب وقتك الحقيقي، وليس حسب جدول مفروض عليك.",
    scheduleCards: [
      [
        "نحدد الوقت معا",
        "قبل بداية التدريب ننسق معك لاختيار حصص تناسب عملك: صباحا، مساء، أو نهاية الأسبوع. القرار حسب توفرّك.",
      ],
      [
        "كل المناطق الزمنية",
        "سواء كنت في كندا أو الولايات المتحدة، يتم تحديد الحصص حسب توقيتك المحلي حتى لا يكون هناك أي ارتباك.",
      ],
      [
        "بدون ضغط",
        "يتقدم التدريب حسب وقتك. إذا كنت تستطيع فقط بضع ساعات في الأسبوع، نبني الخطة على هذا الأساس.",
      ],
    ],
    learnKicker: "ماذا ستتعلم",
    learnTitle: "من أول مشروع إلى ملف تثق به الورشة.",
    learnBody:
      "لا توجد عروض عامة للبرنامج. كل جزء مبني حول ما تحتاجه الورش فعلا من الشخص الذي يعمل على Cabinet Vision.",
    modules: [
      [
        "الأساسيات: البداية في Cabinet Vision",
        [
          "إنشاء المشروع والغرفة والخزائن من الصفر",
          "عادات عمل نظيفة تستعمل داخل الورش الحقيقية",
          "قراءة وبناء مشروع بالطريقة التي تتوقعها الورشة",
        ],
      ],
      [
        "الإنتاج: من التصميم إلى ملفات الورشة",
        [
          "التقارير، قوائم القطع، والملصقات الأساسية",
          "فهم العلاقة بين التصميم وCNC والإنتاج",
          "العادات التي تجعل الورشة تثق في عمل المصمم",
        ],
      ],
      [
        "التطبيق: بناء ثقة حقيقية",
        [
          "العمل على مشاريع حقيقية وليس تمارين عامة",
          "تصحيح مباشر من المدرب",
          "الخروج بملف يمكنك عرضه كدليل على مستواك",
        ],
      ],
    ],
    audienceKicker: "هل هذا مناسب لك؟",
    audienceTitle: "مصمم للأشخاص الموجودين أصلا داخل الورشة.",
    audienceBody:
      "هذا التدريب موجه لكل من يعمل بالفعل في الخزائن، المطابخ، millwork، أو تصنيع الأثاث ويريد الانتقال نحو التصميم وأدوار أعلى داخل نفس المجال الذي يعرفه.",
    audience: ["مركبون ومجمعون", "مشغلو آلات", "تقنيو CNC", "أي شخص جاهز للانتقال إلى التصميم"],
    notNeedTitle: "ما لا تحتاجه",
    notNeedBody: "لا تحتاج شهادة تصميم، ولا سنوات CAD، ولا رخصة Cabinet Vision خاصة بك.",
    needTitle: "ما تحتاجه فعلا",
    needBody:
      "أنت تفهم الخزائن لأنك تعمل داخل الورشة. هذه هي أصعب نقطة. أما البرنامج فنحن نعلمك كيف تستعمله.",
    packagesKicker: "باقات التدريب",
    packagesTitle: "اختر باقة التدريب.",
    packagesIntro: "مدرب مباشر. وصول حقيقي للبرنامج. جدولة حسب وقتك.",
    recommended: "موصى به",
    select: "اختر",
    selected: "تم الاختيار",
    loginToSeePrice: "سجل الدخول لرؤية السعر",
    signIn: "سجل الدخول وتابع",
    subtotal: "المجموع الفرعي",
    cardFee: "رسوم الدفع بالبطاقة",
    total: "الإجمالي الآن",
    payTitle: "دفع التدريب",
    paySubtitle: "أكد باقة التدريب المختارة وادفع بأمان.",
    secure: "دفع آمن عبر Stripe",
    cardNumber: "رقم البطاقة",
    expiry: "تاريخ الانتهاء",
    cvc: "CVC",
    missingCustomer: "يجب تسجيل الدخول قبل الدفع.",
    missingCard: "أدخل كل بيانات البطاقة لتفعيل الدفع.",
    ready: "الدفع جاهز.",
    payNow: "ادفع وسجل",
    processing: "جاري تأكيد الدفع...",
    preparing: "جاري تجهيز الدفع الآمن...",
    unavailable: "الدفع غير متاح حاليا.",
    success: "تم تأكيد دفع التدريب. سنتواصل معك للخطوات التالية.",
    faqKicker: "أسئلة",
    faqTitle: "أسئلة شائعة",
    faq: [
      {
        question: "هل أحتاج أن أملك Cabinet Vision؟",
        answer: "لا. ستحصل على وصول مباشر إلى البرنامج أثناء التدريب. لا تحتاج شراء رخصة.",
      },
      {
        question: "أنا لست مصمما. هل أستطيع التعلم فعلا؟",
        answer:
          "نعم. كثير من المتدربين يبدأون بدون خبرة في برامج التصميم، لكنهم يعرفون الخزائن من خلال العمل في الورشة. هذه الخبرة العملية ميزة قوية.",
      },
      {
        question: "هل التدريب عن بعد؟",
        answer: "نعم. الحصص تتم عن بعد مع وصول مباشر للبرنامج وتوجيه مباشر من المدرب.",
      },
      {
        question: "ماذا لو تغير جدول عملي؟",
        answer:
          "يتم تحديد المواعيد معك قبل البداية حسب توفرّك. إذا تغير شيء، ننسق معك لإيجاد حل مناسب.",
      },
      {
        question: "هل هذا كورس فيديو أم تدريب مع شخص حقيقي؟",
        answer:
          "التدريب مباشر مع مدرب حقيقي، وليس فيديوهات مسجلة. كما يتم وصلك بكمبيوتر مخصص عليه Cabinet Vision جاهز للعمل.",
      },
      {
        question: "هل يمكن أن يساعدني هذا فعلا على الحصول على دور أفضل؟",
        answer:
          "Cabinet Vision برنامج أساسي في ورش الخزائن وmillwork في كندا والولايات المتحدة. إتقانه يمكن أن يفرق بين دور إنتاج ودور تصميم.",
      },
    ],
    finalTitle: "نفس الورشة. دور جديد.",
    finalBody: "أنت تنتمي بالفعل لهذا المجال. هذه هي الطريقة للارتقاء داخله.",
    teamTraining: "هل تريد تدريب فريقك بالكامل؟",
    teamTrainingLink: "شاهد تدريب Cabinet Vision للفرق",
    askQuestion: "اطرح سؤالا",
    contactText: "مرحبا CVsolucion، أريد طرح سؤال حول تدريب Cabinet Vision المهني قبل التسجيل.",
  },
} satisfies Record<PageLocale, CareerCopy>;

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
  const fallback = fallbackPrograms[locale][program.key] || fallbackPrograms.en[program.key];
  if (fallback) {
    return { ...fallback, id: program.key || program.id, featured: program.featured || fallback.featured };
  }

  const translation = program.translations[locale]?.title ? program.translations[locale] : program.translations.en;
  return {
    id: program.key || program.id,
    badge: translation.badge || program.key || "Training",
    title: translation.title || program.key || "Training package",
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
  const copy = copyByLocale[pageLocale];
  const isRtl = pageLocale === "ar";
  const [programRecords, setProgramRecords] = useState<PublicTrainingProgram[] | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<TrainingPriceKey>("bundle");
  const [pricing, setPricing] = useState<TrainingPricingResponse | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const programs = useMemo(() => {
    if (programRecords === null) {
      return ["bundle", "level1", "level2", "level3", "level4"].map((key) => fallbackPrograms[pageLocale][key] || fallbackPrograms.en[key]);
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
  const teamTrainingHref = localPath(pageLocale, "/training");
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
    [copy.seoDescription, copy.seoTitle, programs],
  );

  return (
    <div className="site-page min-h-screen bg-transparent" dir={isRtl ? "rtl" : "ltr"}>
      <Seo title={copy.seoTitle} description={copy.seoDescription} type="website" structuredData={structuredData} />
      <Header />
      <main className="pb-20 pt-28">
        <section className={pageSectionClass}>
          <div className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
            <div className="py-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <BriefcaseBusiness className="h-4 w-4" />
                {copy.eyebrow}
              </div>
              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.95] text-slate-950 sm:text-7xl">
                <span className="block">{copy.heroHeadlineTop}</span>
                <span className="block text-primary">{copy.heroHeadlineBottom}</span>
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">{copy.heroSubheading}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-primary px-6 text-white hover:bg-primary/90">
                  <a href="#career-payment">
                    <CreditCard className="mr-2 h-5 w-5" />
                    {copy.enrollNow}
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-full bg-white/80 px-6">
                  <a href="#how-it-works">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    {copy.seeHowItWorks}
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-full bg-white/80 px-6">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" dir={isRtl ? "rtl" : "ltr"}>
                    <MessageCircle className="me-2 h-5 w-5" />
                    {copy.helpCta}
                  </a>
                </Button>
              </div>
            </div>

            <GlassCard className="card-static overflow-hidden rounded-[32px] p-4 sm:p-5">
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <figure className="overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-sm">
                    <img
                      src={careerImages.shopFloor}
                      alt={copy.shopFloorAlt}
                      className="h-56 w-full object-cover sm:h-72 lg:h-64"
                      loading="eager"
                      decoding="async"
                    />
                    <figcaption className="px-4 py-3 text-sm font-black text-slate-900">
                      <span className="me-2 rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">{copy.beforeLabel}</span>
                      {copy.shopFloorLabel}
                    </figcaption>
                  </figure>
                  <div className="flex justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                      <ArrowRight className={`h-5 w-5 rotate-90 sm:rotate-0 ${isRtl ? "sm:rotate-180" : ""}`} />
                    </div>
                  </div>
                  <figure className="overflow-hidden rounded-[24px] border border-primary/25 bg-white shadow-sm">
                    <img
                      src={careerImages.designOffice}
                      alt={copy.designOfficeAlt}
                      className="h-56 w-full object-cover sm:h-72 lg:h-64"
                      loading="eager"
                      decoding="async"
                    />
                    <figcaption className="px-4 py-3 text-sm font-black text-slate-900">
                      <span className="me-2 rounded-full bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-primary">{copy.afterLabel}</span>
                      {copy.designOfficeLabel}
                    </figcaption>
                  </figure>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                {copy.heroPoints.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                      {index + 1}
                    </div>
                    <div className="text-sm font-black text-slate-900">{item}</div>
                  </div>
                ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        <section id="how-it-works" className={`${pageSectionClass} mt-16 scroll-mt-28`}>
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{copy.moveKicker}</div>
            <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">{copy.moveTitle}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{copy.moveBody}</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <GlassCard className="card-static rounded-[28px] p-7">
              <Wrench className="h-8 w-8 text-primary" />
              <div className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{copy.whereYouAreLabel}</div>
              <h3 className="mt-2 text-2xl font-black text-slate-950">{copy.whereYouAreTitle}</h3>
              <ul className="mt-5 space-y-3">
                {copy.whereYouAre.map((item) => (
                  <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
            <div className="hidden items-center justify-center px-3 lg:flex">
              <ArrowRight className={`h-9 w-9 text-primary ${isRtl ? "rotate-180" : ""}`} />
            </div>
            <GlassCard className="card-static rounded-[28px] border-primary/30 p-7">
              <MonitorUp className="h-8 w-8 text-primary" />
              <div className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-primary">{copy.whereYouGoLabel}</div>
              <h3 className="mt-2 text-2xl font-black text-slate-950">{copy.whereYouGoTitle}</h3>
              <ul className="mt-5 space-y-3">
                {copy.whereYouGo.map((item) => (
                  <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </section>

        <section className={`${pageSectionClass} mt-16`}>
          <div className="rounded-[28px] bg-primary px-6 py-8 text-center text-white shadow-xl sm:px-10">
            <h2 className="text-3xl font-black">{copy.spineTitle}</h2>
            <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-white/85">{copy.spineText}</p>
          </div>
        </section>

        <section className={`${pageSectionClass} mt-16`}>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{copy.barrierKicker}</div>
              <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">{copy.barrierTitle}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{copy.barrierBody}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <GlassCard className="card-static rounded-[28px] p-7">
                <Lock className="h-8 w-8 text-slate-500" />
                <h3 className="mt-5 text-2xl font-black text-slate-950">{copy.withoutTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{copy.withoutBody}</p>
              </GlassCard>
              <GlassCard className="card-static rounded-[28px] border-primary/30 p-7">
                <Laptop className="h-8 w-8 text-primary" />
                <h3 className="mt-5 text-2xl font-black text-slate-950">{copy.withTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{copy.withBody}</p>
              </GlassCard>
            </div>
          </div>
        </section>

        <section className={`${pageSectionClass} mt-16`}>
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{copy.deliveryKicker}</div>
            <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">{copy.deliveryTitle}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{copy.deliveryBody}</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <GlassCard className="card-static rounded-[28px] p-7">
              <h3 className="text-2xl font-black text-slate-950">{copy.otherTrainingTitle}</h3>
              <ul className="mt-5 space-y-3">
                {copy.otherTraining.map((item) => (
                  <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <span className="mt-1 h-4 w-4 shrink-0 rounded-full bg-rose-100 text-center text-[10px] font-black leading-4 text-rose-700">x</span>
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard className="card-static rounded-[28px] border-emerald-300/60 p-7">
              <h3 className="text-2xl font-black text-slate-950">{copy.cvsolucionTrainingTitle}</h3>
              <ul className="mt-5 space-y-3">
                {copy.cvsolucionTraining.map((item) => (
                  <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </section>

        <section className={`${pageSectionClass} mt-16`}>
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{copy.scheduleKicker}</div>
            <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">{copy.scheduleTitle}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{copy.scheduleBody}</p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {copy.scheduleCards.map(([title, body]) => (
              <GlassCard key={title} className="card-static rounded-[28px] p-7">
                <CalendarDays className="h-8 w-8 text-primary" />
                <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className={`${pageSectionClass} mt-16`}>
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{copy.learnKicker}</div>
            <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">{copy.learnTitle}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{copy.learnBody}</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {copy.modules.map(([title, items], index) => (
              <GlassCard key={title} className="card-static rounded-[28px] p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
                <ul className="mt-5 space-y-3">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className={`${pageSectionClass} mt-16`}>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{copy.audienceKicker}</div>
              <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">{copy.audienceTitle}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{copy.audienceBody}</p>
            </div>
            <div className="grid gap-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {copy.audience.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white/78 p-4 text-sm font-black text-slate-800">
                    {item}
                  </div>
                ))}
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <GlassCard className="card-static rounded-[28px] p-7">
                  <h3 className="text-xl font-black text-slate-950">{copy.notNeedTitle}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{copy.notNeedBody}</p>
                </GlassCard>
                <GlassCard className="card-static rounded-[28px] border-primary/30 p-7">
                  <h3 className="text-xl font-black text-slate-950">{copy.needTitle}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{copy.needBody}</p>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>

        <section id="career-payment" className={`${pageSectionClass} mt-16 scroll-mt-28`}>
          <div className="grid gap-8 xl:grid-cols-[1fr_430px]">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{copy.packagesKicker}</div>
              <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">{copy.packagesTitle}</h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{copy.packagesIntro}</p>
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
                      className={`rounded-[28px] border p-5 ${isRtl ? "text-right" : "text-left"} transition ${active ? "border-primary bg-primary/8 shadow-lg" : "border-slate-200 bg-white/78 hover:border-primary/35"} ${program.featured ? "md:col-span-2" : ""}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{program.badge}</div>
                          <div className="mt-2 text-2xl font-black text-slate-950">{program.title}</div>
                          <div className="mt-1 text-sm font-semibold text-slate-500">{program.hours} / {program.duration}</div>
                        </div>
                        <div className={isRtl ? "text-left" : "text-right"}>
                          <div className="text-xl font-black text-primary">{priceLabel}</div>
                          {!user ? <Lock className="ml-auto mt-2 h-4 w-4 text-slate-400" /> : null}
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">{program.project}</p>
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

        <section className={`${pageSectionClass} mt-16`}>
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{copy.faqKicker}</div>
            <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">{copy.faqTitle}</h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {copy.faq.map((item) => (
              <GlassCard key={item.question} className="card-static rounded-[28px] p-7">
                <h3 className="text-lg font-black text-slate-950">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className={`${pageSectionClass} mt-16`}>
          <GlassCard className="card-static rounded-[32px] p-8 text-center sm:p-10">
            <h2 className="text-4xl font-black text-slate-950">{copy.finalTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-600">{copy.finalBody}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full bg-primary px-6 text-white hover:bg-primary/90">
                <a href="#career-payment">
                  <CreditCard className="mr-2 h-5 w-5" />
                  {copy.enrollNow}
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full bg-white/80 px-6">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {copy.askQuestion}
                </a>
              </Button>
            </div>
            <p className="mt-7 text-sm font-semibold text-slate-600">
              {copy.teamTraining}{" "}
              <a className="text-primary underline-offset-4 hover:underline" href={teamTrainingHref}>
                {copy.teamTrainingLink}
              </a>
            </p>
          </GlassCard>
        </section>
      </main>
      <Footer />
    </div>
  );
}
