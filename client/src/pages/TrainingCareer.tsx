import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Mail,
  MessageCircle,
  MonitorUp,
  Send,
  ShieldCheck,
  Wrench,
  XCircle,
} from "lucide-react";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import {
  markCareerLeadForThankYou,
  trackCampaignEvent,
} from "@/lib/campaignTracking";
import { submitContactLead } from "@/lib/contact";

type PageLocale = "en" | "fr" | "ar";
type SelectOption = { value: string; label: string };

type CareerCopy = {
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  headlineTop: string;
  headlineBottom: string;
  campaignLine: string;
  heroBody: string;
  heroPoints: string[];
  requestEvaluation: string;
  seeLearning: string;
  help: string;
  before: string;
  after: string;
  shopFloor: string;
  designOffice: string;
  shopFloorAlt: string;
  designOfficeAlt: string;
  formKicker: string;
  formTitle: string;
  formIntro: string;
  formNotice: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  currentRole: string;
  worksInShop: string;
  usesCabinetVision: string;
  mainGoal: string;
  preferredTime: string;
  notes: string;
  notesPlaceholder: string;
  submit: string;
  submitting: string;
  formPrivacy: string;
  formError: string;
  verificationTitle: string;
  verificationBody: string;
  verificationHint: string;
  confirmationExpired: string;
  roleOptions: SelectOption[];
  shopOptions: SelectOption[];
  experienceOptions: SelectOption[];
  goalOptions: SelectOption[];
  timeOptions: SelectOption[];
  audienceKicker: string;
  audienceTitle: string;
  audienceBody: string;
  audience: string[];
  fitCta: string;
  notForTitle: string;
  notForBody: string;
  notFor: string[];
  learningKicker: string;
  learningTitle: string;
  learningBody: string;
  learning: string[];
  learningCta: string;
  processKicker: string;
  processTitle: string;
  processBody: string;
  process: Array<[string, string]>;
  proofKicker: string;
  proofTitle: string;
  proofBody: string;
  proof: string[];
  faqKicker: string;
  faqTitle: string;
  faq: Array<[string, string]>;
  finalTitle: string;
  finalBody: string;
  finalCta: string;
  askQuestion: string;
  whatsappMessage: string;
};

const pageSectionClass =
  "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10 xl:px-12";

const images = {
  shopFloor: "/images/training-career-shop-floor.webp",
  designOffice: "/images/training-career-design-office.webp",
};

const enOptions = {
  roles: [
    "Cabinet shop worker",
    "CNC operator",
    "Cabinet assembler",
    "Installer",
    "Woodworker",
    "Junior designer",
    "Shop manager",
    "Other",
  ],
  shop: ["Yes", "No", "Related industry"],
  experience: [
    "Yes",
    "No",
    "My company uses it",
    "I have seen it but I do not use it",
  ],
  goals: [
    "Move from shop floor to design office",
    "Learn Cabinet Vision basics",
    "Understand shop drawings",
    "Understand cutlists and reports",
    "Learn CNC / S2M workflow",
    "Improve my current Cabinet Vision skills",
  ],
  times: ["Morning", "Afternoon", "Evening", "Weekend", "Flexible"],
};

