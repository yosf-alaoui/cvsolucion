import {
  SEO_SERVICE_PAGES,
  type SeoLocale,
  type SeoServicePage,
  type SeoServicePageContent,
  type SeoServicePageKey,
} from "./seoServicePages";

function englishContent(page: SeoServicePage): SeoServicePageContent {
  return {
    shortTitle: page.shortTitle,
    seoTitle: page.seoTitle,
    metaDescription: page.metaDescription,
    h1: page.h1,
    heroBadge: page.heroBadge,
    heroLead: page.heroLead,
    heroBody: page.heroBody,
    blocks: page.blocks,
    faq: page.faq,
  };
}

const frPages = {} as Record<SeoServicePageKey, SeoServicePageContent>;
const arPages = {} as Record<SeoServicePageKey, SeoServicePageContent>;

Object.assign(frPages, {
  support: {
    shortTitle: "Support Cabinet Vision",
    seoTitle: "Support Cabinet Vision pour ateliers d'ebenisterie | CVsolucion",
    metaDescription:
      "Support Cabinet Vision pratique pour ateliers qui ont besoin d'un setup fiable, d'un workflow propre, de rapports coherents et d'une sortie production prete.",
    h1: "Support Cabinet Vision pour des workflows atelier reels",
    heroBadge: "SUPPORT CABINET VISION",
    heroLead:
      "Un support Cabinet Vision pratique pour les ateliers qui veulent un setup plus propre, une execution plus rapide et une sortie plus fiable.",
    heroBody:
      "Quand Cabinet Vision devient difficile a faire confiance, le probleme touche souvent le pricing, les rapports, la coherence des bibliotheques et le lien avec la production. CVsolucion aide les ateliers a stabiliser le systeme et a reconstruire une base plus fiable.",
    blocks: [
      {
        type: "cards",
        title: "Pourquoi les ateliers nous contactent",
        items: [
          "Cabinet Vision devient lent, instable ou incoherent",
          "Les bibliotheques, rapports et regles de pricing ne sont plus alignes",
          "La sortie CNC ou le handoff production cree du doute",
        ],
      },
      {
        type: "copy",
        title: "Ce que couvre le support",
        paragraphs: [
          "Le service peut inclure revue du systeme, isolation du probleme, nettoyage du workflow, amelioration de structure et recommandations orientees production.",
          "L'objectif n'est pas de corriger un symptome isole mais de rendre l'ensemble du workflow plus previsible et plus simple a maintenir.",
        ],
      },
      {
        type: "steps",
        title: "Notre methode",
        items: [
          { label: "1", text: "Revoir le setup actuel et les points de douleur" },
          { label: "2", text: "Identifier les zones a plus haut risque" },
          { label: "3", text: "Corriger ou reorganiser les zones critiques" },
        ],
      },
    ],
    faq: [
      {
        question: "Quel type de support fournissez-vous ?",
        answer: "Troubleshooting, nettoyage du workflow, revue de bibliotheques, logique de pricing et validation de la sortie production.",
      },
      {
        question: "Travaillez-vous a distance ?",
        answer: "Oui. Le service est concu pour une collaboration pratique a distance avec revue en direct et suivi structure.",
      },
    ],
  },
  troubleshooting: {
    shortTitle: "Troubleshooting Cabinet Vision",
    seoTitle: "Services de troubleshooting Cabinet Vision | CVsolucion",
    metaDescription:
      "Corrigez erreurs Cabinet Vision, comportements instables, problemes de rapports et blocages de workflow avec un troubleshooting pratique.",
    h1: "Un troubleshooting Cabinet Vision qui va au-dela du hasard",
    heroBadge: "TROUBLESHOOTING",
    heroLead:
      "Corrigez erreurs Cabinet Vision, comportement instable, rapports casses et problemes de workflow avant qu'ils ne deviennent des retards de production.",
    heroBody:
      "La plupart des problemes recurrents ne sont pas aleatoires. Ils sont souvent lies aux formules, bibliotheques, rapports, structure matiere ou conditions de sortie. CVsolucion aide a isoler la vraie cause puis a corriger la structure.",
    blocks: [
      {
        type: "cards",
        title: "Problemes courants",
        items: [
          "Erreurs recurrentes et messages d'avertissement",
          "Rapports ou etiquettes qui ne correspondent plus a la production",
          "Jobs qui se comportent differemment d'un fichier a l'autre",
        ],
      },
      {
        type: "copy",
        title: "Ce qui est vraiment revise",
        paragraphs: [
          "Nous analysons le probleme dans son contexte: logique matiere, standards, rapports, UCS, output conditions ou sequence exacte qui reproduit l'erreur.",
          "Le but est de restaurer un comportement previsible, pas seulement de faire disparaitre un message de l'ecran.",
        ],
      },
    ],
    faq: [
      {
        question: "Pouvez-vous aider sur une seule erreur ?",
        answer: "Oui. Beaucoup de sessions commencent par un seul probleme visible.",
      },
      {
        question: "Corrigez-vous aussi rapports et etiquettes ?",
        answer: "Oui. Beaucoup de projets de troubleshooting touchent directement aux rapports et au handoff production.",
      },
    ],
  },
  "library-setup": {
    shortTitle: "Setup des bibliotheques Cabinet Vision",
    seoTitle: "Setup et nettoyage des bibliotheques Cabinet Vision | CVsolucion",
    metaDescription:
      "Organisez bibliotheques, materiaux, assemblages et standards Cabinet Vision pour un workflow plus propre, moins d'erreurs et une production plus scalable.",
    h1: "Setup des bibliotheques Cabinet Vision pour des workflows plus propres",
    heroBadge: "SETUP BIBLIOTHEQUE",
    heroLead:
      "Organisez materiaux, assemblages, standards et logique de nommage pour rendre votre setup Cabinet Vision plus simple a gerer et plus facile a faire confiance.",
    heroBody:
      "Une structure bibliotheque faible cree des problemes partout ailleurs. Les devis deviennent incoherents, le design ralentit et la production perd confiance dans ce qu'elle recoit. CVsolucion aide a nettoyer la structure et simplifier la logique.",
    blocks: [
      {
        type: "copy",
        title: "Signes qu'un nettoyage est necessaire",
        paragraphs: [
          "Le meme materiau apparait sous plusieurs noms, les designers utilisent des conventions differentes ou les nouveaux membres de l'equipe ne savent pas quoi utiliser et quand.",
          "Ces signes indiquent souvent qu'une remise a plat de la bibliotheque est necessaire.",
        ],
      },
      {
        type: "facts",
        title: "Ce qui peut etre repris",
        items: [
          { label: "Materiaux", text: "Organisation et coherence des references" },
          { label: "Assemblages", text: "Nettoyage et standardisation des comportements" },
          { label: "Nommage", text: "Regles plus claires pour la maintenance" },
        ],
      },
    ],
    faq: [
      {
        question: "Est-ce seulement pour les grandes usines ?",
        answer: "Non. Meme les petits ateliers gagnent en clarte et en vitesse avec une bibliotheque plus propre.",
      },
      {
        question: "Est-ce utile aussi pour le pricing et les rapports ?",
        answer: "Oui. La qualite de la bibliotheque influence la logique de devis et les rapports en aval.",
      },
    ],
  },
  "cnc-integration": {
    shortTitle: "Integration CNC Cabinet Vision",
    seoTitle: "Integration CNC et support de sortie Cabinet Vision | CVsolucion",
    metaDescription:
      "Ameliorez l'integration CNC Cabinet Vision, la coherence de la sortie et la confiance operateur avec une revue structuree du setup et du handoff production.",
    h1: "Integration CNC Cabinet Vision pour une sortie machine plus fiable",
    heroBadge: "INTEGRATION CNC",
    heroLead:
      "Ameliorez la connexion entre Cabinet Vision et votre workflow CNC pour une sortie plus previsible et plus exploitable sur le plancher.",
    heroBody:
      "Les problemes CNC ne sont presque jamais seulement des problemes machine. Ils commencent souvent plus haut dans la logique design, les materiaux, les rapports ou le comportement du post. CVsolucion aide a revoir le chemin complet du modele jusqu'a la sortie machine.",
    blocks: [
      {
        type: "copy",
        title: "Quand ce service est pertinent",
        paragraphs: [
          "Quand la sortie est incoherente, que les operateurs font trop de verifications manuelles ou que les fichiers prets production inspirent peu de confiance.",
        ],
      },
      {
        type: "cards",
        title: "Objectifs concrets",
        items: [
          "Sortie CNC plus previsible",
          "Meilleur alignement entre design et usinage",
          "Confiance operateur plus forte dans les fichiers liberes",
        ],
      },
    ],
    faq: [
      {
        question: "Travaillez-vous avec S2M et les workflows d'usinage ?",
        answer: "Oui. Cette page cible justement les ateliers qui veulent une sortie production plus fiable.",
      },
      {
        question: "Est-ce seulement une question de posts ?",
        answer: "Non. Beaucoup de problemes CNC naissent plus tot dans le workflow.",
      },
    ],
  },
  "performance-optimization": {
    shortTitle: "Optimisation des performances Cabinet Vision",
    seoTitle: "Optimisation des performances Cabinet Vision | CVsolucion",
    metaDescription:
      "Accelerez Cabinet Vision, reduisez les crashs et ameliorez la stabilite du systeme avec une revue structuree des performances et du workflow.",
    h1: "Optimisation des performances Cabinet Vision pour un travail plus rapide",
    heroBadge: "OPTIMISATION PERFORMANCE",
    heroLead:
      "Reduisez lenteurs, crashs et comportements instables pour que Cabinet Vision devienne plus rapide a utiliser et plus fiable pour votre equipe.",
    heroBody:
      "Quand le systeme devient lent, chaque tache devient plus lourde. CVsolucion aide a identifier les causes structurelles derriere le manque de reactivite et a stabiliser les zones qui font perdre le plus de temps.",
    blocks: [
      {
        type: "cards",
        title: "Symptomes les plus courants",
        items: [
          "Lenteurs et lag pendant l'edition",
          "Crashs ou gels inattendus",
          "Reticence a ouvrir des jobs plus lourds",
        ],
      },
      {
        type: "copy",
        title: "Pourquoi il faut corriger vite",
        paragraphs: [
          "Un systeme lent change les habitudes de travail, pousse aux contournements et augmente la fatigue de l'equipe.",
          "Le but est de rendre l'environnement plus stable et plus agreable a utiliser au quotidien.",
        ],
      },
    ],
    faq: [
      {
        question: "Pouvez-vous aider si le systeme reste utilisable ?",
        answer: "Oui. Traiter le probleme tot evite souvent des instabilites plus lourdes plus tard.",
      },
      {
        question: "Est-ce seulement une question de hardware ?",
        answer: "Non. La structure du workflow et l'organisation du systeme comptent beaucoup.",
      },
    ],
  },
  "install-backup-restore": {
    shortTitle: "Installation, backup et restore Cabinet Vision",
    seoTitle: "Support installation, backup et restore Cabinet Vision | CVsolucion",
    metaDescription:
      "Obtenez de l'aide pour installation, migration, upgrade, backup, restore et recovery Cabinet Vision afin de reduire les interruptions et proteger la continuite du workflow.",
    h1: "Support Cabinet Vision pour installation, sauvegarde et restauration",
    heroBadge: "INSTALLATION + BACKUP / RESTORE",
    heroLead:
      "Protegez votre setup Cabinet Vision pendant l'installation, la migration, la mise a jour ou la restauration pour eviter que l'arret technique ne devienne du chaos.",
    heroBody:
      "Les changements critiques doivent etre geres avec methode. Qu'il s'agisse d'une nouvelle installation, d'un changement de version ou d'une recuperation apres incident, CVsolucion aide les ateliers a reduire le risque et a garder le workflow intact.",
    blocks: [
      {
        type: "copy",
        title: "Situations couvertes",
        paragraphs: [
          "Installation, migration vers une autre machine, mise a jour de version, reconstruction apres perte de donnees ou remise en route apres incident.",
        ],
      },
      {
        type: "copy",
        title: "La priorite: la continuite",
        paragraphs: [
          "Le service protege a la fois l'environnement logiciel et le workflow de production construit autour.",
          "Le but est d'avancer sans perdre structure, standards ou confiance operateur.",
        ],
      },
    ],
    faq: [
      {
        question: "Pouvez-vous intervenir avant un upgrade ?",
        answer: "Oui. Une preparation preventive vaut souvent plus qu'une restauration apres echec.",
      },
      {
        question: "Pouvez-vous aider apres une perte de setup ?",
        answer: "Oui. Les scenarios de recovery et restore sont au coeur de ce service.",
      },
    ],
  },
  "custom-programming": {
    shortTitle: "Programmation sur mesure Cabinet Vision",
    seoTitle: "Programmation sur mesure Cabinet Vision et developpement UCS | CVsolucion",
    metaDescription:
      "Etendez Cabinet Vision avec programmation sur mesure, logique UCS, amelioration des rapports et automatisation adaptee a votre production.",
    h1: "Programmation sur mesure Cabinet Vision pour des workflows plus intelligents",
    heroBadge: "PROGRAMMATION SUR MESURE",
    heroLead:
      "Etendez Cabinet Vision avec une logique metier, une automatisation plus propre et des ameliorations adaptees a la facon dont votre atelier travaille reellement.",
    heroBody:
      "Quand les fonctions standard ne suffisent plus, la programmation sur mesure devient le lien entre la capacite du logiciel et la realite operationnelle. CVsolucion aide a definir, construire et fiabiliser cette couche personnalisee.",
    blocks: [
      {
        type: "copy",
        title: "A quoi sert cette page",
        paragraphs: [
          "Elle s'adresse aux ateliers qui connaissent deja leurs points de douleur et veulent que Cabinet Vision fasse plus: UCS, logique sur mesure, meilleurs rapports ou automatisation ciblee.",
        ],
      },
      {
        type: "facts",
        title: "Themes frequents",
        items: [
          { label: "UCS", text: "Ajouter un comportement specifique et une automatisation controlee" },
          { label: "Rapports", text: "Ameliorer l'information production" },
          { label: "Standards", text: "Supporter des pratiques repetables dans l'equipe" },
        ],
      },
    ],
    faq: [
      {
        question: "Est-ce seulement pour les utilisateurs avances ?",
        answer: "Le plus souvent oui, ou pour les equipes qui montent vers des besoins plus avances.",
      },
      {
        question: "Pouvez-vous aider a definir le besoin avant de developper ?",
        answer: "Oui. Cadrer le vrai besoin operationnel fait partie du processus.",
      },
    ],
  },
});

