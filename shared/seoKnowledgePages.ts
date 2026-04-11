export type SeoKnowledgePageKey =
  | "s2m-troubleshooting"
  | "slow-performance"
  | "database-errors"
  | "report-errors"
  | "cnc-output-problems";

export type SeoKnowledgeLocale = "en" | "fr" | "ar";

export type SeoKnowledgeBlock = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type SeoKnowledgePageContent = {
  shortTitle: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  heroBadge: string;
  heroLead: string;
  intro: string;
  blocks: SeoKnowledgeBlock[];
  faq: Array<{ question: string; answer: string }>;
};

export type SeoKnowledgePage = {
  key: SeoKnowledgePageKey;
  canonicalPath: string;
  content: Record<SeoKnowledgeLocale, SeoKnowledgePageContent>;
  relatedPaths: string[];
};

export const SEO_KNOWLEDGE_PAGE_ORDER: SeoKnowledgePageKey[] = [
  "s2m-troubleshooting",
  "slow-performance",
  "database-errors",
  "report-errors",
  "cnc-output-problems",
];

const block = (title: string, paragraphs: string[], bullets?: string[]): SeoKnowledgeBlock => ({
  title,
  paragraphs,
  ...(bullets ? { bullets } : {}),
});

const content = (
  shortTitle: string,
  seoTitle: string,
  metaDescription: string,
  h1: string,
  heroBadge: string,
  heroLead: string,
  intro: string,
  blocks: SeoKnowledgeBlock[],
  faq: Array<{ question: string; answer: string }>,
): SeoKnowledgePageContent => ({
  shortTitle,
  seoTitle,
  metaDescription,
  h1,
  heroBadge,
  heroLead,
  intro,
  blocks,
  faq,
});

const page = (
  key: SeoKnowledgePageKey,
  canonicalPath: string,
  relatedPaths: string[],
  localizedContent: Record<SeoKnowledgeLocale, SeoKnowledgePageContent>,
): SeoKnowledgePage => ({ key, canonicalPath, relatedPaths, content: localizedContent });