function options(values: string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

const copyByLocale: Record<PageLocale, CareerCopy> = {
  en: {
    seoTitle:
      "From Shop Floor to Design Office | Cabinet Vision Career Training | CVsolucion",
    seoDescription:
      "Request a free Cabinet Vision career evaluation for cabinet shop workers, CNC operators, assemblers, installers, and woodworkers moving toward design.",
    eyebrow: "Cabinet Vision career training",
    headlineTop: "Same shop floor.",
    headlineBottom: "Different paycheck.",
    campaignLine:
      "For cabinet shop workers, CNC operators, assemblers, installers, and woodworkers who want to move into Cabinet Vision design.",
    heroBody:
      "Turn the cabinet experience you already have into practical design-office skills. Train live on Cabinet Vision with software access included and scheduling built around your work hours.",
    heroPoints: [
      "No Cabinet Vision license required",
      "No powerful computer required",
      "Live instructor, not recorded videos",
      "Remote training around your schedule",
    ],
    requestEvaluation: "Request a Free Career Evaluation",
    seeLearning: "See what you will learn",
    help: "Need help? Contact us",
    before: "Before",
    after: "After",
    shopFloor: "Shop floor",
    designOffice: "Design office",
    shopFloorAlt: "Cabinet shop worker assembling cabinets on the shop floor",
    designOfficeAlt:
      "Cabinet Vision designer working at a computer in the design office",
    formKicker: "Free career evaluation",
    formTitle: "Is Cabinet Vision the right next step for you?",
    formIntro:
      "Tell us about your current shop experience, your goals, and your preferred time. We will review the request and contact you with the best next step.",
    formNotice:
      "This is not a free training session or a confirmed appointment. It is a free evaluation to determine whether the program fits your situation.",
    fullName: "Full name",
    email: "Email",
    phone: "Phone / WhatsApp",
    country: "Country",
    currentRole: "Current role",
    worksInShop: "Do you currently work in a cabinet shop?",
    usesCabinetVision: "Do you already use Cabinet Vision?",
    mainGoal: "Main goal",
    preferredTime: "Preferred time",
    notes: "Message / notes",
    notesPlaceholder:
      "Tell us anything that would help us understand your current role or goal.",
    submit: "Request My Free Evaluation",
    submitting: "Sending your request...",
    formPrivacy:
      "Your details are used only to review this request and contact you about the evaluation.",
    formError: "We could not send the request. Please try again.",
    verificationTitle: "Confirm your email to complete the request",
    verificationBody:
      "We sent a confirmation link to your email. Open it to finish the request. Our team will only receive the evaluation request after the email is confirmed.",
    verificationHint:
      "If you do not see it, check spam or promotions and make sure the email address is correct.",
    confirmationExpired:
      "The confirmation link is invalid or expired. Please submit the form again.",
    roleOptions: options(enOptions.roles),
    shopOptions: options(enOptions.shop),
    experienceOptions: options(enOptions.experience),
    goalOptions: options(enOptions.goals),
    timeOptions: options(enOptions.times),
    audienceKicker: "Who this is for",
    audienceTitle: "Built for people who already understand the shop.",
    audienceBody:
      "This training is for people working around cabinets, kitchens, millwork, furniture production, installation, or CNC who want to move toward Cabinet Vision design work.",
    audience: [
      "Cabinet shop workers",
      "CNC operators",
      "Cabinet assemblers and installers",
      "Woodworkers and junior designers",
      "Shop managers moving closer to design",
      "People already working in a related industry",
    ],
    fitCta: "Check if this training is right for me",
    notForTitle: "This training is not for you if",
    notForBody:
      "This is a practical, instructor-led program. It is not a shortcut, a passive video library, or a promise of guaranteed employment.",
    notFor: [
      "You have no interest in cabinetmaking or woodworking",
      "You are not willing to practice between sessions",
      "You only want pre-recorded videos",
      "You expect a guaranteed job without building real skills",
      "You want general 3D design instead of Cabinet Vision workflow",
    ],
    learningKicker: "What you will learn",
    learningTitle: "The workflow between the customer request and the shop floor.",
    learningBody:
      "The program focuses on the practical Cabinet Vision knowledge used by cabinet shops, not generic software demonstrations.",
    learning: [
      "Cabinet Vision interface and project structure",
      "How shops move from a customer request to drawings",
      "Room setup, cabinet placement, and modifications",
      "Practical cabinet and shop logic",
      "Shop drawings and production documents",
      "Cutlists, reports, and material understanding",
      "CNC and S2M workflow overview",
      "Communication between design and production",
    ],
    learningCta: "Request your free evaluation",
    processKicker: "How it works",
    processTitle: "Evaluation first. Then a training path that fits.",
    processBody:
      "The evaluation prevents you from buying the wrong level or starting with a program that does not match your experience.",
    process: [
      [
        "Request a free career evaluation",
        "Complete the form with your role, experience, goals, and preferred time.",
      ],
      [
        "We review your request",
        "We assess whether the training fits and which level makes sense.",
      ],
      [
        "We contact you",
        "We confirm the next step by email, phone, or WhatsApp and agree on a time.",
      ],
      [
        "We define your training path",
        "Beginner, shop-to-design, CNC-focused, or production workflow.",
      ],
      [
        "Live training sessions",
        "Learn with a real instructor on Cabinet Vision, not recorded videos.",
      ],
      [
        "Practice and correction",
        "Practice between sessions and receive direct feedback.",
      ],
    ],
    proofKicker: "Why CVsolucion",
    proofTitle: "Training tied to real cabinet production.",
    proofBody:
      "The goal is not to collect software terminology. It is to understand the files, drawings, reports, cutlists, and production logic that shops use every day.",
    proof: [
      "Practical Cabinet Vision training",
      "Real cabinet shop workflow",
      "Design-to-production understanding",
      "Shop drawings, cutlists, and CNC logic",
      "Live support instead of passive videos",
    ],
    faqKicker: "FAQ",
    faqTitle: "Questions before you request the evaluation",
    faq: [
      [
        "Do I need a Cabinet Vision license?",
        "No. You can start without owning a Cabinet Vision license.",
      ],
      [
        "Do I need a powerful computer?",
        "No. Training can be delivered remotely through the instructor's prepared setup.",
      ],
      [
        "Is the training live?",
        "Yes. It is live instructor-led training, not pre-recorded videos.",
      ],
      [
        "Can I train after work?",
        "Yes. Scheduling can be arranged around your work hours and time zone.",
      ],
      [
        "Is this for complete beginners?",
        "It is best for people who already know cabinet shops, woodworking, CNC, installation, or production.",
      ],
      [
        "Will this guarantee me a job?",
        "No job is guaranteed. The goal is to build practical skills used in cabinet shops.",
      ],
      [
        "Is this only for Canada and the US?",
        "Training is remote. The program mainly reflects cabinet shop workflows used across Canada and the US.",
      ],
    ],
    finalTitle: "Start with a free career evaluation.",
    finalBody:
      "No license, computer purchase, or training commitment is required before the evaluation.",
    finalCta: "Start My Free Evaluation",
    askQuestion: "Ask a question",
    whatsappMessage:
      "Hello CVsolucion, I have a question about the free Cabinet Vision career evaluation.",
  },
  fr: {
    seoTitle:
      "De l'atelier au bureau de design | Formation carriere Cabinet Vision | CVsolucion",
    seoDescription:
      "Demandez une evaluation de carriere Cabinet Vision gratuite pour passer de l'atelier, du CNC ou de l'installation vers le bureau de design.",
    eyebrow: "Formation carriere Cabinet Vision",
    headlineTop: "Meme atelier.",
    headlineBottom: "Meilleur role.",
    campaignLine:
      "Pour les travailleurs d'atelier, operateurs CNC, assembleurs, installateurs et ebenistes qui veulent passer au design Cabinet Vision.",
    heroBody:
      "Transformez votre experience terrain en competences pratiques de bureau de design. Formation Cabinet Vision en direct, acces logiciel inclus et horaire adapte a votre travail.",
    heroPoints: [
      "Aucune licence Cabinet Vision requise",
      "Aucun ordinateur puissant requis",
      "Formateur en direct, pas de videos",
      "Formation a distance selon votre horaire",
    ],
    requestEvaluation: "Demander une evaluation de carriere gratuite",
    seeLearning: "Voir ce que vous allez apprendre",
    help: "Besoin d'aide ? Contactez-nous",
    before: "Avant",
    after: "Apres",
    shopFloor: "Atelier",
    designOffice: "Bureau de design",
    shopFloorAlt: "Travailleur assemblant des cabinets dans un atelier",
    designOfficeAlt: "Designer Cabinet Vision travaillant au bureau",
    formKicker: "Evaluation gratuite",
    formTitle: "Cabinet Vision est-il la bonne prochaine etape pour vous ?",
    formIntro:
      "Decrivez votre experience, votre objectif et votre disponibilite. Nous examinerons la demande et vous contacterons avec la prochaine etape adaptee.",
    formNotice:
      "Ce formulaire n'est pas une session gratuite ni un rendez-vous confirme. Il sert a verifier si le programme correspond a votre situation.",
    fullName: "Nom complet",
    email: "Email",
    phone: "Telephone / WhatsApp",
    country: "Pays",
    currentRole: "Role actuel",
    worksInShop: "Travaillez-vous actuellement dans un atelier de cabinets ?",
    usesCabinetVision: "Utilisez-vous deja Cabinet Vision ?",
    mainGoal: "Objectif principal",
    preferredTime: "Moment prefere",
    notes: "Message / notes",
    notesPlaceholder:
      "Ajoutez tout detail utile sur votre role actuel ou votre objectif.",
    submit: "Demander mon evaluation gratuite",
    submitting: "Envoi de votre demande...",
    formPrivacy:
      "Vos informations servent uniquement a examiner la demande et a vous contacter.",
    formError: "La demande n'a pas pu etre envoyee. Veuillez reessayer.",
    verificationTitle: "Confirmez votre email pour finaliser la demande",
    verificationBody:
      "Nous avons envoye un lien de confirmation a votre adresse email. Ouvrez-le pour terminer la demande. Notre equipe recevra la demande uniquement apres confirmation.",
    verificationHint:
      "Si vous ne le voyez pas, verifiez les spams ou promotions et assurez-vous que l'adresse email est correcte.",
    confirmationExpired:
      "Le lien de confirmation est invalide ou expire. Veuillez renvoyer le formulaire.",
    roleOptions: options([
      "Travailleur d'atelier",
      "Operateur CNC",
      "Assembleur de cabinets",
      "Installateur",
      "Ebeniste",
      "Designer junior",
      "Responsable d'atelier",
      "Autre",
    ]),
    shopOptions: options(["Oui", "Non", "Industrie connexe"]),
    experienceOptions: options([
      "Oui",
      "Non",
      "Mon entreprise l'utilise",
      "Je l'ai vu mais je ne l'utilise pas",
    ]),
    goalOptions: options([
      "Passer de l'atelier au bureau de design",
      "Apprendre les bases de Cabinet Vision",
      "Comprendre les dessins d'atelier",
      "Comprendre les cutlists et rapports",
      "Apprendre le workflow CNC / S2M",
      "Ameliorer mes competences Cabinet Vision",
    ]),
    timeOptions: options([
      "Matin",
      "Apres-midi",
      "Soir",
      "Fin de semaine",
      "Flexible",
    ]),
    audienceKicker: "Pour qui",
    audienceTitle: "Concu pour les personnes qui connaissent deja l'atelier.",
    audienceBody:
      "Cette formation s'adresse aux personnes qui travaillent autour des cabinets, cuisines, millwork, meubles, installations ou CNC et veulent evoluer vers le design Cabinet Vision.",
    audience: [
      "Travailleurs d'atelier",
      "Operateurs CNC",
      "Assembleurs et installateurs",
      "Ebenistes et designers juniors",
      "Responsables d'atelier",
      "Personnes dans une industrie connexe",
    ],
    fitCta: "Verifier si cette formation me convient",
    notForTitle: "Cette formation n'est pas pour vous si",
    notForBody:
      "Il s'agit d'un programme pratique avec formateur. Ce n'est ni un raccourci, ni une bibliotheque passive, ni une promesse d'emploi.",
    notFor: [
      "Vous ne vous interessez pas aux cabinets ou au travail du bois",
      "Vous ne voulez pas pratiquer entre les sessions",
      "Vous cherchez uniquement des videos preenregistrees",
      "Vous attendez un emploi garanti sans developper de competences",
      "Vous cherchez du design 3D general plutot que Cabinet Vision",
    ],
    learningKicker: "Ce que vous apprendrez",
    learningTitle: "Le workflow entre la demande client et l'atelier.",
    learningBody:
      "Le programme couvre les connaissances Cabinet Vision utilisees en production, pas des demonstrations logicielles generiques.",
    learning: [
      "Interface Cabinet Vision et structure de projet",
      "Passage de la demande client aux dessins",
      "Configuration de la piece et placement des cabinets",
      "Modifications et logique pratique d'atelier",
      "Dessins d'atelier et documents de production",
      "Cutlists, rapports et comprehension des materiaux",
      "Apercu du workflow CNC et S2M",
      "Communication entre design et production",
    ],
    learningCta: "Demander votre evaluation gratuite",
    processKicker: "Comment ca marche",
    processTitle: "D'abord l'evaluation, puis un parcours adapte.",
    processBody:
      "L'evaluation evite d'acheter le mauvais niveau ou de commencer un programme qui ne correspond pas a votre experience.",
    process: [
      ["Demandez une evaluation gratuite", "Remplissez le formulaire avec votre role, votre experience, votre objectif et votre disponibilite."],
      ["Nous examinons la demande", "Nous verifions si la formation convient et quel niveau est logique."],
      ["Nous vous contactons", "Nous confirmons la prochaine etape par email, telephone ou WhatsApp."],
      ["Nous definissons le parcours", "Debutant, atelier-design, CNC ou workflow de production."],
      ["Sessions en direct", "Vous apprenez avec un vrai formateur dans Cabinet Vision."],
      ["Pratique et correction", "Vous pratiquez entre les sessions et recevez un retour direct."],
    ],
    proofKicker: "Pourquoi CVsolucion",
    proofTitle: "Une formation liee a la vraie production.",
    proofBody:
      "Le but n'est pas de memoriser du vocabulaire logiciel. Il est de comprendre les fichiers, dessins, rapports, cutlists et la logique de production.",
    proof: [
      "Formation Cabinet Vision pratique",
      "Vrai workflow d'atelier",
      "Comprehension design-production",
      "Dessins, cutlists et logique CNC",
      "Support en direct, pas de videos passives",
    ],
    faqKicker: "FAQ",
    faqTitle: "Questions avant de demander l'evaluation",
    faq: [
      ["Dois-je posseder une licence Cabinet Vision ?", "Non. Vous pouvez commencer sans posseder de licence."],
      ["Ai-je besoin d'un ordinateur puissant ?", "Non. La formation peut se faire a distance avec l'environnement prepare du formateur."],
      ["La formation est-elle en direct ?", "Oui. Elle est animee en direct par un formateur."],
      ["Puis-je suivre la formation apres le travail ?", "Oui. L'horaire peut etre adapte a vos heures de travail et a votre fuseau."],
      ["Est-ce adapte aux debutants ?", "Le programme convient surtout aux personnes qui connaissent deja l'atelier, le bois, le CNC, l'installation ou la production."],
      ["Est-ce qu'un emploi est garanti ?", "Non. L'objectif est de developper des competences pratiques utilisees dans les ateliers."],
      ["Est-ce uniquement pour le Canada et les Etats-Unis ?", "La formation est a distance, mais le contenu reflete principalement les workflows de ces marches."],
    ],
    finalTitle: "Commencez par une evaluation de carriere gratuite.",
    finalBody:
      "Aucune licence, aucun achat d'ordinateur et aucun engagement de formation avant l'evaluation.",
    finalCta: "Commencer mon evaluation gratuite",
    askQuestion: "Poser une question",
    whatsappMessage:
      "Bonjour CVsolucion, j'ai une question sur l'evaluation de carriere Cabinet Vision gratuite.",
  },
  ar: {
    seoTitle:
      "من الورشة إلى مكتب التصميم | تدريب مهني Cabinet Vision | CVsolucion",
    seoDescription:
      "اطلب تقييما مهنيا مجانيا لتعرف هل تدريب Cabinet Vision مناسب لانتقالك من الورشة أو CNC أو التركيب إلى التصميم.",
    eyebrow: "تدريب مهني في Cabinet Vision",
    headlineTop: "نفس الورشة.",
    headlineBottom: "دور أفضل.",
    campaignLine:
      "لعمال الورش ومشغلي CNC والمجمعين والمركبين والنجارين الذين يريدون الانتقال إلى التصميم باستعمال Cabinet Vision.",
    heroBody:
      "حوّل خبرتك الحالية في الخزائن والمطابخ إلى مهارات عملية داخل مكتب التصميم. تدريب مباشر مع وصول إلى البرنامج وجدولة تناسب ساعات عملك.",
    heroPoints: [
      "لا تحتاج إلى رخصة Cabinet Vision",
      "لا تحتاج إلى كمبيوتر قوي",
      "مدرب مباشر وليس فيديوهات مسجلة",
      "تدريب عن بعد حسب وقتك",
    ],
    requestEvaluation: "اطلب تقييما مهنيا مجانيا",
    seeLearning: "شاهد ما ستتعلمه",
    help: "تحتاج مساعدة؟ تواصل معنا",
    before: "قبل",
    after: "بعد",
    shopFloor: "أرضية الورشة",
    designOffice: "مكتب التصميم",
    shopFloorAlt: "عامل يقوم بتجميع الخزائن داخل الورشة",
    designOfficeAlt: "مصمم يعمل على Cabinet Vision داخل مكتب التصميم",
    formKicker: "تقييم مهني مجاني",
    formTitle: "هل Cabinet Vision هو الخطوة المناسبة لك؟",
    formIntro:
      "أخبرنا عن خبرتك الحالية وهدفك والوقت الذي تفضله. سنراجع الطلب ونتواصل معك لتحديد أفضل خطوة تالية.",
    formNotice:
      "هذا ليس تدريبا مجانيا ولا موعدا مؤكدا. إنه تقييم مجاني لمعرفة هل البرنامج مناسب لوضعك.",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "الهاتف / واتساب",
    country: "الدولة",
    currentRole: "دورك الحالي",
    worksInShop: "هل تعمل حاليا في ورشة خزائن أو مطابخ؟",
    usesCabinetVision: "هل تستعمل Cabinet Vision حاليا؟",
    mainGoal: "هدفك الرئيسي",
    preferredTime: "الوقت المفضل",
    notes: "رسالة / ملاحظات",
    notesPlaceholder: "أضف أي تفاصيل تساعدنا على فهم دورك الحالي أو هدفك.",
    submit: "اطلب تقييمي المجاني",
    submitting: "جار إرسال طلبك...",
    formPrivacy: "نستعمل معلوماتك فقط لمراجعة الطلب والتواصل معك حول التقييم.",
    formError: "تعذر إرسال الطلب. حاول مرة أخرى.",
    verificationTitle: "أكد بريدك الإلكتروني لإكمال الطلب",
    verificationBody:
      "أرسلنا رابط تأكيد إلى بريدك الإلكتروني. افتحه لإكمال الطلب. لن يصل طلب التقييم إلى فريقنا إلا بعد تأكيد البريد.",
    verificationHint:
      "إذا لم تجد الرسالة، تحقق من البريد غير المرغوب فيه وتأكد من أن عنوان البريد صحيح.",
    confirmationExpired:
      "رابط التأكيد غير صالح أو انتهت مدته. يرجى إرسال الفورم من جديد.",
    roleOptions: options([
      "عامل في ورشة خزائن",
      "مشغل CNC",
      "مجمع خزائن",
      "مركب",
      "نجار",
      "مصمم مبتدئ",
      "مسؤول ورشة",
      "دور آخر",
    ]),
    shopOptions: options(["نعم", "لا", "مجال قريب"]),
    experienceOptions: options([
      "نعم",
      "لا",
      "الشركة التي أعمل بها تستعمله",
      "شاهدته لكنني لا أستعمله",
    ]),
    goalOptions: options([
      "الانتقال من أرضية الورشة إلى مكتب التصميم",
      "تعلم أساسيات Cabinet Vision",
      "فهم رسومات الورشة",
      "فهم قوائم القطع والتقارير",
      "تعلم سير عمل CNC / S2M",
      "تطوير مستواي الحالي في Cabinet Vision",
    ]),
    timeOptions: options(["الصباح", "بعد الظهر", "المساء", "نهاية الأسبوع", "مرن"]),
    audienceKicker: "لمن هذا التدريب",
    audienceTitle: "مصمم للأشخاص الذين يعرفون الورشة من الداخل.",
    audienceBody:
      "هذا التدريب لمن يعمل في الخزائن أو المطابخ أو الأثاث أو التركيب أو CNC ويريد الانتقال نحو التصميم باستعمال Cabinet Vision.",
    audience: [
      "عمال ورش الخزائن والمطابخ",
      "مشغلو CNC",
      "المجمعون والمركبون",
      "النجارون والمصممون المبتدئون",
      "مسؤولو الورش",
      "العاملون في مجال قريب",
    ],
    fitCta: "تحقق هل التدريب مناسب لي",
    notForTitle: "هذا التدريب غير مناسب لك إذا",
    notForBody:
      "هذا برنامج عملي مع مدرب مباشر. ليس طريقا مختصرا ولا مكتبة فيديوهات ولا وعدا بوظيفة مضمونة.",
    notFor: [
      "لا تهتم بصناعة الخزائن أو النجارة",
      "لا تريد التطبيق بين الحصص",
      "تبحث فقط عن فيديوهات مسجلة",
      "تتوقع وظيفة مضمونة بدون بناء مهارات حقيقية",
      "تبحث عن تصميم ثلاثي الأبعاد عام وليس سير عمل Cabinet Vision",
    ],
    learningKicker: "ماذا ستتعلم",
    learningTitle: "سير العمل بين طلب العميل وأرضية الورشة.",
    learningBody:
      "يركز البرنامج على المعرفة العملية المستعملة داخل مصانع الخزائن وليس على عروض عامة للبرنامج.",
    learning: [
      "واجهة Cabinet Vision وبنية المشروع",
      "كيف تنتقل الورشة من طلب العميل إلى الرسومات",
      "إعداد الغرفة ووضع الخزائن",
      "تعديل الخزائن ومنطق العمل داخل الورشة",
      "رسومات الورشة ووثائق الإنتاج",
      "قوائم القطع والتقارير وفهم المواد",
      "نظرة عملية على سير CNC وS2M",
      "التواصل بين التصميم والإنتاج",
    ],
    learningCta: "اطلب تقييمك المجاني",
    processKicker: "كيف يعمل",
    processTitle: "التقييم أولا، ثم مسار تدريب يناسبك.",
    processBody:
      "يمنعك التقييم من شراء مستوى غير مناسب أو البدء في برنامج لا يطابق خبرتك.",
    process: [
      ["اطلب تقييما مهنيا مجانيا", "املأ النموذج بدورك وخبرتك وهدفك والوقت المفضل."],
      ["نراجع طلبك", "نتأكد هل التدريب مناسب ومن أي مستوى يجب أن تبدأ."],
      ["نتواصل معك", "نؤكد الخطوة التالية عبر البريد أو الهاتف أو واتساب وننسق الوقت."],
      ["نحدد مسار التدريب", "مبتدئ أو انتقال من الورشة للتصميم أو CNC أو سير الإنتاج."],
      ["حصص تدريب مباشرة", "تتعلم مع مدرب حقيقي داخل Cabinet Vision."],
      ["تطبيق وتصحيح", "تطبق بين الحصص وتحصل على تصحيح مباشر."],
    ],
    proofKicker: "لماذا CVsolucion",
    proofTitle: "تدريب مرتبط بإنتاج الخزائن الحقيقي.",
    proofBody:
      "الهدف ليس حفظ كلمات البرنامج، بل فهم الملفات والرسومات والتقارير وقوائم القطع ومنطق الإنتاج الذي تستعمله الورش يوميا.",
    proof: [
      "تدريب عملي في Cabinet Vision",
      "سير عمل حقيقي داخل الورشة",
      "فهم العلاقة بين التصميم والإنتاج",
      "رسومات وقوائم قطع ومنطق CNC",
      "دعم مباشر وليس فيديوهات سلبية",
    ],
    faqKicker: "أسئلة شائعة",
    faqTitle: "أسئلة قبل طلب التقييم",
    faq: [
      ["هل أحتاج إلى رخصة Cabinet Vision؟", "لا. يمكنك البدء بدون امتلاك رخصة."],
      ["هل أحتاج إلى كمبيوتر قوي؟", "لا. يمكن تنفيذ التدريب عن بعد عبر بيئة المدرب المجهزة."],
      ["هل التدريب مباشر؟", "نعم. التدريب مباشر مع مدرب وليس فيديوهات مسجلة."],
      ["هل أستطيع التدريب بعد العمل؟", "نعم. يمكن تنسيق الحصص حسب ساعات عملك ومنطقتك الزمنية."],
      ["هل يناسب المبتدئين تماما؟", "يناسب أكثر من يعرف الورشة أو النجارة أو CNC أو التركيب أو الإنتاج."],
      ["هل يضمن لي وظيفة؟", "لا توجد وظيفة مضمونة. الهدف هو بناء مهارات عملية تستعملها الورش."],
      ["هل التدريب خاص بكندا وأمريكا؟", "التدريب عن بعد، لكن المحتوى يعكس بشكل أساسي سير العمل في هذين السوقين."],
    ],
    finalTitle: "ابدأ بتقييم مهني مجاني.",
    finalBody:
      "لا تحتاج إلى رخصة أو شراء كمبيوتر أو الالتزام بالتدريب قبل التقييم.",
    finalCta: "ابدأ تقييمي المجاني",
    askQuestion: "اطرح سؤالا",
    whatsappMessage:
      "مرحبا CVsolucion، لدي سؤال حول التقييم المهني المجاني لتدريب Cabinet Vision.",
  },
};

function normalizeLocale(locale: string): PageLocale {
  return locale === "fr" || locale === "ar" ? locale : "en";
}

function localPath(locale: PageLocale, path: string) {
  if (locale === "fr") return `/fr${path}`;
  if (locale === "ar") return `/ar${path}`;
  return path;
}

function FieldSelect({
  id,
  label,
  value,
  options: fieldOptions,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="" disabled>
          {label}
        </option>
        {fieldOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function TrainingCareer() {
  const { locale } = useI18n();
  const pageLocale = normalizeLocale(locale);
  const copy = copyByLocale[pageLocale];
  const isRtl = pageLocale === "ar";
  const formStarted = useRef(false);
  const scrollEvents = useRef({ fifty: false, ninety: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    currentRole: "",
    worksInShop: "",
    cabinetVisionExperience: "",
    mainGoal: "",
    preferredTime: "",
    notes: "",
  });
  const tracking = useMemo(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      utm_term: params.get("utm_term") || "",
      fbclid: params.get("fbclid") || "",
      landing_page: window.location.href,
    };
  }, []);
  const whatsappHref = buildWhatsAppLink(
    "+1 438 807 8747",
    copy.whatsappMessage,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirmation") === "expired") {
      setError(copy.confirmationExpired);
    }
  }, [copy.confirmationExpired]);

  useEffect(() => {
    trackCampaignEvent("ViewContent", {
      content_name: "Cabinet Vision Career Training",
      content_category: "training",
      locale: pageLocale,
    });

    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const depth = window.scrollY / total;
      if (depth >= 0.5 && !scrollEvents.current.fifty) {
        scrollEvents.current.fifty = true;
        trackCampaignEvent("Scroll_50", { locale: pageLocale });
      }
      if (depth >= 0.9 && !scrollEvents.current.ninety) {
        scrollEvents.current.ninety = true;
        trackCampaignEvent("Scroll_90", { locale: pageLocale });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pageLocale]);

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Course",
      name: copy.seoTitle,
      description: copy.seoDescription,
      provider: {
        "@type": "Organization",
        name: "CVsolucion",
        url: "https://cvsolucion.com",
      },
      courseMode: "online",
      audience: {
        "@type": "Audience",
        audienceType:
          "Cabinet shop workers, CNC operators, assemblers, installers, and woodworkers",
      },
    }),
    [copy.seoDescription, copy.seoTitle],
  );

  const startForm = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    trackCampaignEvent("Form_Start", {
      form_name: "career_evaluation",
      locale: pageLocale,
    });
  };

  const goToForm = (label: string) => {
    trackCampaignEvent("CTA_Click", {
      cta_name: label,
      locale: pageLocale,
    });
    document
      .getElementById("career-evaluation")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateForm = (field: keyof typeof form, value: string) => {
    startForm();
    setVerificationEmail(null);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const message = [
      "New Free Career Evaluation Request",
      "",
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone / WhatsApp: ${form.phone}`,
      `Country: ${form.country}`,
      `Current Role: ${form.currentRole}`,
      `Works in cabinet shop: ${form.worksInShop}`,
      `Cabinet Vision experience: ${form.cabinetVisionExperience}`,
      `Main goal: ${form.mainGoal}`,
      `Preferred time: ${form.preferredTime}`,
      `Message: ${form.notes || "-"}`,
    ].join("\n");

    try {
      const response = await submitContactLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.currentRole,
        interest: "Cabinet Vision career evaluation",
        message,
        locale: pageLocale,
        source: "career_evaluation",
        tracking,
      });
      if (response.pendingEmailVerification) {
        setVerificationEmail(response.email || form.email);
        setBusy(false);
        return;
      }
      if (!response.leadId) {
        throw new Error(copy.formError);
      }
      markCareerLeadForThankYou(response.leadId);
      window.location.assign(
        localPath(pageLocale, "/training/career/thank-you"),
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : copy.formError,
      );
      setBusy(false);
    }
  };

  return (
    <div
      className="site-page min-h-screen bg-transparent"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Seo
        title={copy.seoTitle}
        description={copy.seoDescription}
        type="website"
        structuredData={structuredData}
      />
      <Header />
      <main className="pb-20 pt-28">
        <section className={pageSectionClass}>
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="py-5">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase text-primary">
                <BriefcaseBusiness className="h-4 w-4" />
                {copy.eyebrow}
              </div>
              <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.96] text-slate-950 sm:text-7xl">
                <span className="block">{copy.headlineTop}</span>
                <span className="block text-primary">{copy.headlineBottom}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-xl font-bold leading-8 text-slate-800">
                {copy.campaignLine}
              </p>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                {copy.heroBody}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {copy.heroPoints.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm font-semibold text-slate-700"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  className="h-12 rounded-md bg-primary px-6 text-white hover:bg-primary/90"
                  onClick={() => goToForm("hero_request_evaluation")}
                >
                  <ClipboardCheck className="me-2 h-5 w-5" />
                  {copy.requestEvaluation}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-md bg-white px-6"
                >
                  <a href="#what-you-learn">
                    <ArrowDown className="me-2 h-5 w-5" />
                    {copy.seeLearning}
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-md bg-white px-6"
                >
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackCampaignEvent("Contact", {
                        contact_method: "whatsapp",
                        locale: pageLocale,
                      })
                    }
                  >
                    <MessageCircle className="me-2 h-5 w-5" />
                    {copy.help}
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <figure className="overflow-hidden rounded-md bg-white shadow-lg">
                <img
                  src={images.shopFloor}
                  alt={copy.shopFloorAlt}
                  width="1280"
                  height="796"
                  className="aspect-[4/3] w-full object-cover"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
                <figcaption className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm font-black text-slate-950">
                    {copy.shopFloor}
                  </span>
                  <span className="text-xs font-bold uppercase text-slate-500">
                    {copy.before}
                  </span>
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-md bg-white shadow-lg sm:mt-12">
                <img
                  src={images.designOffice}
                  alt={copy.designOfficeAlt}
                  width="1280"
                  height="796"
                  className="aspect-[4/3] w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <figcaption className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm font-black text-slate-950">
                    {copy.designOffice}
                  </span>
                  <span className="text-xs font-bold uppercase text-primary">
                    {copy.after}
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section
          id="career-evaluation"
          className={`${pageSectionClass} mt-16 scroll-mt-28`}
        >
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <div className="text-xs font-bold uppercase text-primary">
                {copy.formKicker}
              </div>
              <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">
                {copy.formTitle}
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                {copy.formIntro}
              </p>
              <div className="mt-6 border-s-4 border-primary bg-primary/5 px-5 py-4 text-sm font-semibold leading-7 text-slate-700">
                {copy.formNotice}
              </div>
              <div className="mt-6 space-y-3 text-sm font-semibold text-slate-700">
                {copy.heroPoints.slice(0, 3).map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <GlassCard className="card-static rounded-md p-6 sm:p-8">
              <form
                className="space-y-5"
                onSubmit={handleSubmit}
                onFocusCapture={startForm}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="career-name">{copy.fullName}</Label>
                    <Input
                      id="career-name"
                      autoComplete="name"
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="career-email">{copy.email}</Label>
                    <Input
                      id="career-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) =>
                        updateForm("email", event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="career-phone">{copy.phone}</Label>
                    <Input
                      id="career-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) =>
                        updateForm("phone", event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="career-country">{copy.country}</Label>
                    <Input
                      id="career-country"
                      autoComplete="country-name"
                      value={form.country}
                      onChange={(event) =>
                        updateForm("country", event.target.value)
                      }
                      required
                    />
                  </div>
                  <FieldSelect
                    id="career-role"
                    label={copy.currentRole}
                    value={form.currentRole}
                    options={copy.roleOptions}
                    onChange={(value) => updateForm("currentRole", value)}
                  />
                  <FieldSelect
                    id="career-shop"
                    label={copy.worksInShop}
                    value={form.worksInShop}
                    options={copy.shopOptions}
                    onChange={(value) => updateForm("worksInShop", value)}
                  />
                  <FieldSelect
                    id="career-experience"
                    label={copy.usesCabinetVision}
                    value={form.cabinetVisionExperience}
                    options={copy.experienceOptions}
                    onChange={(value) =>
                      updateForm("cabinetVisionExperience", value)
                    }
                  />
                  <FieldSelect
                    id="career-goal"
                    label={copy.mainGoal}
                    value={form.mainGoal}
                    options={copy.goalOptions}
                    onChange={(value) => updateForm("mainGoal", value)}
                  />
                  <div className="sm:col-span-2">
                    <FieldSelect
                      id="career-time"
                      label={copy.preferredTime}
                      value={form.preferredTime}
                      options={copy.timeOptions}
                      onChange={(value) =>
                        updateForm("preferredTime", value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="career-notes">{copy.notes}</Label>
                  <Textarea
                    id="career-notes"
                    className="min-h-32"
                    placeholder={copy.notesPlaceholder}
                    value={form.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                  />
                </div>

                {verificationEmail ? (
                  <div className="border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                      <div>
                        <div className="font-black">
                          {copy.verificationTitle}
                        </div>
                        <p className="mt-1">
                          {copy.verificationBody}{" "}
                          <span className="font-bold">
                            {verificationEmail}
                          </span>
                        </p>
                        <p className="mt-1 text-emerald-800">
                          {copy.verificationHint}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={busy}
                  className="h-12 w-full rounded-md bg-primary text-white hover:bg-primary/90"
                >
                  <Send className="me-2 h-5 w-5" />
                  {busy ? copy.submitting : copy.submit}
                </Button>
                <p className="text-center text-xs leading-6 text-slate-500">
                  {copy.formPrivacy}
                </p>
                {error ? (
                  <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}
              </form>
            </GlassCard>
          </div>
        </section>

        <section className={`${pageSectionClass} mt-20`}>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="text-xs font-bold uppercase text-primary">
                {copy.audienceKicker}
              </div>
              <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">
                {copy.audienceTitle}
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                {copy.audienceBody}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {copy.audience.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 border-b border-slate-200 pb-3 text-sm font-bold leading-6 text-slate-800"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                className="mt-8 rounded-md bg-primary text-white hover:bg-primary/90"
                onClick={() => goToForm("audience_fit")}
              >
                {copy.fitCta}
                <ArrowRight
                  className={`ms-2 h-4 w-4 ${isRtl ? "rotate-180" : ""}`}
                />
              </Button>
            </div>

            <div className="bg-slate-950 p-7 text-white sm:p-9">
              <XCircle className="h-9 w-9 text-rose-400" />
              <h2 className="mt-5 text-3xl font-black">{copy.notForTitle}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {copy.notForBody}
              </p>
              <ul className="mt-7 space-y-4">
                {copy.notFor.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm font-semibold leading-6 text-slate-200"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-rose-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          id="what-you-learn"
          className={`${pageSectionClass} mt-20 scroll-mt-28`}
        >
          <div className="max-w-4xl">
            <div className="text-xs font-bold uppercase text-primary">
              {copy.learningKicker}
            </div>
            <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">
              {copy.learningTitle}
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              {copy.learningBody}
            </p>
          </div>
          <div className="mt-9 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {copy.learning.map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-4 border-t border-slate-200 pt-5"
              >
                <div className="text-2xl font-black text-primary">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="pt-1 text-base font-bold leading-7 text-slate-800">
                  {item}
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            className="mt-9 rounded-md bg-primary text-white hover:bg-primary/90"
            onClick={() => goToForm("learning_request")}
          >
            {copy.learningCta}
          </Button>
        </section>

        <section className="mt-20 bg-slate-950 py-16 text-white">
          <div className={pageSectionClass}>
            <div className="max-w-4xl">
              <div className="text-xs font-bold uppercase text-emerald-400">
                {copy.processKicker}
              </div>
              <h2 className="mt-4 text-3xl font-black sm:text-5xl">
                {copy.processTitle}
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-300">
                {copy.processBody}
              </p>
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {copy.process.map(([title, body], index) => (
                <div key={title} className="border-t border-white/20 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-emerald-400">
                      0{index + 1}
                    </span>
                    {index === 0 ? (
                      <ClipboardCheck className="h-5 w-5 text-white/50" />
                    ) : index < 3 ? (
                      <Mail className="h-5 w-5 text-white/50" />
                    ) : index === 3 ? (
                      <MonitorUp className="h-5 w-5 text-white/50" />
                    ) : index === 4 ? (
                      <GraduationCap className="h-5 w-5 text-white/50" />
                    ) : (
                      <Wrench className="h-5 w-5 text-white/50" />
                    )}
                  </div>
                  <h3 className="mt-4 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${pageSectionClass} mt-20`}>
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <div className="text-xs font-bold uppercase text-primary">
                {copy.proofKicker}
              </div>
              <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">
                {copy.proofTitle}
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                {copy.proofBody}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {copy.proof.map((item, index) => (
                <div
                  key={item}
                  className={`border border-slate-200 bg-white p-5 ${
                    index === copy.proof.length - 1 ? "sm:col-span-2" : ""
                  }`}
                >
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <p className="mt-4 text-base font-black leading-7 text-slate-900">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${pageSectionClass} mt-20`}>
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase text-primary">
              {copy.faqKicker}
            </div>
            <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">
              {copy.faqTitle}
            </h2>
          </div>
          <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {copy.faq.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black text-slate-950">
                  {question}
                  <span className="text-2xl font-normal text-primary group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-4xl pt-4 text-sm leading-7 text-slate-600">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className={`${pageSectionClass} mt-20`}>
          <div className="bg-primary px-6 py-12 text-center text-white sm:px-10">
            <Clock3 className="mx-auto h-9 w-9 text-white/80" />
            <h2 className="mt-5 text-3xl font-black sm:text-5xl">
              {copy.finalTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/85">
              {copy.finalBody}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                type="button"
                className="h-12 rounded-md bg-white px-6 text-primary hover:bg-white/90"
                onClick={() => goToForm("final_request")}
              >
                <ClipboardCheck className="me-2 h-5 w-5" />
                {copy.finalCta}
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-md border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackCampaignEvent("Contact", {
                      contact_method: "whatsapp",
                      locale: pageLocale,
                    })
                  }
                >
                  <MessageCircle className="me-2 h-5 w-5" />
                  {copy.askQuestion}
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