Object.assign(arPages, {
  support: {
    shortTitle: "دعم Cabinet Vision",
    seoTitle: "دعم Cabinet Vision لمصانع الخزائن | CVsolucion",
    metaDescription:
      "دعم عملي لبرنامج Cabinet Vision يشمل التهيئة، التشخيص، تنظيف المكتبات، إصلاح التقارير، ومخرجات إنتاج جاهزة وموثوقة.",
    h1: "دعم Cabinet Vision لسير عمل إنتاجي حقيقي",
    heroBadge: "دعم CABINET VISION",
    heroLead:
      "دعم عملي للورش والمصانع التي تحتاج إلى إعداد منظم، تنفيذ أسرع، ومخرجات موثوقة من التصميم حتى الإنتاج.",
    heroBody:
      "عندما يصبح Cabinet Vision صعب الثقة، فالمشكلة غالبًا لا تكون مجرد خلل برمجي. عادة تمتد إلى التسعير، والتقارير، وتناسق المكتبات، ومخرجات CNC، وسير العمل اليومي. تساعد CVsolucion الورش على تثبيت المنظومة وإزالة أسباب التعطيل المتكرر.",
    blocks: [
      {
        type: "cards",
        title: "لماذا تتواصل معنا الورش",
        items: [
          "بطء أو عدم استقرار أو تناقض في سلوك Cabinet Vision",
          "مكتبات وتقارير ومنطق تسعير لم تعد تعمل بانسجام",
          "مشاكل في مخرجات CNC أو تسليم الملفات للإنتاج",
        ],
      },
      {
        type: "copy",
        title: "ماذا يشمل هذا الدعم",
        paragraphs: [
          "يشمل العمل مراجعة النظام، وعزل المشكلة، وتنظيف سير العمل، وتحسين البنية، وتقديم توصيات مرتبطة بالإنتاج الفعلي.",
          "الهدف ليس معالجة عرض منفرد فقط، بل جعل سير العمل كله أكثر قابلية للتوقع وأسهل في الصيانة.",
        ],
      },
      {
        type: "steps",
        title: "كيف نعمل",
        items: [
          { label: "1", text: "مراجعة الإعداد الحالي ونقاط الألم" },
          { label: "2", text: "تحديد المناطق الأعلى خطورة" },
          { label: "3", text: "إصلاح أو إعادة تنظيم المناطق الحرجة" },
        ],
      },
    ],
    faq: [
      {
        question: "ما نوع الدعم الذي تقدمه CVsolucion؟",
        answer:
          "يشمل الدعم التشخيص، وتنظيف سير العمل، ومراجعة المكتبات، ومنطق التسعير، ومواءمة التقارير، والتحقق من المخرجات الإنتاجية.",
      },
      {
        question: "هل تعملون عن بعد؟",
        answer:
          "نعم. الخدمة مبنية على تعاون عملي عن بعد مع مراجعة مباشرة ومشاركة شاشة ومتابعة منظمة.",
      },
    ],
  },
  troubleshooting: {
    shortTitle: "تشخيص مشاكل Cabinet Vision",
    seoTitle: "خدمات تشخيص مشاكل Cabinet Vision | CVsolucion",
    metaDescription:
      "أصلح أخطاء Cabinet Vision والسلوك غير المستقر ومشاكل التقارير وتعثر سير العمل من خلال تشخيص عملي منظم.",
    h1: "تشخيص Cabinet Vision يتجاوز التجربة والخطأ",
    heroBadge: "تشخيص الأخطاء",
    heroLead:
      "أصلح أخطاء Cabinet Vision والسلوك غير المستقر والتقارير المكسورة ومشاكل سير العمل قبل أن تتحول إلى تأخير في الإنتاج.",
    heroBody:
      "معظم المشاكل المتكررة ليست عشوائية. غالبًا ترتبط بالمعادلات، أو المكتبات، أو بنية المواد، أو التقارير، أو المخرجات، أو تغييرات أُجريت دون مسار ثابت. تساعد CVsolucion على عزل السبب الحقيقي ثم تصحيح البنية.",
    blocks: [
      {
        type: "cards",
        title: "المشاكل الشائعة",
        items: [
          "أخطاء ورسائل تحذير متكررة",
          "تقارير أو لاصقات لم تعد مطابقة للإنتاج",
          "ملفات تتصرف بشكل مختلف من job إلى آخر",
        ],
      },
      {
        type: "copy",
        title: "ما الذي تتم مراجعته فعليًا",
        paragraphs: [
          "نحلل المشكلة داخل سياقها: منطق المواد، والـstandards، والتقارير، وUCS، وشروط الإخراج، أو التسلسل الذي يعيد الخطأ.",
          "الهدف هو إعادة السلوك المتوقع، لا مجرد إخفاء رسالة الخطأ.",
        ],
      },
    ],
    faq: [
      {
        question: "هل يمكنكم المساعدة في خطأ واحد فقط؟",
        answer: "نعم. كثير من الجلسات تبدأ من مشكلة واحدة واضحة.",
      },
      {
        question: "هل تصلحون أيضًا مشاكل التقارير واللاصيقات؟",
        answer: "نعم. كثير من مشاريع التشخيص تتعلق مباشرة بالتقارير وتسليم المعلومات للإنتاج.",
      },
    ],
  },
  "library-setup": {
    shortTitle: "إعداد مكتبات Cabinet Vision",
    seoTitle: "إعداد وتنظيف مكتبات Cabinet Vision | CVsolucion",
    metaDescription:
      "نظّم مكتبات Cabinet Vision والمواد والتجميعات والـstandards للحصول على سير عمل أنظف وأخطاء أقل وإنتاج أكثر قابلية للتوسع.",
    h1: "إعداد مكتبات Cabinet Vision لسير عمل أنظف",
    heroBadge: "إعداد المكتبات",
    heroLead:
      "نظّم المواد والتجميعات والـstandards ومنطق التسمية حتى يصبح إعداد Cabinet Vision أسهل في الإدارة وأسهل في الثقة.",
    heroBody:
      "البنية الضعيفة للمكتبة تصنع مشاكل في كل ما بعدها. يصبح التسعير غير متناسق، ويتباطأ التصميم، ويصعب التحقق من التقارير، ويفقد الإنتاج الثقة فيما يصله. تساعد CVsolucion على تنظيف الهيكل وتبسيط المنطق.",
    blocks: [
      {
        type: "copy",
        title: "علامات تدل أن المكتبة تحتاج إلى عمل",
        paragraphs: [
          "غالبًا تحتاج المكتبة إلى تنظيف إذا كان نفس الماتيريال يظهر بعدة أسماء، أو كان المصممون يستعملون قواعد مختلفة لنفس العناصر، أو كان الموظفون الجدد لا يعرفون ما الذي يجب استعماله ومتى.",
          "هذه الإشارات تدل عادة على أن البنية الحالية لم تعد قابلة للتوسع بسهولة.",
        ],
      },
      {
        type: "facts",
        title: "ما الذي يمكن تنظيمه",
        items: [
          { label: "المواد", text: "تنظيم المراجع وتوحيدها" },
          { label: "التجميعات", text: "تنظيف السلوك وتوحيد العمل" },
          { label: "التسمية", text: "قواعد أوضح للصيانة المستقبلية" },
        ],
      },
    ],
    faq: [
      {
        question: "هل هذه الخدمة فقط للمصانع الكبيرة؟",
        answer: "لا. حتى الورش الصغيرة تستفيد من مكتبة أنظف إذا كانت تريد عملاً أسرع وارتباكًا أقل.",
      },
      {
        question: "هل يفيد ذلك في التسعير والتقارير؟",
        answer: "نعم. جودة المكتبة تؤثر مباشرة في منطق التسعير وفي التقارير اللاحقة.",
      },
    ],
  },
  "cnc-integration": {
    shortTitle: "ربط CNC مع Cabinet Vision",
    seoTitle: "ربط CNC ودعم المخرجات في Cabinet Vision | CVsolucion",
    metaDescription:
      "حسّن ربط Cabinet Vision مع CNC وتناسق المخرجات وثقة المشغل من خلال مراجعة منظمة للإعداد وتسليم الملفات للإنتاج.",
    h1: "ربط Cabinet Vision مع CNC لمخرجات أكثر موثوقية",
    heroBadge: "ربط CNC",
    heroLead:
      "حسّن العلاقة بين Cabinet Vision وسير عمل CNC حتى تصبح المخرجات أكثر قابلية للتوقع وأسهل في الاستخدام على أرضية الإنتاج.",
    heroBody:
      "مشاكل CNC نادرًا ما تكون مشاكل ماكينة فقط. غالبًا تبدأ في منطق التصميم أو المواد أو التقارير أو سلوك الـpost. تساعد CVsolucion الورش على مراجعة المسار الكامل من الموديل إلى المخرجات الجاهزة للماكينة.",
    blocks: [
      {
        type: "copy",
        title: "متى تكون هذه الصفحة هي الخيار الصحيح",
        paragraphs: [
          "عندما تعاني الورشة من مخرجات غير متناسقة، أو كثرة الفحوص اليدوية من المشغل، أو مفاجآت أثناء التشغيل، أو شك متكرر حول جاهزية الملفات للإنتاج.",
        ],
      },
      {
        type: "cards",
        title: "أهداف عملية",
        items: [
          "مخرجات CNC أكثر قابلية للتوقع",
          "تطابق أفضل بين نية التصميم وواقع التشغيل",
          "ثقة أكبر للمشغل في الملفات المعتمدة",
        ],
      },
    ],
    faq: [
      {
        question: "هل تعملون مع S2M ومسارات التشغيل؟",
        answer: "نعم. هذه الصفحة مخصصة للورش التي تريد مخرجات إنتاج أكثر موثوقية.",
      },
      {
        question: "هل الموضوع فقط متعلق بالـposts؟",
        answer: "لا. كثير من مشاكل CNC تبدأ أبكر داخل سير العمل.",
      },
    ],
  },
  "performance-optimization": {
    shortTitle: "تحسين أداء Cabinet Vision",
    seoTitle: "تحسين أداء Cabinet Vision | CVsolucion",
    metaDescription:
      "سرّع Cabinet Vision وقلّل الأعطال وحسّن استقرار النظام من خلال مراجعة منظمة للأداء وتحسين سير العمل.",
    h1: "تحسين أداء Cabinet Vision لعمل أسرع",
    heroBadge: "تحسين الأداء",
    heroLead:
      "قلّل البطء والأعطال والسلوك غير المستقر حتى يصبح Cabinet Vision أسرع في الاستعمال وأسهل على فريقك في الاعتماد عليه.",
    heroBody:
      "عندما يصبح النظام بطيئًا، تصبح كل مهمة أثقل. يبدأ التردد، وتطول المراجعات، وتتحول الاحتكاكات الصغيرة إلى وقت ضائع طوال اليوم. تساعد CVsolucion على تحديد الأسباب البنيوية وراء ضعف الأداء وتحسين الاستقرار في الأماكن الأكثر تأثيرًا.",
    blocks: [
      {
        type: "cards",
        title: "الأعراض الشائعة",
        items: [
          "بطء واستجابة متأخرة أثناء التعديل",
          "أعطال أو تجمّد مفاجئ",
          "تردد في العمل على ملفات أثقل",
        ],
      },
      {
        type: "copy",
        title: "لماذا يجب معالجة الأمر بسرعة",
        paragraphs: [
          "ضعف الأداء لا يضيع دقائق فقط، بل يغير سلوك الفريق ويدفعه إلى حلول مؤقتة تجعل النظام أصعب في الصيانة.",
          "الهدف هو بيئة عمل أكثر ثباتًا وراحة على المدى اليومي.",
        ],
      },
    ],
    faq: [
      {
        question: "هل يمكنكم المساعدة إذا كان النظام ما زال يعمل؟",
        answer: "نعم. معالجة المشكلة مبكرًا تمنع غالبًا مشاكل استقرار أكبر لاحقًا.",
      },
      {
        question: "هل الأمر فقط متعلق بالهاردوير؟",
        answer: "لا. بنية سير العمل وتنظيم النظام لهما تأثير كبير أيضًا.",
      },
    ],
  },
  "install-backup-restore": {
    shortTitle: "تثبيت ونسخ احتياطي واسترجاع Cabinet Vision",
    seoTitle: "دعم تثبيت ونسخ احتياطي واسترجاع Cabinet Vision | CVsolucion",
    metaDescription:
      "احصل على دعم في تثبيت Cabinet Vision والترقية والنسخ الاحتياطي والاسترجاع والهجرة لتقليل التوقف وحماية استمرارية سير العمل.",
    h1: "دعم Cabinet Vision للتثبيت والنسخ الاحتياطي والاسترجاع",
    heroBadge: "تثبيت + نسخ احتياطي / استرجاع",
    heroLead:
      "احمِ إعداد Cabinet Vision أثناء التثبيت أو الترقية أو الهجرة أو الاسترجاع حتى لا يتحول التوقف التقني إلى فوضى تشغيلية.",
    heroBody:
      "التغييرات الحساسة داخل النظام يجب أن تُدار بمنهج واضح. سواء كان الأمر تثبيتًا جديدًا أو تغيير إصدار أو استبدال جهاز أو استرجاعًا بعد مشكلة، تساعد CVsolucion الورش على تقليل المخاطر والحفاظ على سير العمل سليمًا.",
    blocks: [
      {
        type: "copy",
        title: "الحالات التي تغطيها هذه الصفحة",
        paragraphs: [
          "تثبيت Cabinet Vision، أو الانتقال إلى جهاز آخر، أو التحديث إلى إصدار جديد، أو إعادة بناء البيئة بعد فقدان بيانات، أو استرجاع الاستقرار بعد مشكلة غير متوقعة.",
        ],
      },
      {
        type: "copy",
        title: "الأولوية هي الاستمرارية",
        paragraphs: [
          "الهدف هو حماية البيئة البرمجية وسير الإنتاج المبني حولها معًا.",
          "المسار الأفضل يسمح بالتقدم دون فقدان structure أو standards أو ثقة المشغل.",
        ],
      },
    ],
    faq: [
      {
        question: "هل يمكنكم المساعدة قبل الترقية؟",
        answer: "نعم. التخطيط الوقائي غالبًا أكثر قيمة من الاسترجاع بعد فشل التغيير.",
      },
      {
        question: "هل يمكنكم المساعدة بعد فقدان الإعداد؟",
        answer: "نعم. سيناريوهات التعافي والاسترجاع جزء أساسي من هذه الخدمة.",
      },
    ],
  },
  "custom-programming": {
    shortTitle: "برمجة مخصصة لـ Cabinet Vision",
    seoTitle: "برمجة مخصصة وتطوير UCS في Cabinet Vision | CVsolucion",
    metaDescription:
      "وسّع Cabinet Vision عبر برمجة مخصصة ومنطق UCS وتحسين التقارير وأتمتة مصممة حسب احتياجات الإنتاج الفعلية.",
    h1: "برمجة مخصصة لـ Cabinet Vision من أجل سير عمل أذكى",
    heroBadge: "برمجة مخصصة",
    heroLead:
      "وسّع Cabinet Vision بمنطق مخصص وأتمتة أذكى وتحسينات مبنية على الطريقة التي تعمل بها ورشتك فعليًا.",
    heroBody:
      "عندما لا تكفي الوظائف القياسية، تصبح البرمجة المخصصة الجسر بين قدرة البرنامج والواقع التشغيلي. تساعد CVsolucion على تعريف هذا الجسر وبنائه وتحسينه حتى يعمل مع فريقك ومنتجاتك وسير إنتاجك.",
    blocks: [
      {
        type: "copy",
        title: "لمن صُممت هذه الصفحة",
        paragraphs: [
          "موجهة للورش التي تعرف نقاط الألم داخل العملية الحالية وتريد أن يفعل Cabinet Vision المزيد: منطق مخصص، تطوير UCS، تقارير أفضل أو أتمتة محددة.",
        ],
      },
      {
        type: "facts",
        title: "مواضيع تخصيص شائعة",
        items: [
          { label: "UCS", text: "إضافة سلوك خاص وأتمتة مضبوطة" },
          { label: "التقارير", text: "تحسين فائدة المعلومات الإنتاجية" },
          { label: "Standards", text: "دعم ممارسات تصميم قابلة للتكرار" },
        ],
      },
    ],
    faq: [
      {
        question: "هل هذه الخدمة فقط للمستخدمين المتقدمين؟",
        answer: "غالبًا نعم، أو للفرق التي تتجه نحو احتياجات أكثر تقدمًا.",
      },
      {
        question: "هل يمكنكم المساعدة في تعريف الحاجة قبل التطوير؟",
        answer: "نعم. تحديد الحاجة التشغيلية الحقيقية جزء مهم من العملية.",
      },
    ],
  },
});

const localizedPages: Record<
  Exclude<SeoLocale, "en">,
  Record<SeoServicePageKey, SeoServicePageContent>
> = {
  fr: frPages,
  ar: arPages,
};

export function getSeoServicePageContent(
  page: SeoServicePage,
  locale: SeoLocale,
): SeoServicePageContent {
  if (locale === "en") {
    return englishContent(page);
  }

  return localizedPages[locale][page.key];
}

export function getSeoServicePageTitleByKey(
  key: SeoServicePageKey,
  locale: SeoLocale,
) {
  return getSeoServicePageContent(SEO_SERVICE_PAGES[key], locale).shortTitle;
}
