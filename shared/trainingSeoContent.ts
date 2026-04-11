export type TrainingSeoLocale = "en" | "fr" | "ar";

export type TrainingSeoContent = {
  seoTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  outcomesTitle: string;
  outcomes: Array<{ title: string; body: string }>;
  modulesTitle: string;
  modules: Array<{ title: string; items: string[] }>;
  processTitle: string;
  process: Array<{ label: string; text: string }>;
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
  relatedTitle: string;
  related: Array<{ href: string; title: string; description: string }>;
};

export const TRAINING_SEO_CONTENT: Record<TrainingSeoLocale, TrainingSeoContent> = {
  en: {
    seoTitle: "Cabinet Vision Training for Cabinet Shops | CVsolucion",
    metaDescription:
      "Production-focused Cabinet Vision training for designers, engineers, CNC teams, UCS automation, S2M workflows, reports, libraries, and real shop implementation.",
    h1: "Cabinet Vision Training for Designers, Engineers, and Production Teams",
    intro:
      "This training is built for cabinet shops that need practical Cabinet Vision skills, not generic software demos. Sessions focus on real jobs, library structure, reports, S2M/xMachining, UCS logic, CNC handoff, and the habits that keep production output reliable.",
    outcomesTitle: "What the training is designed to improve",
    outcomes: [
      {
        title: "Faster daily modeling",
        body: "Designers learn cleaner job setup, controlled editing habits, and validation steps that reduce repeated corrections before production.",
      },
      {
        title: "More reliable production output",
        body: "Teams learn how reports, labels, materials, construction methods, and CNC handoff connect inside the real manufacturing workflow.",
      },
      {
        title: "Better team adoption",
        body: "Training is tied to your shop structure so designers, engineers, and operators understand the same rules instead of relying on tribal knowledge.",
      },
    ],
    modulesTitle: "Cabinet Vision training modules",
    modules: [
      {
        title: "Foundation workflow",
        items: [
          "Job, room, and cabinet setup",
          "Clean modeling habits for repeatable work",
          "Basic reports, validation, and production review",
        ],
      },
      {
        title: "Production workflow and reports",
        items: [
          "Setup Reports groups and reusable output routines",
          "Label configuration and production handoff standards",
          "Pricing, naming, and library consistency checks",
        ],
      },
      {
        title: "Advanced UCS, S2M, and automation",
        items: [
          "UCS logic, conditions, and controlled automation",
          "S2M/xMachining workflow review",
          "CNC-ready output validation and operator trust",
        ],
      },
    ],
    processTitle: "How training is delivered",
    process: [
      {
        label: "1",
        text: "Review the team's current Cabinet Vision level and the problems slowing production.",
      },
      {
        label: "2",
        text: "Train on live examples, real workflow decisions, and the exact modules the team needs.",
      },
      {
        label: "3",
        text: "Validate what changed through reports, output checks, and practical handoff steps.",
      },
      {
        label: "4",
        text: "Leave the team with repeatable rules they can use after the session.",
      },
    ],
    faqTitle: "Cabinet Vision training questions",
    faq: [
      {
        question: "Is this training for beginners or advanced Cabinet Vision users?",
        answer:
          "Both. The session can start with foundations, production workflow, or advanced UCS and S2M depending on the team's level.",
      },
      {
        question: "Can the training use our real shop setup?",
        answer:
          "Yes. Training is strongest when it uses your libraries, reports, production constraints, and current pain points.",
      },
      {
        question: "Do you train designers and CNC operators together?",
        answer:
          "Yes. Joint training is useful when design output, reports, and machine-ready files need better alignment.",
      },
      {
        question: "Is the training remote?",
        answer:
          "Yes. Sessions are delivered remotely through live review, screen sharing, and practical implementation guidance.",
      },
    ],
    relatedTitle: "Related Cabinet Vision support pages",
    related: [
      {
        href: "/cabinet-vision-support",
        title: "Cabinet Vision support",
        description: "Use this when training reveals setup, library, report, or workflow issues that need correction.",
      },
      {
        href: "/cabinet-vision-cnc-integration",
        title: "Cabinet Vision CNC integration",
        description: "Use this for S2M, xMachining, output consistency, and CNC handoff problems.",
      },
      {
        href: "/cabinet-vision-troubleshooting",
        title: "Cabinet Vision troubleshooting",
        description: "Use this for specific errors, unstable behavior, broken reports, or recurring production failures.",
      },
    ],
  },
  fr: {
    seoTitle: "Formation Cabinet Vision pour ateliers | CVsolucion",
    metaDescription:
      "Formation Cabinet Vision orientee production pour designers, ingenieurs, equipes CNC, UCS, S2M, rapports, bibliotheques et implementation atelier.",
    h1: "Formation Cabinet Vision pour designers, ingenieurs et equipes de production",
    intro:
      "Cette formation est concue pour les ateliers qui veulent des competences Cabinet Vision applicables en production, pas une demo generale. Les sessions couvrent jobs reels, bibliotheques, rapports, S2M/xMachining, logique UCS, sortie CNC et bonnes pratiques d'equipe.",
    outcomesTitle: "Ce que la formation doit ameliorer",
    outcomes: [
      {
        title: "Modelisation plus rapide",
        body: "Les designers apprennent une mise en place plus propre, des habitudes d'edition controlees et des validations avant production.",
      },
      {
        title: "Sortie production plus fiable",
        body: "L'equipe comprend mieux le lien entre rapports, etiquettes, matieres, methodes de construction et handoff CNC.",
      },
      {
        title: "Adoption plus stable",
        body: "La formation est adaptee a votre structure pour que designers, ingenieurs et operateurs suivent les memes regles.",
      },
    ],
    modulesTitle: "Modules de formation Cabinet Vision",
    modules: [
      {
        title: "Fondations du workflow",
        items: [
          "Setup Job, Room et cabinets",
          "Habitudes de modelisation propres et repetables",
          "Rapports de base, validation et revue production",
        ],
      },
      {
        title: "Workflow production et rapports",
        items: [
          "Groupes Setup Reports et routines reutilisables",
          "Etiquettes et standards de passage atelier",
          "Verification pricing, nommage et bibliotheques",
        ],
      },
      {
        title: "UCS, S2M et automatisation",
        items: [
          "Logique UCS, conditions et automatisation controlee",
          "Revue S2M/xMachining",
          "Validation sortie CNC et confiance operateur",
        ],
      },
    ],
    processTitle: "Comment la formation est livree",
    process: [
      { label: "1", text: "Evaluer le niveau actuel et les blocages qui ralentissent la production." },
      { label: "2", text: "Former sur des exemples reels et les modules dont l'equipe a vraiment besoin." },
      { label: "3", text: "Valider les changements via rapports, sorties et handoff production." },
      { label: "4", text: "Laisser des regles repetables utilisables apres la session." },
    ],
    faqTitle: "Questions sur la formation Cabinet Vision",
    faq: [
      {
        question: "La formation est-elle pour debutants ou utilisateurs avances ?",
        answer: "Les deux. La session peut couvrir les bases, le workflow production, UCS avance ou S2M selon le niveau.",
      },
      {
        question: "Pouvez-vous utiliser notre vrai setup ?",
        answer: "Oui. La formation est plus utile avec vos bibliotheques, rapports, contraintes et problemes actuels.",
      },
      {
        question: "Formez-vous designers et operateurs CNC ensemble ?",
        answer: "Oui. C'est utile quand la sortie design, les rapports et les fichiers machine doivent etre mieux alignes.",
      },
      {
        question: "La formation est-elle a distance ?",
        answer: "Oui. Elle se fait a distance avec revue en direct, partage d'ecran et guidance pratique.",
      },
    ],
    relatedTitle: "Pages liees au support Cabinet Vision",
    related: [
      {
        href: "/cabinet-vision-support",
        title: "Support Cabinet Vision",
        description: "Pour corriger les problemes de setup, bibliotheques, rapports ou workflow identifies pendant la formation.",
      },
      {
        href: "/cabinet-vision-cnc-integration",
        title: "Integration CNC Cabinet Vision",
        description: "Pour les problemes S2M, xMachining, coherence de sortie et handoff CNC.",
      },
      {
        href: "/cabinet-vision-troubleshooting",
        title: "Troubleshooting Cabinet Vision",
        description: "Pour erreurs precises, comportement instable, rapports casses ou echecs recurrents.",
      },
    ],
  },
  ar: {
    seoTitle: "تدريب Cabinet Vision للمصممين وفرق الإنتاج | CVsolucion",
    metaDescription:
      "تدريب Cabinet Vision عملي للمصممين والمهندسين وفرق CNC يشمل UCS وS2M والتقارير والمكتبات وتنفيذ سير عمل إنتاجي حقيقي.",
    h1: "تدريب Cabinet Vision للمصممين والمهندسين وفرق الإنتاج",
    intro:
      "هذا التدريب مخصص للورش التي تحتاج مهارات Cabinet Vision قابلة للتطبيق في الإنتاج، وليس عرضًا عامًا للبرنامج. نركز على ملفات حقيقية، بنية المكتبات، التقارير، S2M/xMachining، منطق UCS، تسليم ملفات CNC، والعادات التي تجعل المخرجات موثوقة.",
    outcomesTitle: "ما الذي يحسّنه التدريب",
    outcomes: [
      {
        title: "تصميم يومي أسرع",
        body: "يتعلم المصممون إعداد الملفات بطريقة أنظف، وتعديلًا أكثر ضبطًا، وخطوات تحقق تقلل التصحيحات قبل الإنتاج.",
      },
      {
        title: "مخرجات إنتاج أكثر ثباتًا",
        body: "يفهم الفريق علاقة التقارير والملصقات والمواد وطرق البناء وتسليم ملفات CNC داخل سير العمل الحقيقي.",
      },
      {
        title: "اعتماد أفضل داخل الفريق",
        body: "يتم ربط التدريب ببنية ورشتك حتى يعمل المصممون والمهندسون والمشغلون وفق قواعد موحدة بدل المعرفة الشفهية.",
      },
    ],
    modulesTitle: "وحدات تدريب Cabinet Vision",
    modules: [
      {
        title: "أساسيات سير العمل",
        items: [
          "إعداد Job وRoom والخزائن",
          "عادات نمذجة نظيفة قابلة للتكرار",
          "تقارير أساسية والتحقق قبل الإنتاج",
        ],
      },
      {
        title: "سير الإنتاج والتقارير",
        items: [
          "مجموعات Setup Reports وروتين إخراج قابل لإعادة الاستخدام",
          "إعداد الملصقات ومعايير تسليم الملفات للورشة",
          "التحقق من التسعير والتسمية واتساق المكتبات",
        ],
      },
      {
        title: "UCS وS2M والأتمتة",
        items: [
          "منطق UCS والشروط والأتمتة المضبوطة",
          "مراجعة سير S2M/xMachining",
          "التحقق من مخرجات CNC وثقة المشغل",
        ],
      },
    ],
    processTitle: "كيف يتم تقديم التدريب",
    process: [
      { label: "1", text: "مراجعة مستوى الفريق الحالي والمشاكل التي تبطئ الإنتاج." },
      { label: "2", text: "التدريب على أمثلة حقيقية والوحدات التي يحتاجها الفريق فعليًا." },
      { label: "3", text: "التحقق من النتائج عبر التقارير والمخرجات وخطوات التسليم للإنتاج." },
      { label: "4", text: "ترك قواعد عمل قابلة للتكرار بعد انتهاء الجلسة." },
    ],
    faqTitle: "أسئلة حول تدريب Cabinet Vision",
    faq: [
      {
        question: "هل التدريب للمبتدئين أم للمستخدمين المتقدمين؟",
        answer: "كلاهما. يمكن أن يبدأ التدريب من الأساسيات أو من سير الإنتاج أو UCS وS2M حسب مستوى الفريق.",
      },
      {
        question: "هل يمكن التدريب على إعدادات ورشتنا الحقيقية؟",
        answer: "نعم. أفضل تدريب هو الذي يعتمد على مكتباتك وتقاريرك وقيود الإنتاج والمشاكل التي تواجهك الآن.",
      },
      {
        question: "هل تدربون المصممين ومشغلي CNC معًا؟",
        answer: "نعم. هذا مفيد عندما تحتاج مخرجات التصميم والتقارير والملفات الجاهزة للماكينة إلى توافق أفضل.",
      },
      {
        question: "هل التدريب عن بعد؟",
        answer: "نعم. يتم التدريب عن بعد عبر مراجعة مباشرة ومشاركة شاشة وتوجيه عملي.",
      },
    ],
    relatedTitle: "صفحات مرتبطة بدعم Cabinet Vision",
    related: [
      {
        href: "/cabinet-vision-support",
        title: "دعم Cabinet Vision",
        description: "عندما يكشف التدريب مشاكل في الإعداد أو المكتبات أو التقارير أو سير العمل.",
      },
      {
        href: "/cabinet-vision-cnc-integration",
        title: "ربط Cabinet Vision مع CNC",
        description: "لمشاكل S2M وxMachining واتساق المخرجات وتسليم ملفات CNC.",
      },
      {
        href: "/cabinet-vision-troubleshooting",
        title: "تشخيص مشاكل Cabinet Vision",
        description: "للأخطاء المحددة والسلوك غير المستقر والتقارير المعطلة والمشاكل المتكررة.",
      },
    ],
  },
};