const seoKnowledgePages: Partial<Record<SeoKnowledgePageKey, SeoKnowledgePage>> = {
  "s2m-troubleshooting": page(
    "s2m-troubleshooting",
    "/cabinet-vision-s2m-troubleshooting",
    [
      "/cabinet-vision-troubleshooting",
      "/cabinet-vision-cnc-integration",
      "/cabinet-vision-cnc-output-problems",
      "/training",
      "/book",
    ],
    {
      en: content(
        "Cabinet Vision S2M Troubleshooting",
        "Cabinet Vision S2M Troubleshooting Guide | CVsolucion",
        "Troubleshoot Cabinet Vision S2M and Screen-to-Machine output problems by checking setup, machining logic, reports, posts, and operator validation.",
        "Cabinet Vision S2M Troubleshooting for Screen-to-Machine Output",
        "S2M TROUBLESHOOTING",
        "When S2M output needs manual correction, the root cause is often upstream from the CNC.",
        "S2M troubleshooting should trace the full path from materials, construction methods, machining rules, reports, and post behavior to the file the operator receives.",
        [
          block(
            "Common S2M symptoms",
            [
              "Shops notice S2M problems when the CNC operator starts double-checking every file, comparing old CAM output, or asking whether a post is safe to run.",
              "The visible issue may be a wrong cut, drilling behavior, missing operation, or output that behaves differently from one job to another.",
            ],
            [
              "Screen-to-Machine files need manual correction before production.",
              "Operators do not trust the released output.",
              "Old CAM output is still used as a safety comparison.",
            ],
          ),
          block("What CVsolucion checks", [
            "We check whether Cabinet Vision is producing the correct intent before the file reaches the machine: material logic, machining assumptions, report conditions, and post expectations.",
            "If output is technically valid but not validated by production, the workflow is still incomplete.",
          ]),
          block("Why the post is not always the cause", [
            "A post can only process the logic it receives. If materials, construction methods, or machining rules are inconsistent, the post may expose the problem without causing it.",
            "A safer review separates setup problems, post problems, report problems, and training problems.",
          ]),
        ],
        [
          {
            question: "Is S2M troubleshooting only about the post?",
            answer:
              "No. The post matters, but many S2M failures start in setup, materials, construction logic, reports, or validation workflow.",
          },
          {
            question: "Can S2M output be correct but still unsafe to use?",
            answer:
              "Yes. If production has not validated the output, operators will keep using manual checks and confidence will stay low.",
          },
        ],
      ),
      fr: content(
        "Troubleshooting S2M Cabinet Vision",
        "Troubleshooting Cabinet Vision S2M | CVsolucion",
        "Diagnostiquer les problemes Cabinet Vision S2M et Screen-to-Machine en verifiant setup, logique d'usinage, rapports, posts et validation operateur.",
        "Troubleshooting Cabinet Vision S2M pour la sortie Screen-to-Machine",
        "TROUBLESHOOTING S2M",
        "Quand la sortie S2M demande des corrections manuelles, la cause est souvent avant la CNC.",
        "Le diagnostic S2M doit suivre le chemin complet: matieres, methodes de construction, regles d'usinage, rapports, post et fichier recu par l'operateur.",
        [
          block(
            "Symptomes courants",
            [
              "Le probleme apparait quand l'operateur CNC verifie chaque fichier, compare avec l'ancien CAM ou demande si le post est vraiment sur.",
              "Le symptome peut etre une coupe incorrecte, un percage inattendu, une operation manquante ou un comportement different selon le job.",
            ],
            [
              "Les fichiers Screen-to-Machine demandent une correction manuelle.",
              "Les operateurs ne font pas confiance a la sortie.",
              "L'ancien CAM reste utilise comme comparaison de securite.",
            ],
          ),
          block("Ce que CVsolucion verifie", [
            "Nous verifions si Cabinet Vision produit la bonne intention avant la machine: matieres, usinage, nommage, conditions de rapport et comportement du post.",
            "Une sortie techniquement valide mais non validee en production reste incomplete.",
          ]),
          block("Pourquoi le post n'est pas toujours la cause", [
            "Un post traite la logique qu'il recoit. Si la structure ou les methodes sont incoherentes, le post peut seulement rendre le probleme visible.",
          ]),
        ],
        [
          {
            question: "Le S2M concerne-t-il seulement le post ?",
            answer:
              "Non. Beaucoup de problemes S2M viennent du setup, des matieres, des methodes, des rapports ou de la validation.",
          },
          {
            question: "Une sortie S2M correcte peut-elle rester risquee ?",
            answer:
              "Oui. Sans validation production, les operateurs gardent les controles manuels et la confiance reste faible.",
          },
        ],
      ),
      ar: content(
        "تشخيص S2M في Cabinet Vision",
        "تشخيص مشاكل S2M في Cabinet Vision | CVsolucion",
        "تشخيص مشاكل S2M و Screen-to-Machine في Cabinet Vision عبر فحص الإعداد، منطق التشغيل، التقارير، post، وثقة المشغل.",
        "تشخيص مشاكل Cabinet Vision S2M ومخرجات Screen-to-Machine",
        "تشخيص S2M",
        "عندما تحتاج مخرجات S2M إلى تصحيح يدوي، فالمشكلة غالبا تبدأ قبل الوصول إلى CNC.",
        "تشخيص S2M يجب أن يتتبع المسار الكامل من المواد، طرق البناء، قواعد التشغيل، التقارير، وسلوك الـ post إلى الملف الذي يستلمه المشغل.",
        [
          block(
            "أعراض S2M الشائعة",
            [
              "تظهر المشكلة عندما يبدأ مشغل CNC في فحص كل ملف يدويا أو مقارنته بمخرجات CAM القديمة أو يسأل هل هذا الـ post آمن للتشغيل.",
              "قد يكون العرض الظاهر قطع غير صحيح، حفر غير متوقع، عملية مفقودة، أو اختلاف السلوك من ملف إلى آخر.",
            ],
            [
              "ملفات Screen-to-Machine تحتاج إلى تعديل يدوي قبل الإنتاج.",
              "المشغل لا يثق في الملفات التي يتم إصدارها.",
              "النظام القديم ما زال يستعمل كمرجع أمان.",
            ],
          ),
          block("ما الذي نفحصه", [
            "نراجع هل Cabinet Vision ينتج النية الصحيحة قبل وصول الملف إلى الماكينة: منطق المواد، قواعد التشغيل، شروط التقارير، وتوقعات الـ post.",
            "حتى لو كانت المخرجات صحيحة تقنيا، إذا لم يتم اعتمادها من الإنتاج فلن يثق بها المشغل.",
          ]),
          block("لماذا لا يكون الـ post دائما هو السبب", [
            "الـ post يعالج المنطق الذي يستلمه. إذا كانت المواد أو طرق البناء غير متناسقة، فقد يكشف الـ post المشكلة فقط ولا يكون سببها.",
          ]),
        ],
        [
          {
            question: "هل تشخيص S2M يعني فقط إصلاح الـ post؟",
            answer:
              "لا. الـ post مهم، لكن كثيرا من مشاكل S2M تبدأ في الإعداد، المواد، طرق البناء، التقارير أو طريقة التحقق.",
          },
          {
            question: "هل يمكن أن تكون المخرجات صحيحة لكنها غير آمنة للإنتاج؟",
            answer:
              "نعم. إذا لم يتم اعتمادها من الإنتاج، سيستمر المشغل في الفحص اليدوي ولن يثق بالنظام.",
          },
        ],
      ),
    },
  ),
  "slow-performance": page(
    "slow-performance",
    "/cabinet-vision-slow-performance",
    [
      "/cabinet-vision-performance-optimization",
      "/cabinet-vision-troubleshooting",
      "/cabinet-vision-database-errors",
      "/training",
      "/book",
    ],
    {
      en: content(
        "Slow Cabinet Vision Performance",
        "Slow Cabinet Vision Performance: What to Check | CVsolucion",
        "Cabinet Vision running slow, freezing, or crashing? Learn what to check before blaming hardware: files, libraries, reports, database, and workflow.",
        "Slow Cabinet Vision Performance: Causes, Checks, and Next Steps",
        "PERFORMANCE GUIDE",
        "Slow Cabinet Vision performance is usually a workflow signal, not just a computer problem.",
        "When Cabinet Vision becomes slow, teams often jump directly to hardware. Sometimes hardware matters, but many slowdowns come from heavy jobs, overloaded libraries, report logic, database structure, network behavior, or unstable standards.",
        [
          block(
            "Start by isolating the pattern",
            [
              "Before changing computers or reinstalling software, identify whether the slowdown is file-specific, user-specific, workstation-specific, network-specific, or system-wide.",
              "If only one job is slow, the cause is different from a case where every user is slow at the same time.",
            ],
            [
              "One file is slow: inspect job complexity and file data.",
              "One user is slow: check profile, permissions, and workflow habits.",
              "One workstation is slow: review resources and local environment.",
              "Everyone is slow: check shared libraries, database, network, and reports.",
            ],
          ),
          block("Typical causes inside Cabinet Vision", [
            "Performance problems often build over time. Libraries grow, reports accumulate conditions, materials get duplicated, and old workflows leave behind exceptions.",
            "The result is a system that still works, but every click costs more time and every large job feels risky.",
          ]),
          block("What CVsolucion reviews", [
            "A performance review can include file behavior, library structure, report logic, database symptoms, material setup, and the daily workflow that triggers delays.",
            "The goal is a more stable environment where the team can work without hesitation.",
          ]),
        ],
        [
          {
            question: "Should I upgrade hardware first?",
            answer:
              "Not before isolating the pattern. Hardware can help, but setup, reports, libraries, and database issues can create similar symptoms.",
          },
          {
            question: "Can report logic slow Cabinet Vision down?",
            answer:
              "Yes. Report logic, conditions, and output workflows can contribute to slow or unstable behavior.",
          },
        ],
      ),
      fr: content(
        "Cabinet Vision lent",
        "Cabinet Vision lent : quoi verifier | CVsolucion",
        "Cabinet Vision est lent, gele ou plante ? Verifiez fichiers, bibliotheques, rapports, base de donnees et workflow avant d'accuser le hardware.",
        "Cabinet Vision lent : causes, controles et prochaines etapes",
        "GUIDE PERFORMANCE",
        "Un Cabinet Vision lent signale souvent un probleme de workflow, pas seulement un probleme d'ordinateur.",
        "Quand Cabinet Vision devient lent, beaucoup d'equipes pensent tout de suite au hardware. Souvent, la cause vient aussi des jobs lourds, bibliotheques, rapports, base de donnees, reseau ou standards instables.",
        [
          block(
            "Isoler le pattern",
            [
              "Avant de changer de poste ou de reinstaller, il faut savoir si la lenteur concerne un fichier, un utilisateur, une station, le reseau ou tout le systeme.",
              "Cela evite les corrections au hasard et permet de viser la bonne cause.",
            ],
            [
              "Un seul fichier lent : verifier la complexite du job.",
              "Un seul utilisateur lent : verifier profil, droits et habitudes.",
              "Une station lente : verifier ressources et environnement local.",
              "Tout le monde est lent : verifier bibliotheques, base, reseau et rapports.",
            ],
          ),
          block("Causes frequentes", [
            "Les problemes de performance se construisent souvent dans le temps: bibliotheques qui grossissent, rapports trop conditionnels, materiaux dupliques et exceptions oubliees.",
            "Le systeme fonctionne encore, mais chaque clic coute plus de temps.",
          ]),
          block("Ce que CVsolucion revise", [
            "La revue peut couvrir comportement des fichiers, structure bibliotheque, logique des rapports, base de donnees, matieres et workflow quotidien.",
            "Le but est un environnement plus stable, pas seulement une impression de vitesse temporaire.",
          ]),
        ],
        [
          {
            question: "Faut-il changer le hardware en premier ?",
            answer:
              "Pas avant d'isoler le pattern. Le hardware peut aider, mais setup, rapports, bibliotheques et base peuvent creer les memes symptomes.",
          },
          {
            question: "Les rapports peuvent-ils ralentir Cabinet Vision ?",
            answer: "Oui. La logique de rapport et les conditions de sortie peuvent contribuer aux lenteurs.",
          },
        ],
      ),
      ar: content(
        "بطء Cabinet Vision",
        "بطء Cabinet Vision: ماذا يجب فحصه | CVsolucion",
        "إذا كان Cabinet Vision بطيئا أو يتجمد أو يتعطل، افحص الملفات والمكتبات والتقارير وقاعدة البيانات وسير العمل قبل اتهام الجهاز.",
        "بطء Cabinet Vision: الأسباب والفحوصات والخطوة التالية",
        "دليل الأداء",
        "بطء Cabinet Vision غالبا إشارة إلى مشكلة في سير العمل وليس فقط مشكلة جهاز.",
        "عندما يصبح Cabinet Vision بطيئا، يتم غالبا اتهام الجهاز مباشرة. لكن كثيرا من البطء يأتي من ملفات ثقيلة، مكتبات متراكمة، تقارير معقدة، قاعدة بيانات غير نظيفة، شبكة، أو standards غير مستقرة.",
        [
          block(
            "ابدأ بعزل النمط",
            [
              "قبل تغيير الجهاز أو إعادة التثبيت، يجب معرفة هل البطء مرتبط بملف واحد، مستخدم واحد، محطة عمل واحدة، الشبكة، أو كل النظام.",
              "إذا كان ملف واحد فقط بطيئا فسببه يختلف عن بطء كل المستخدمين في نفس الوقت.",
            ],
            [
              "ملف واحد بطيء: افحص تعقيد المشروع وبياناته.",
              "مستخدم واحد بطيء: افحص الصلاحيات والعادات وطريقة العمل.",
              "جهاز واحد بطيء: افحص موارد الجهاز والبيئة المحلية.",
              "الجميع بطيء: افحص المكتبات المشتركة، قاعدة البيانات، الشبكة، والتقارير.",
            ],
          ),
          block("أسباب شائعة داخل Cabinet Vision", [
            "مشاكل الأداء تتراكم مع الوقت: مكتبات تكبر، تقارير بشروط كثيرة، مواد مكررة، واستثناءات قديمة ينساها الفريق.",
            "النتيجة أن النظام ما زال يعمل، لكن كل خطوة تصبح أثقل وكل مشروع كبير يصبح مصدر قلق.",
          ]),
          block("ما الذي تراجعه CVsolucion", [
            "نراجع سلوك الملفات، بنية المكتبات، منطق التقارير، أعراض قاعدة البيانات، إعداد المواد، وسير العمل اليومي الذي يسبب التأخير.",
            "الهدف هو بيئة أكثر استقرارا يستطيع الفريق استعمالها بثقة.",
          ]),
        ],
        [
          {
            question: "هل يجب تغيير الجهاز أولا؟",
            answer:
              "ليس قبل عزل النمط. الجهاز قد يساعد، لكن الإعداد والتقارير والمكتبات وقاعدة البيانات قد تسبب نفس الأعراض.",
          },
          {
            question: "هل يمكن أن تكون التقارير سبب البطء؟",
            answer: "نعم. منطق التقارير وشروط الإخراج يمكن أن تسبب بطء أو عدم استقرار.",
          },
        ],
      ),
    },
  ),
  "database-errors": page(
    "database-errors",
    "/cabinet-vision-database-errors",
    [
      "/cabinet-vision-troubleshooting",
      "/cabinet-vision-library-setup",
      "/cabinet-vision-slow-performance",
      "/cabinet-vision-install-backup-restore",
      "/book",
    ],
    {
      en: content(
        "Cabinet Vision Database Errors",
        "Cabinet Vision Database Errors and Catalog Problems | CVsolucion",
        "Fix Cabinet Vision database errors, catalog problems, duplicate materials, broken links, and unstable standards with a structured review.",
        "Cabinet Vision Database Errors, Catalog Problems, and Library Risk",
        "DATABASE TROUBLESHOOTING",
        "Database errors usually affect libraries, materials, reports, and production confidence.",
        "Cabinet Vision database errors can appear as missing materials, catalog conflicts, broken library links, duplicate records, report inconsistencies, or jobs that no longer behave like the team expects.",
        [
          block(
            "Symptoms that need attention",
            [
              "A database issue should be treated carefully because fast manual edits can make the situation worse.",
              "Before changing records, the shop needs a backup and a clear understanding of what is broken.",
            ],
            [
              "Materials or hardware appear missing or duplicated.",
              "Catalog references break after changes or migration.",
              "Reports do not match the expected library data.",
              "Old jobs behave differently after library cleanup.",
            ],
          ),
          block("Why database issues affect production", [
            "The database is part of the operational structure of Cabinet Vision. If material naming, standards, and catalog references are inconsistent, errors move downstream into quoting, reports, and CNC output.",
            "A database correction should protect production continuity, not just remove one message from the screen.",
          ]),
          block("Safer correction process", [
            "CVsolucion starts by identifying the failure pattern, confirming backup status, and checking whether the issue is caused by library structure, migration, permissions, standards, or a specific workflow action.",
            "Only after the cause is clear should cleanup or correction be applied.",
          ]),
        ],
        [
          {
            question: "Should I edit the database manually?",
            answer:
              "Not without a backup and a clear diagnosis. Manual edits can create new problems if relationships between records are not understood.",
          },
          {
            question: "Can database problems affect reports?",
            answer: "Yes. Reports often depend on material, catalog, and standard data from the same structure.",
          },
        ],
      ),
      fr: content(
        "Erreurs base Cabinet Vision",
        "Erreurs base de donnees Cabinet Vision | CVsolucion",
        "Corriger erreurs base de donnees Cabinet Vision, problemes de catalogues, materiaux dupliques, liens casses et standards instables.",
        "Erreurs base de donnees Cabinet Vision, catalogues et risque bibliotheque",
        "BASE DE DONNEES",
        "Les erreurs base touchent souvent bibliotheques, matieres, rapports et confiance production.",
        "Les erreurs base Cabinet Vision peuvent apparaitre comme materiaux manquants, conflits de catalogue, liens casses, doublons, rapports incoherents ou jobs qui ne reagissent plus comme prevu.",
        [
          block(
            "Signes a traiter",
            [
              "Une erreur base doit etre traitee avec prudence. Des modifications manuelles rapides peuvent aggraver la situation.",
              "Avant tout changement, il faut un backup et une comprehension claire de ce qui est casse.",
            ],
            [
              "Materiaux ou hardware manquants ou dupliques.",
              "References catalogue cassees apres migration.",
              "Rapports incoherents avec les donnees bibliotheque.",
              "Anciens jobs qui changent de comportement.",
            ],
          ),
          block("Impact sur la production", [
            "La base fait partie de la structure operationnelle. Si le nommage, les standards ou les catalogues sont incoherents, les erreurs descendent vers devis, rapports et sortie CNC.",
            "La correction doit proteger la continuite production, pas seulement masquer un message.",
          ]),
          block("Processus plus sur", [
            "CVsolucion identifie le pattern, confirme les backups et verifie si la cause vient de la structure, migration, droits, standards ou action workflow.",
            "La correction ne doit venir qu'apres diagnostic clair.",
          ]),
        ],
        [
          {
            question: "Faut-il modifier la base manuellement ?",
            answer: "Pas sans backup et diagnostic clair. Les liens entre donnees doivent etre compris.",
          },
          {
            question: "La base peut-elle affecter les rapports ?",
            answer: "Oui. Les rapports dependent souvent des matieres, catalogues et standards.",
          },
        ],
      ),
      ar: content(
        "أخطاء قاعدة بيانات Cabinet Vision",
        "أخطاء قاعدة بيانات Cabinet Vision ومشاكل الكتالوج | CVsolucion",
        "إصلاح أخطاء قاعدة بيانات Cabinet Vision ومشاكل الكتالوج والمواد المكررة والروابط المكسورة والـ standards غير المستقرة.",
        "أخطاء قاعدة بيانات Cabinet Vision ومشاكل الكتالوج وخطر المكتبات",
        "تشخيص قاعدة البيانات",
        "أخطاء قاعدة البيانات تؤثر غالبا على المكتبات والمواد والتقارير وثقة الإنتاج.",
        "قد تظهر أخطاء قاعدة بيانات Cabinet Vision على شكل مواد مفقودة، تضارب في الكتالوج، روابط مكتبة مكسورة، سجلات مكررة، تقارير غير متناسقة، أو مشاريع لم تعد تتصرف كما يتوقع الفريق.",
        [
          block(
            "أعراض يجب الانتباه لها",
            [
              "يجب التعامل مع مشكلة قاعدة البيانات بحذر، لأن التعديلات اليدوية السريعة يمكن أن تزيد الوضع سوءا.",
              "قبل أي تغيير يجب وجود نسخة احتياطية وفهم واضح للمشكل.",
            ],
            [
              "مواد أو hardware تظهر مفقودة أو مكررة.",
              "مراجع الكتالوج تنكسر بعد تغيير أو نقل.",
              "التقارير لا تطابق بيانات المكتبة المتوقعة.",
              "مشاريع قديمة يتغير سلوكها بعد التنظيف.",
            ],
          ),
          block("لماذا تؤثر على الإنتاج", [
            "قاعدة البيانات جزء من بنية العمل داخل Cabinet Vision. إذا كانت المواد أو standards أو مراجع الكتالوج غير متناسقة، تنتقل الأخطاء إلى التسعير والتقارير ومخرجات CNC.",
            "التصحيح يجب أن يحمي استمرارية الإنتاج وليس فقط إزالة رسالة خطأ من الشاشة.",
          ]),
          block("طريقة تصحيح أكثر أمانا", [
            "نبدأ بتحديد نمط الفشل، التأكد من النسخ الاحتياطي، ومعرفة هل السبب من بنية المكتبة، النقل، الصلاحيات، standards، أو خطوة معينة في سير العمل.",
            "بعد وضوح السبب فقط يتم التنظيف أو التصحيح.",
          ]),
        ],
        [
          {
            question: "هل أعدل قاعدة البيانات يدويا؟",
            answer:
              "لا بدون نسخة احتياطية وتشخيص واضح. التعديل اليدوي قد يخلق مشاكل جديدة إذا لم تكن علاقات البيانات مفهومة.",
          },
          {
            question: "هل تؤثر مشاكل قاعدة البيانات على التقارير؟",
            answer: "نعم. التقارير تعتمد غالبا على بيانات المواد والكتالوج والـ standards.",
          },
        ],
      ),
    },
  ),
  "report-errors": page(
    "report-errors",
    "/cabinet-vision-report-errors",
    [
      "/cabinet-vision-troubleshooting",
      "/cabinet-vision-custom-programming",
      "/cabinet-vision-library-setup",
      "/design-pricing",
      "/book",
    ],
    {
      en: content(
        "Cabinet Vision Report Errors",
        "Cabinet Vision Report Errors, Labels and Cutlists | CVsolucion",
        "Troubleshoot Cabinet Vision report errors, labels, cutlists, material schedules, BOM issues, and production information that no longer matches the shop floor.",
        "Cabinet Vision Report Errors, Labels, Cutlists, and BOM Problems",
        "REPORT TROUBLESHOOTING",
        "Reports are only useful when the shop floor trusts the information they deliver.",
        "Cabinet Vision report errors can create confusion between design, purchasing, production, and CNC. A report may open correctly while still sending the wrong information to the people who depend on it.",
        [
          block(
            "Report issues that create production risk",
            [
              "Labels, cutlists, material schedules, BOM output, and custom reports can all fail quietly.",
              "The report prints, but the data no longer matches the workflow.",
            ],
            [
              "Cutlists do not match how parts are produced.",
              "Labels miss important information or show the wrong logic.",
              "BOM and material reports create purchasing confusion.",
              "Custom report conditions break after library or standard changes.",
            ],
          ),
          block("What needs to be checked", [
            "Report troubleshooting checks the data source, report conditions, material logic, naming rules, construction methods, and the workflow step where the report is used.",
            "The purpose is to align the report with production reality, not just make the report render.",
          ]),
          block("Better report outcomes", [
            "A reliable report reduces questions, rework, and manual verification.",
            "It also gives managers a cleaner way to control what information reaches purchasing, assembly, CNC, and installation teams.",
          ]),
        ],
        [
          {
            question: "Can a report be wrong even if it opens?",
            answer: "Yes. The report can render while using logic that no longer matches the shop workflow.",
          },
          {
            question: "Can report issues come from the library?",
            answer: "Yes. Material names, standards, and construction methods often feed directly into reports.",
          },
        ],
      ),
      fr: content(
        "Erreurs rapports Cabinet Vision",
        "Erreurs rapports Cabinet Vision, etiquettes et cutlists | CVsolucion",
        "Diagnostiquer les erreurs de rapports Cabinet Vision, etiquettes, cutlists, BOM et informations production qui ne correspondent plus au terrain.",
        "Erreurs rapports Cabinet Vision, etiquettes, cutlists et BOM",
        "RAPPORTS",
        "Un rapport n'a de valeur que si le plancher fait confiance aux informations qu'il donne.",
        "Les erreurs de rapports Cabinet Vision creent de la confusion entre design, achats, production et CNC. Un rapport peut s'ouvrir correctement tout en envoyant une mauvaise information.",
        [
          block(
            "Risques production",
            [
              "Etiquettes, cutlists, schedules matiere, BOM et rapports custom peuvent echouer silencieusement.",
              "Le rapport s'imprime, mais les donnees ne suivent plus le workflow.",
            ],
            [
              "Cutlists qui ne correspondent pas a la production.",
              "Etiquettes incompletes ou mal logiques.",
              "BOM qui cree de la confusion aux achats.",
              "Conditions custom cassees apres changement de bibliotheque.",
            ],
          ),
          block("Ce qu'il faut verifier", [
            "Il faut verifier source de donnees, conditions, logique matiere, nommage, methodes de construction et etape workflow ou le rapport est utilise.",
            "Le but est d'aligner le rapport avec la production, pas seulement de le faire afficher.",
          ]),
          block("Meilleurs resultats", [
            "Un rapport fiable reduit les questions, le rework et les controles manuels.",
          ]),
        ],
        [
          {
            question: "Un rapport peut-il etre faux s'il s'ouvre ?",
            answer: "Oui. Il peut s'afficher avec une logique qui ne correspond plus au workflow.",
          },
          {
            question: "Les erreurs peuvent-elles venir de la bibliotheque ?",
            answer: "Oui. Noms matiere, standards et methodes alimentent souvent les rapports.",
          },
        ],
      ),
      ar: content(
        "أخطاء تقارير Cabinet Vision",
        "أخطاء تقارير Cabinet Vision والملصقات وCutlists | CVsolucion",
        "تشخيص أخطاء تقارير Cabinet Vision والملصقات وcutlists وBOM ومعلومات الإنتاج التي لم تعد تطابق واقع الورشة.",
        "أخطاء تقارير Cabinet Vision والملصقات وCutlists وBOM",
        "تشخيص التقارير",
        "التقرير لا تكون له قيمة إلا إذا وثق فريق الإنتاج في المعلومات التي يعطيها.",
        "أخطاء تقارير Cabinet Vision يمكن أن تخلق ارتباكا بين التصميم، المشتريات، الإنتاج، وCNC. قد يفتح التقرير بشكل طبيعي لكنه يعطي معلومات غير صحيحة للفريق.",
        [
          block(
            "مشاكل تقارير تخلق خطر إنتاج",
            [
              "الملصقات، cutlists، جداول المواد، BOM، والتقارير المخصصة يمكن أن تفشل بهدوء.",
              "التقرير يطبع لكن البيانات لا تطابق سير العمل.",
            ],
            [
              "Cutlists لا تطابق طريقة إنتاج القطع.",
              "الملصقات تنقصها معلومات أو تعرض منطق خاطئ.",
              "BOM وتقارير المواد تخلق ارتباكا في الشراء.",
              "شروط التقارير المخصصة تتعطل بعد تغييرات المكتبة أو standards.",
            ],
          ),
          block("ما الذي يجب فحصه", [
            "نراجع مصدر البيانات، شروط التقرير، منطق المواد، قواعد التسمية، طرق البناء، والخطوة التي يستعمل فيها التقرير داخل سير العمل.",
            "الهدف هو جعل التقرير يطابق واقع الإنتاج، وليس فقط أن يظهر على الشاشة.",
          ]),
          block("نتيجة أفضل للتقارير", [
            "التقرير الموثوق يقلل الأسئلة، إعادة العمل، والفحص اليدوي.",
          ]),
        ],
        [
          {
            question: "هل يمكن أن يكون التقرير خاطئا رغم أنه يفتح؟",
            answer: "نعم. قد يظهر التقرير لكنه يستعمل منطقا لم يعد يطابق سير العمل.",
          },
          {
            question: "هل تأتي مشاكل التقارير من المكتبة؟",
            answer: "نعم. أسماء المواد، standards، وطرق البناء تؤثر مباشرة على التقارير.",
          },
        ],
      ),
    },
  ),
  "cnc-output-problems": page(
    "cnc-output-problems",
    "/cabinet-vision-cnc-output-problems",
    [
      "/cabinet-vision-cnc-integration",
      "/cabinet-vision-s2m-troubleshooting",
      "/cabinet-vision-troubleshooting",
      "/cabinet-vision-report-errors",
      "/book",
    ],
    {
      en: content(
        "Cabinet Vision CNC Output Problems",
        "Cabinet Vision CNC Output Problems and Operator Trust | CVsolucion",
        "Fix Cabinet Vision CNC output problems by reviewing design logic, machining rules, reports, post behavior, validation, and operator trust.",
        "Cabinet Vision CNC Output Problems and Operator Trust",
        "CNC OUTPUT GUIDE",
        "The CNC file is the last step of a much larger Cabinet Vision workflow.",
        "When CNC output is not trusted, production slows down even if files are technically generating. Operators start checking, designers start guessing, and managers lose visibility into the real cause.",
        [
          block(
            "Where CNC output problems begin",
            [
              "CNC output problems can start in construction methods, material setup, report logic, machining assumptions, UCS behavior, or post configuration.",
              "The machine is often where the issue becomes visible, not where it starts.",
            ],
            [
              "Operators re-check every released file.",
              "Manual corrections are made before production.",
              "Output differs between similar jobs.",
              "The team cannot explain why a file changed.",
            ],
          ),
          block("Operator trust is a technical requirement", [
            "If operators do not trust the output, the system is not fully implemented.",
            "Trust comes from repeated validated output, clear accountability, and a safe process for stopping questionable files.",
          ]),
          block("What a proper review includes", [
            "CVsolucion reviews the design-to-production handoff, the S2M or CNC workflow, the reports used for validation, the post expectations, and the exact point where the team starts losing confidence.",
            "The goal is to reduce manual checks and build a more reliable output chain.",
          ]),
        ],
        [
          {
            question: "Is a CNC output problem always a machine issue?",
            answer:
              "No. Many CNC output issues originate in Cabinet Vision setup, materials, reports, or validation workflow.",
          },
          {
            question: "Can this be reviewed remotely?",
            answer:
              "Yes. Real files, screen sharing, and structured validation can reveal the issue before a live production change.",
          },
        ],
      ),
      fr: content(
        "Problemes sortie CNC Cabinet Vision",
        "Problemes de sortie CNC Cabinet Vision | CVsolucion",
        "Corriger les problemes de sortie CNC Cabinet Vision en revisant logique design, usinage, rapports, post, validation et confiance operateur.",
        "Problemes de sortie CNC Cabinet Vision et confiance operateur",
        "SORTIE CNC",
        "Le fichier CNC est la derniere etape d'un workflow Cabinet Vision beaucoup plus large.",
        "Quand la sortie CNC n'est pas fiable, la production ralentit meme si les fichiers sont generes. Les operateurs verifient, les designers devinent, et la direction perd la cause reelle.",
        [
          block(
            "Ou commencent les problemes CNC",
            [
              "Ils peuvent venir des methodes de construction, matieres, rapports, hypotheses d'usinage, UCS ou configuration du post.",
              "La machine montre souvent le probleme, mais ne le cree pas toujours.",
            ],
            [
              "Les operateurs reverifient chaque fichier.",
              "Des corrections manuelles sont faites avant production.",
              "La sortie differe entre jobs similaires.",
              "L'equipe ne sait pas pourquoi un fichier a change.",
            ],
          ),
          block("La confiance operateur est technique", [
            "Si l'operateur ne fait pas confiance a la sortie, l'implementation n'est pas terminee.",
            "La confiance vient de sorties validees, responsabilites claires et processus de blocage.",
          ]),
          block("Ce que couvre la revue", [
            "CVsolucion revise le handoff design-production, S2M ou CNC, rapports de validation, attentes du post et moment exact ou la confiance se perd.",
            "Le but est de reduire les controles manuels et fiabiliser la chaine de sortie.",
          ]),
        ],
        [
          {
            question: "Un probleme CNC vient-il toujours de la machine ?",
            answer: "Non. Beaucoup viennent du setup Cabinet Vision, matieres, rapports ou validation.",
          },
          {
            question: "La revue peut-elle se faire a distance ?",
            answer:
              "Oui. Fichiers reels, partage d'ecran et validation structuree permettent d'isoler le probleme.",
          },
        ],
      ),
      ar: content(
        "مشاكل مخرجات CNC في Cabinet Vision",
        "مشاكل مخرجات CNC في Cabinet Vision وثقة المشغل | CVsolucion",
        "إصلاح مشاكل مخرجات CNC في Cabinet Vision عبر مراجعة منطق التصميم، التشغيل، التقارير، post، التحقق، وثقة المشغل.",
        "مشاكل مخرجات CNC في Cabinet Vision وثقة المشغل",
        "دليل مخرجات CNC",
        "ملف CNC هو آخر خطوة في سلسلة أكبر داخل Cabinet Vision.",
        "عندما لا يثق الفريق في مخرجات CNC، يتباطأ الإنتاج حتى لو كانت الملفات تتولد. يبدأ المشغل في الفحص، المصمم في التخمين، والإدارة تفقد رؤية السبب الحقيقي.",
        [
          block(
            "أين تبدأ مشاكل CNC",
            [
              "قد تبدأ من طرق البناء، إعداد المواد، منطق التقارير، قواعد التشغيل، UCS، أو إعداد الـ post.",
              "الماكينة غالبا هي المكان الذي تظهر فيه المشكلة وليس دائما مصدرها.",
            ],
            [
              "المشغل يفحص كل ملف قبل تشغيله.",
              "يتم عمل تصحيحات يدوية قبل الإنتاج.",
              "المخرجات تختلف بين مشاريع متشابهة.",
              "الفريق لا يعرف لماذا تغير الملف.",
            ],
          ),
          block("ثقة المشغل مطلب تقني", [
            "إذا لم يثق المشغل في المخرجات فالنظام لم يكتمل بعد.",
            "الثقة تأتي من مخرجات تم التحقق منها أكثر من مرة، مسؤوليات واضحة، ومسار آمن لإيقاف الملفات المشكوك فيها.",
          ]),
          block("ما الذي تشمله المراجعة", [
            "نراجع تسليم الملف من التصميم إلى الإنتاج، مسار S2M أو CNC، التقارير المستعملة للتحقق، توقعات الـ post، والنقطة التي يبدأ فيها الفريق بفقدان الثقة.",
            "الهدف هو تقليل الفحص اليدوي وبناء سلسلة مخرجات أكثر ثباتا.",
          ]),
        ],
        [
          {
            question: "هل مشكلة CNC دائما من الماكينة؟",
            answer:
              "لا. كثير من مشاكل CNC تبدأ في إعداد Cabinet Vision أو المواد أو التقارير أو طريقة التحقق.",
          },
          {
            question: "هل يمكن مراجعة ذلك عن بعد؟",
            answer:
              "نعم. الملفات الحقيقية ومشاركة الشاشة والتحقق المنظم تكشف المشكلة قبل تغيير الإنتاج المباشر.",
          },
        ],
      ),
    },
  ),
};

export const SEO_KNOWLEDGE_PAGES = seoKnowledgePages as Record<SeoKnowledgePageKey, SeoKnowledgePage>;

export function getSeoKnowledgePageByCanonicalPath(path: string) {
  return Object.values(SEO_KNOWLEDGE_PAGES).find((item) => item.canonicalPath === path) ?? null;
}

export function getSeoKnowledgePageContent(
  item: SeoKnowledgePage,
  locale: SeoKnowledgeLocale,
): SeoKnowledgePageContent {
  return item.content[locale] ?? item.content.en;
}
