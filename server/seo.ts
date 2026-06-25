import { getArticleBySlug, listPublishedArticles, type ArticleLocale } from "./articleStore";
import {
  SEO_SERVICE_PAGE_ORDER,
  SEO_SERVICE_PAGES,
  getSeoServicePageByCanonicalPath,
  type SeoServicePage,
} from "../shared/seoServicePages";
import { getSeoServicePageContent } from "../shared/seoServicePageLocales";
import { getSeoServicePageImageSet } from "../shared/seoServicePageImages";
import { TRAINING_SEO_CONTENT } from "../shared/trainingSeoContent";
import {
  SEO_KNOWLEDGE_PAGE_ORDER,
  SEO_KNOWLEDGE_PAGES,
  getSeoKnowledgePageByCanonicalPath,
  getSeoKnowledgePageContent,
  type SeoKnowledgePage,
} from "../shared/seoKnowledgePages";

type SeoDocument = {
  lang: string;
  dir?: "ltr" | "rtl";
  title: string;
  description: string;
  canonicalPath: string;
  ogType: "website" | "article";
  robots: string;
  image: string;
  fallbackHtml: string;
  structuredData: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

const DEFAULT_IMAGE = "https://cvsolucion.com/og-image.jpg";
const SITE_NAME = "CVsolucion";

const TRAINING_CAREER_COPY = {
  en: {
    seoTitle: "From Shop Floor to Design Office | Cabinet Vision Career Training | CVsolucion",
    metaDescription:
      "Request a free Cabinet Vision career evaluation for cabinet shop workers, CNC operators, assemblers, installers, and woodworkers moving toward design.",
    h1: "Same shop floor. Different paycheck.",
    intro:
      "You already work in the industry. This training takes you from the shop floor to the design office on the exact software cabinet shops across Canada and the US run on.",
    points: [
      "Shop floor to design office.",
      "No license or computer required.",
      "Live expert, not pre-recorded videos.",
      "Schedule set around your work hours.",
    ],
  },
  fr: {
    seoTitle: "De l'atelier au bureau de design | Formation carriere Cabinet Vision | CVsolucion",
    metaDescription:
      "Demandez une evaluation de carriere Cabinet Vision gratuite pour passer de l'atelier, du CNC ou de l'installation vers le bureau de design.",
    h1: "Meme atelier. Meilleur role.",
    intro:
      "Vous travaillez deja dans l'industrie. Cette formation vous aide a passer de l'atelier au bureau de design avec le logiciel utilise par les ateliers de cabinets au Canada et aux Etats-Unis.",
    points: [
      "De l'atelier au bureau de design.",
      "Aucune licence ni ordinateur requis.",
      "Expert en direct, pas des videos preenregistrees.",
      "Horaire adapte a vos heures de travail.",
    ],
  },
  ar: {
    seoTitle: "من الورشة إلى مكتب التصميم | تدريب مهني Cabinet Vision | CVsolucion",
    metaDescription:
      "اطلب تقييما مهنيا مجانيا لتعرف هل تدريب Cabinet Vision مناسب لانتقالك من الورشة أو CNC أو التركيب إلى التصميم.",
    h1: "نفس الورشة. دور أفضل.",
    intro:
      "أنت تعمل بالفعل في المجال. هذا التدريب يساعدك على الانتقال من أرضية الورشة إلى مكتب التصميم باستعمال نفس البرنامج الذي تعتمد عليه ورش الخزائن والمطابخ في كندا والولايات المتحدة.",
    points: [
      "من الورشة إلى مكتب التصميم.",
      "لا تحتاج رخصة أو كمبيوتر خاص.",
      "مدرب مباشر وليس فيديوهات مسجلة.",
      "جدولة حسب ساعات عملك.",
    ],
  },
} as const;

const HOME_COPY = {
  en: {
    title: "Cabinet Vision Consulting, Training & Support | CVsolucion",
    description:
      "Cabinet Vision consulting, training, support, and optimization for cabinet shops: fix errors, speed up workflows, standardize libraries, and stabilize CNC output.",
    h1: "Cabinet Vision\nSetup, Support & Training",
    p1: "Expert Cabinet Vision consulting, training, and support to fix errors, optimize performance, and standardize libraries and CNC output.",
    p2: "Shops contact us when Cabinet Vision becomes slow, unstable, inconsistent, or difficult to scale. We work on troubleshooting, library setup, pricing logic, report alignment, UCS automation, CNC troubleshooting, and operator-ready output. This gives teams cleaner data, fewer production surprises, and faster day-to-day execution.",
    h2a: "Core services",
    p3: "Our public service pages cover remote support, training, design and pricing setup, workflow audits, and structured booking for consulting or urgent intervention. Articles and case studies are also published to help teams understand what causes failures and how to avoid them.",
    h2b: "Useful internal pages",
    h2c: "Why cabinet shops use CVsolucion",
    p4: "A successful Cabinet Vision setup needs more than software access. It requires validation, stable rules, a clean material structure, predictable reports, and production output that operators trust. CVsolucion focuses on that implementation layer so teams can move from trial-and-error to repeatable manufacturing.",
  },
  fr: {
    title: "Consulting, formation et support Cabinet Vision | CVsolucion",
    description:
      "Consulting, formation, support et optimisation Cabinet Vision pour ateliers d'ebnisterie : corriger les erreurs, accelerer les flux, standardiser les bibliotheques et stabiliser la sortie CNC.",
    h1: "Cabinet Vision\nConfiguration, support et formation",
    p1: "Conseil, formation et support Cabinet Vision pour corriger les erreurs, optimiser les performances et standardiser les sorties CNC.",
    p2: "Les ateliers nous contactent lorsque Cabinet Vision devient lent, instable, incoherent ou difficile a faire evoluer. Nous intervenons sur le troubleshooting, les bibliotheques, la logique de pricing, les rapports, l'automatisation UCS, la sortie CNC et la validation operateur. Le resultat: moins d'erreurs, des donnees plus propres et une execution plus rapide.",
    h2a: "Services principaux",
    p3: "Nos pages publiques couvrent le support a distance, la formation, la mise en place design & pricing, les audits de workflow et le booking structure pour les consultations ou urgences. Des articles et etudes de cas sont egalement publies pour montrer pourquoi certaines mises en place echouent et comment les corriger.",
    h2b: "Pages internes utiles",
    h2c: "Pourquoi les ateliers utilisent CVsolucion",
    p4: "Une bonne mise en place Cabinet Vision demande plus qu'un acces logiciel. Il faut des regles stables, une structure matiere propre, des rapports coherents et une sortie de production que les operateurs peuvent faire confiance. CVsolucion travaille exactement sur cette couche d'implementation.",
  },
  ar: {
    title: "استشارات وتدريب ودعم Cabinet Vision | CVsolucion",
    description:
      "استشارات وتدريب ودعم وتحسين Cabinet Vision لمصانع المطابخ والخزائن: إصلاح الأخطاء، تسريع العمل، توحيد المكتبات، وتثبيت مخرجات CNC.",
    h1: "Cabinet Vision\nإعداد، دعم وتدريب",
    p1: "استشارات وتدريب ودعم Cabinet Vision لإصلاح الأخطاء وتحسين الأداء وتوحيد مخرجات CNC.",
    p2: "تتواصل معنا الورشات عندما يصبح Cabinet Vision بطيئاً أو غير مستقر أو صعب التوسع. نعمل على التشخيص، المكتبات، منطق التسعير، التقارير، أتمتة UCS، إخراج CNC، وتجهيز المخرجات للمشغلين. النتيجة هي بيانات أنظف وأخطاء أقل وسير عمل أسرع.",
    h2a: "الخدمات الأساسية",
    p3: "تشمل الصفحات العامة لدينا الدعم عن بعد، التدريب، إعداد التصميم والتسعير، تدقيق سير العمل، ونظام حجز منظم للاستشارات أو الحالات المستعجلة. كما ننشر مقالات ودراسات حالة تساعد الفرق على فهم أسباب التعثر وكيفية تجنبها.",
    h2b: "صفحات داخلية مفيدة",
    h2c: "لماذا تعتمد الورشات على CVsolucion",
    p4: "نجاح Cabinet Vision لا يتحقق بمجرد تثبيت البرنامج. بل يحتاج إلى قواعد مستقرة، مكتبات نظيفة، تقارير متناسقة، ومخرجات إنتاج يثق بها المشغل. وهنا تركز CVsolucion على طبقة التنفيذ العملي نفسها.",
  },
} as const;

function detectLocale(pathname: string): ArticleLocale {
  if (pathname === "/fr" || pathname.startsWith("/fr/")) return "fr";
  if (pathname === "/ar" || pathname.startsWith("/ar/")) return "ar";
  return "en";
}

function stripLocale(pathname: string) {
  if (pathname === "/fr" || pathname === "/ar") return "/";
  if (pathname.startsWith("/fr/")) return pathname.replace(/^\/fr/, "") || "/";
  if (pathname.startsWith("/ar/")) return pathname.replace(/^\/ar/, "") || "/";
  return pathname || "/";
}

function localizePath(pathname: string, locale: ArticleLocale) {
  const clean = pathname === "" ? "/" : stripLocale(pathname);
  if (locale === "fr") return clean === "/" ? "/fr" : `/fr${clean}`;
  if (locale === "ar") return clean === "/" ? "/ar" : `/ar${clean}`;
  return clean;
}

function absoluteAssetUrl(origin: string, path: string) {
  return `${origin}${path}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function summarizeText(value: string, maxLength = 180) {
  const text = stripHtml(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function articleParagraphs(value: string, maxParagraphs = 5) {
  const text = stripHtml(value);
  const chunks = text
    .split(/(?<=[.!?])\s+/)
    .reduce<string[]>((acc, sentence) => {
      const current = acc[acc.length - 1] || "";
      if (!current || current.length > 260) {
        acc.push(sentence);
      } else {
        acc[acc.length - 1] = `${current} ${sentence}`;
      }
      return acc;
    }, [])
    .slice(0, maxParagraphs);

  return chunks.length ? chunks : [text];
}

function routeTitle(locale: ArticleLocale, path: string) {
  if (path === "/training/career") return TRAINING_CAREER_COPY[locale].seoTitle;
  if (path === "/training") return TRAINING_SEO_CONTENT[locale].seoTitle;

  const map = {
    en: {
      "/training": "Cabinet Vision Training | CVsolucion",
      "/design-pricing": "Cabinet Vision Design & Pricing Setup | CVsolucion",
      "/articles": "Cabinet Vision Articles, Guides & Case Studies | CVsolucion",
      "/guides": "Cabinet Vision Troubleshooting Guides | CVsolucion",
      "/about": "About CVsolucion | Cabinet Vision Consulting",
      "/book": "Book Cabinet Vision Consultation or Support | CVsolucion",
      "/privacy": "Privacy Policy | CVsolucion",
      "/terms": "Terms of Service | CVsolucion",
      "/login": "Sign In | CVsolucion",
      "/dashboard": "Dashboard | CVsolucion",
    },
    fr: {
      "/training": "Formation Cabinet Vision | CVsolucion",
      "/design-pricing": "Configuration design et pricing Cabinet Vision | CVsolucion",
      "/articles": "Articles, guides et cas Cabinet Vision | CVsolucion",
      "/guides": "Guides de diagnostic Cabinet Vision | CVsolucion",
      "/about": "A propos de CVsolucion | Cabinet Vision",
      "/book": "Reservation consultation ou support | CVsolucion",
      "/privacy": "Politique de confidentialite | CVsolucion",
      "/terms": "Conditions d'utilisation | CVsolucion",
      "/login": "Connexion | CVsolucion",
      "/dashboard": "Dashboard | CVsolucion",
    },
    ar: {
      "/training": "تدريب Cabinet Vision | CVsolucion",
      "/design-pricing": "إعداد التصميم والتسعير في Cabinet Vision | CVsolucion",
      "/articles": "مقالات وأدلة Cabinet Vision | CVsolucion",
      "/guides": "أدلة تشخيص Cabinet Vision | CVsolucion",
      "/about": "من نحن | CVsolucion",
      "/book": "حجز استشارة أو دعم | CVsolucion",
      "/privacy": "سياسة الخصوصية | CVsolucion",
      "/terms": "شروط الاستخدام | CVsolucion",
      "/login": "تسجيل الدخول | CVsolucion",
      "/dashboard": "لوحة التحكم | CVsolucion",
    },
  } as const;

  return map[locale][path as keyof (typeof map)[typeof locale]] || HOME_COPY[locale].title;
}

function routeDescription(locale: ArticleLocale, path: string) {
  if (path === "/training/career") return TRAINING_CAREER_COPY[locale].metaDescription;
  if (path === "/training") return TRAINING_SEO_CONTENT[locale].metaDescription;

  const map = {
    en: {
      "/training": "Remote Cabinet Vision training for designers, engineers, and production teams with practical sessions and implementation guidance.",
      "/design-pricing": "Structured Cabinet Vision design and pricing setup for factories that need clean quoting logic and production-ready outputs.",
      "/articles": "Cabinet Vision articles, implementation lessons, troubleshooting guides, and production case studies from real shop-floor work.",
      "/guides": "Cabinet Vision troubleshooting guides for S2M output, slow performance, database errors, report errors, and CNC output problems.",
      "/about":
        "CVsolucion is a Cabinet Vision consulting, training, and support service. CVsolucion specializes in Cabinet Vision libraries, UCS automation, CNC integration, S2M troubleshooting, reports, and workflow optimization.",
      "/book": "Book a Cabinet Vision consultation or support slot in Quebec time, with standard and express availability options.",
      "/privacy": "Read the CVsolucion privacy policy.",
      "/terms": "Read the CVsolucion terms of service.",
      "/login": "Sign in to access protected pricing and dashboard areas.",
      "/dashboard": "Admin dashboard.",
    },
    fr: {
      "/training": "Formation Cabinet Vision a distance pour designers, ingenieurs et equipes de production avec mise en pratique.",
      "/design-pricing": "Configuration design et pricing Cabinet Vision pour ateliers qui ont besoin d'une logique de devis claire et d'une sortie production fiable.",
      "/articles": "Articles Cabinet Vision, guides de troubleshooting et retours terrain issus de cas reels.",
      "/guides": "Guides Cabinet Vision pour diagnostiquer S2M, lenteurs, erreurs de base de donnees, rapports et sortie CNC.",
      "/about": "Decouvrez comment CVsolucion aide les ateliers a ameliorer workflows, bibliotheques, rapports et sortie CNC.",
      "/book": "Reservez une consultation ou un support Cabinet Vision en heure du Quebec, avec options standard et express.",
      "/privacy": "Consultez la politique de confidentialite de CVsolucion.",
      "/terms": "Consultez les conditions d'utilisation de CVsolucion.",
      "/login": "Connectez-vous pour acceder aux zones protegees.",
      "/dashboard": "Dashboard administrateur.",
    },
    ar: {
      "/training": "تدريب Cabinet Vision عن بعد للمصممين والمهندسين وفرق الإنتاج مع تطبيق عملي فعلي.",
      "/design-pricing": "إعداد التصميم والتسعير في Cabinet Vision للمصانع التي تحتاج إلى منطق عروض أسعار واضح ومخرجات إنتاج مستقرة.",
      "/articles": "مقالات Cabinet Vision وأدلة التشخيص ودروس التنفيذ المستخلصة من حالات واقعية.",
      "/guides": "أدلة تشخيص Cabinet Vision لمشاكل S2M، بطء الأداء، أخطاء قاعدة البيانات، أخطاء التقارير، ومخرجات CNC.",
      "/about": "تعرّف على كيفية مساعدة CVsolucion للورشات في تحسين سير العمل والمكتبات والتقارير ومخرجات CNC.",
      "/book": "احجز استشارة أو دعماً في Cabinet Vision حسب توقيت كيبيك مع خيارات عادية وسريعة.",
      "/privacy": "اقرأ سياسة الخصوصية الخاصة بـ CVsolucion.",
      "/terms": "اقرأ شروط استخدام CVsolucion.",
      "/login": "سجّل الدخول للوصول إلى المناطق المحمية.",
      "/dashboard": "لوحة تحكم الإدارة.",
    },
  } as const;

  return map[locale][path as keyof (typeof map)[typeof locale]] || HOME_COPY[locale].description;
}

function linkLabel(locale: ArticleLocale, path: string) {
  const map = {
    en: {
      "/training": "Training",
      "/design-pricing": "Design & Pricing",
      "/articles": "Articles",
      "/guides": "Guides",
      "/about": "About",
      "/book": "Book a session",
      "/privacy": "Privacy Policy",
      "/terms": "Terms of Service",
    },
    fr: {
      "/training": "Formation",
      "/design-pricing": "Design & Pricing",
      "/articles": "Articles",
      "/guides": "Guides",
      "/about": "A propos",
      "/book": "Reserver",
      "/privacy": "Confidentialite",
      "/terms": "Conditions",
    },
    ar: {
      "/training": "التدريب",
      "/design-pricing": "التصميم والتسعير",
      "/articles": "المقالات",
      "/guides": "الأدلة",
      "/about": "من نحن",
      "/book": "احجز الآن",
      "/privacy": "الخصوصية",
      "/terms": "الشروط",
    },
  } as const;

  return map[locale][path as keyof (typeof map)[typeof locale]];
}

function homeImplementationHeading(locale: ArticleLocale) {
  const map = {
    en: "Implementation details search engines should understand",
    fr: "Points d'implementation importants a comprendre",
    ar: "تفاصيل تنفيذ مهمة يجب أن تظهر لمحركات البحث",
  } as const;

  return map[locale];
}

function servicePagesHeading(locale: ArticleLocale) {
  const map = {
    en: "Cabinet Vision service pages",
    fr: "Pages de service Cabinet Vision",
    ar: "صفحات خدمات Cabinet Vision",
  } as const;

  return map[locale];
}

function knowledgePagesHeading(locale: ArticleLocale) {
  const map = {
    en: "Cabinet Vision troubleshooting guides",
    fr: "Guides de diagnostic Cabinet Vision",
    ar: "أدلة تشخيص Cabinet Vision",
  } as const;

  return map[locale];
}

function faqHeading(locale: ArticleLocale) {
  const map = {
    en: "Frequently asked questions",
    fr: "Questions frequentes",
    ar: "الاسئلة الشائعة",
  } as const;

  return map[locale];
}

function relatedPagesHeading(locale: ArticleLocale) {
  const map = {
    en: "Related pages",
    fr: "Pages liees",
    ar: "صفحات مرتبطة",
  } as const;

  return map[locale];
}

function homeImplementationParagraph(locale: ArticleLocale) {
  const map = {
    en: "Many cabinet shops search for help only after quoting logic breaks, reports stop matching production, or CNC output becomes unreliable. CVsolucion works on the operational layer between design, engineering, pricing, reports, and machine-ready output. That is why the service is relevant for shops evaluating implementation support, emergency troubleshooting, structured training, or a cleaner long-term Cabinet Vision setup.",
    fr: "Beaucoup d'ateliers cherchent de l'aide seulement quand la logique de devis se casse, que les rapports ne correspondent plus a la production, ou que la sortie CNC devient instable. CVsolucion travaille sur la couche operationnelle entre design, engineering, pricing, rapports et sortie machine. C'est pour cela que le service est pertinent pour les ateliers qui cherchent un support d'implementation, un troubleshooting urgent, une formation structuree, ou une mise en place Cabinet Vision plus fiable.",
    ar: "تبحث كثير من الورشات عن المساعدة فقط عندما يتعطل منطق التسعير أو تصبح التقارير غير مطابقة للإنتاج أو تصبح مخرجات CNC غير مستقرة. تعمل CVsolucion على الطبقة التشغيلية بين التصميم والهندسة والتسعير والتقارير والمخرجات الجاهزة للماكينة. لذلك فهذه الخدمة مناسبة للورشات التي تحتاج دعماً في التنفيذ أو تشخيصاً عاجلاً أو تدريباً منظماً أو إعداداً أكثر استقراراً على المدى الطويل.",
  } as const;

  return map[locale];
}

function homeHighlights(locale: ArticleLocale) {
  const map = {
    en: [
      {
        title: "Cabinet Vision troubleshooting",
        body: "Diagnose slow performance, crashes, broken reports, unstable libraries, and output errors before they become production downtime.",
      },
      {
        title: "Library and pricing structure",
        body: "Clean up materials, naming, rules, and quoting logic so the commercial side and production side stay aligned.",
      },
      {
        title: "CNC-ready output",
        body: "Verify post behavior, cutlist logic, report consistency, and operator trust so the shop floor can run files with fewer manual checks.",
      },
      {
        title: "Training and controlled rollout",
        body: "Train designers, engineers, and production teams with practical sessions tied to the actual workflow instead of generic demos.",
      },
    ],
    fr: [
      {
        title: "Troubleshooting Cabinet Vision",
        body: "Diagnostiquer lenteurs, plantages, rapports casses, bibliotheques instables et erreurs de sortie avant qu'ils ne bloquent la production.",
      },
      {
        title: "Structure bibliotheque et pricing",
        body: "Nettoyer matieres, noms, regles et logique de devis pour garder alignees la partie commerciale et la partie production.",
      },
      {
        title: "Sortie prete pour le CNC",
        body: "Verifier le comportement du post, la logique des cutlists, la coherence des rapports et la confiance operateur sur le terrain.",
      },
      {
        title: "Formation et deploiement controle",
        body: "Former designers, ingenieurs et production avec des sessions pratiques basees sur le workflow reel, pas sur des demos generiques.",
      },
    ],
    ar: [
      {
        title: "تشخيص مشاكل Cabinet Vision",
        body: "تشخيص البطء والأعطال والتقارير المعطلة والمكتبات غير المستقرة وأخطاء الإخراج قبل أن تتحول إلى توقف فعلي في الإنتاج.",
      },
      {
        title: "هيكلة المكتبات والتسعير",
        body: "تنظيف المواد والأسماء والقواعد ومنطق عروض الأسعار حتى يبقى الجانب التجاري متوافقاً مع جانب الإنتاج.",
      },
      {
        title: "مخرجات جاهزة للـ CNC",
        body: "التحقق من سلوك الـ post ومنطق القوائم والتقارير وثقة المشغل حتى يعمل المصنع بعدد أقل من الفحوص اليدوية.",
      },
      {
        title: "تدريب وتطبيق مضبوط",
        body: "تدريب المصممين والمهندسين وفرق الإنتاج بجلسات عملية مرتبطة بسير العمل الحقيقي لا بعروض عامة فقط.",
      },
    ],
  } as const;

  return map[locale];
}

function homeFallback(locale: ArticleLocale) {
  const copy = HOME_COPY[locale];
  const links = ["/training", "/design-pricing", "/articles", "/guides", "/about", "/book", "/privacy", "/terms"]
    .map((path) => `<a href="${escapeHtml(localizePath(path, locale))}">${escapeHtml(linkLabel(locale, path) || path)}</a>`)
    .join("");
  const serviceLinks = SEO_SERVICE_PAGE_ORDER
    .map((key) => SEO_SERVICE_PAGES[key])
    .map(
      (page) => {
        const content = getSeoServicePageContent(page, locale);
        return `<li><a href="${escapeHtml(localizePath(page.canonicalPath, locale))}">${escapeHtml(content.shortTitle)}</a><p>${escapeHtml(content.metaDescription)}</p></li>`;
      }
    )
    .join("");
  const knowledgeLinks = SEO_KNOWLEDGE_PAGE_ORDER
    .map((key) => SEO_KNOWLEDGE_PAGES[key])
    .map((page) => {
      const content = getSeoKnowledgePageContent(page, locale);
      return `<li><a href="${escapeHtml(localizePath(page.canonicalPath, locale))}">${escapeHtml(content.shortTitle)}</a><p>${escapeHtml(content.metaDescription)}</p></li>`;
    })
    .join("");
  const highlights = homeHighlights(locale)
    .map(
      (item) => `
        <li>
          <strong>${escapeHtml(item.title)}:</strong>
          ${escapeHtml(item.body)}
        </li>
      `
    )
    .join("");

  return `
    <main id="seo-fallback">
      <section>
        <h1>${escapeHtml(copy.h1)}</h1>
        <p>${escapeHtml(copy.p1)}</p>
        <p>${escapeHtml(copy.p2)}</p>
        <h2>${escapeHtml(copy.h2a)}</h2>
        <p>${escapeHtml(copy.p3)}</p>
        <div class="seo-links">${links}</div>
        <h2>${escapeHtml(copy.h2c)}</h2>
        <p>${escapeHtml(copy.p4)}</p>
        <h2>${escapeHtml(servicePagesHeading(locale))}</h2>
        <ul>${serviceLinks}</ul>
        <h2>${escapeHtml(knowledgePagesHeading(locale))}</h2>
        <ul>${knowledgeLinks}</ul>
        <h2>${escapeHtml(copy.h2b)}</h2>
        <ul>
          <li><a href="${escapeHtml(localizePath("/training", locale))}">${escapeHtml(linkLabel(locale, "/training") || "")}</a></li>
          <li><a href="${escapeHtml(localizePath("/design-pricing", locale))}">${escapeHtml(linkLabel(locale, "/design-pricing") || "")}</a></li>
          <li><a href="${escapeHtml(localizePath("/articles", locale))}">${escapeHtml(linkLabel(locale, "/articles") || "")}</a></li>
          <li><a href="${escapeHtml(localizePath("/guides", locale))}">${escapeHtml(linkLabel(locale, "/guides") || "")}</a></li>
          <li><a href="${escapeHtml(localizePath("/about", locale))}">${escapeHtml(linkLabel(locale, "/about") || "")}</a></li>
          <li><a href="${escapeHtml(localizePath("/book", locale))}">${escapeHtml(linkLabel(locale, "/book") || "")}</a></li>
          <li><a href="${escapeHtml(localizePath("/privacy", locale))}">${escapeHtml(linkLabel(locale, "/privacy") || "")}</a></li>
          <li><a href="${escapeHtml(localizePath("/terms", locale))}">${escapeHtml(linkLabel(locale, "/terms") || "")}</a></li>
        </ul>
        <h2>${escapeHtml(homeImplementationHeading(locale))}</h2>
        <p>${escapeHtml(homeImplementationParagraph(locale))}</p>
        <ul>${highlights}</ul>
      </section>
    </main>
  `;
}

function blockFallbackHtml(block: SeoServicePage["blocks"][number]) {
  if (block.type === "cards") {
    const intro = block.intro ? `<p>${escapeHtml(block.intro)}</p>` : "";
    const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    return `<section><h2>${escapeHtml(block.title)}</h2>${intro}<ul>${items}</ul></section>`;
  }

  if (block.type === "steps") {
    const items = block.items
      .map((item) => `<li><strong>${escapeHtml(item.label)}.</strong> ${escapeHtml(item.text)}</li>`)
      .join("");
    return `<section><h2>${escapeHtml(block.title)}</h2><ol>${items}</ol></section>`;
  }

  if (block.type === "facts") {
    const items = block.items
      .map((item) => `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.text)}</li>`)
      .join("");
    return `<section><h2>${escapeHtml(block.title)}</h2><ul>${items}</ul></section>`;
  }

  const paragraphs = block.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  return `<section><h2>${escapeHtml(block.title)}</h2>${paragraphs}</section>`;
}

function routeLabelForLocale(locale: ArticleLocale, path: string) {
  const knowledgePage = getSeoKnowledgePageByCanonicalPath(path);
  if (knowledgePage) return getSeoKnowledgePageContent(knowledgePage, locale).shortTitle;
  const servicePage = getSeoServicePageByCanonicalPath(path);
  if (servicePage) return getSeoServicePageContent(servicePage, locale).shortTitle;
  return linkLabel(locale, path) || routeTitle(locale, path).replace(" | CVsolucion", "");
}

function routeDescriptionForLocale(locale: ArticleLocale, path: string) {
  const knowledgePage = getSeoKnowledgePageByCanonicalPath(path);
  if (knowledgePage) return getSeoKnowledgePageContent(knowledgePage, locale).metaDescription;
  const servicePage = getSeoServicePageByCanonicalPath(path);
  if (servicePage) return getSeoServicePageContent(servicePage, locale).metaDescription;
  return routeDescription(locale, path);
}

function trainingFallback(locale: ArticleLocale) {
  const copy = TRAINING_SEO_CONTENT[locale];
  const outcomes = copy.outcomes
    .map((item) => `<li><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.body)}</li>`)
    .join("");
  const modules = copy.modules
    .map(
      (module) => `
        <section>
          <h3>${escapeHtml(module.title)}</h3>
          <ul>${module.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
      `,
    )
    .join("");
  const process = copy.process
    .map((step) => `<li><strong>${escapeHtml(step.label)}.</strong> ${escapeHtml(step.text)}</li>`)
    .join("");
  const faq = copy.faq
    .map((item) => `<li><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(item.answer)}</p></li>`)
    .join("");
  const related = copy.related
    .map(
      (item) => `
        <li>
          <a href="${escapeHtml(localizePath(item.href, locale))}">${escapeHtml(item.title)}</a>
          <p>${escapeHtml(item.description)}</p>
        </li>
      `,
    )
    .join("");

  return `
    <main id="seo-fallback">
      <article>
        <section>
          <h1>${escapeHtml(copy.h1)}</h1>
          <p>${escapeHtml(copy.intro)}</p>
          <nav class="seo-links">
            <a href="${escapeHtml(localizePath("/book", locale))}">${escapeHtml(linkLabel(locale, "/book") || "Book")}</a>
            <a href="${escapeHtml(localizePath("/cabinet-vision-support", locale))}">${escapeHtml(routeLabelForLocale(locale, "/cabinet-vision-support"))}</a>
            <a href="${escapeHtml(localizePath("/cabinet-vision-cnc-integration", locale))}">${escapeHtml(routeLabelForLocale(locale, "/cabinet-vision-cnc-integration"))}</a>
          </nav>
        </section>
        <section>
          <h2>${escapeHtml(copy.outcomesTitle)}</h2>
          <ul>${outcomes}</ul>
        </section>
        <section>
          <h2>${escapeHtml(copy.modulesTitle)}</h2>
          ${modules}
        </section>
        <section>
          <h2>${escapeHtml(copy.processTitle)}</h2>
          <ol>${process}</ol>
        </section>
        <section>
          <h2>${escapeHtml(copy.faqTitle)}</h2>
          <ul>${faq}</ul>
        </section>
        <section>
          <h2>${escapeHtml(copy.relatedTitle)}</h2>
          <ul>${related}</ul>
        </section>
      </article>
    </main>
  `;
}

function trainingStructuredData(locale: ArticleLocale, origin: string) {
  const copy = TRAINING_SEO_CONTENT[locale];

  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: copy.h1,
      serviceType: "Cabinet Vision Training",
      description: copy.metaDescription,
      provider: {
        "@type": "Organization",
        name: SITE_NAME,
        url: `${origin}${localizePath("/", locale)}`,
      },
      areaServed: ["Canada", "United States"],
      url: `${origin}${localizePath("/training", locale)}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: copy.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
}

function trainingCareerFallback(locale: ArticleLocale) {
  const copy = TRAINING_CAREER_COPY[locale];
  const points = copy.points.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const evaluationLabel = {
    en: "Request a Free Career Evaluation",
    fr: "Demander une evaluation de carriere gratuite",
    ar: "اطلب تقييما مهنيا مجانيا",
  }[locale];

  return `
    <main id="seo-fallback">
      <article>
        <section>
          <h1>${escapeHtml(copy.h1)}</h1>
          <p>${escapeHtml(copy.intro)}</p>
          <ul>${points}</ul>
          <nav class="seo-links">
            <a href="${escapeHtml(`${localizePath("/training/career", locale)}#career-evaluation`)}">${escapeHtml(evaluationLabel)}</a>
            <a href="${escapeHtml(localizePath("/book", locale))}">${escapeHtml(linkLabel(locale, "/book") || "Book")}</a>
            <a href="${escapeHtml(localizePath("/cabinet-vision-cnc-integration", locale))}">${escapeHtml(routeLabelForLocale(locale, "/cabinet-vision-cnc-integration"))}</a>
          </nav>
        </section>
      </article>
    </main>
  `;
}

function trainingCareerStructuredData(locale: ArticleLocale, origin: string) {
  const copy = TRAINING_CAREER_COPY[locale];

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: copy.h1,
    description: copy.metaDescription,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: `${origin}${localizePath("/", locale)}`,
    },
    courseMode: "online",
    url: `${origin}${localizePath("/training/career", locale)}`,
  };
}

function servicePageFallback(locale: ArticleLocale, page: SeoServicePage, origin: string) {
  const content = getSeoServicePageContent(page, locale);
  const pageImages = getSeoServicePageImageSet(page.key);
  const blocks = content.blocks.map((block) => blockFallbackHtml(block)).join("");
  const faq = content.faq
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(item.answer)}</p></li>`
    )
    .join("");
  const related = page.relatedPaths
    .map(
      (path) => `
        <li>
          <a href="${escapeHtml(localizePath(path, locale))}">${escapeHtml(routeLabelForLocale(locale, path))}</a>
          <p>${escapeHtml(routeDescriptionForLocale(locale, path))}</p>
        </li>
      `
    )
    .join("");
  const images = [pageImages.hero, pageImages.mid, pageImages.preCta]
    .map(
      (path, index) => `
        <figure>
          <img src="${escapeHtml(absoluteAssetUrl(origin, path))}" alt="${escapeHtml(`${content.shortTitle} image ${index + 1}`)}" loading="lazy" />
        </figure>
      `
    )
    .join("");

  return `
    <main id="seo-fallback">
      <article>
        <section>
          <h1>${escapeHtml(content.h1)}</h1>
          <p>${escapeHtml(content.heroLead)}</p>
          <p>${escapeHtml(content.heroBody)}</p>
          <nav class="seo-links">
            <a href="${escapeHtml(localizePath("/book", locale))}">${escapeHtml(routeLabelForLocale(locale, "/book"))}</a>
            <a href="${escapeHtml(localizePath("/", locale))}">${escapeHtml(SITE_NAME)}</a>
          </nav>
        </section>
        <section>${images}</section>
        ${blocks}
        <section>
          <h2>${escapeHtml(faqHeading(locale))}</h2>
          <ul>${faq}</ul>
        </section>
        <section>
          <h2>${escapeHtml(relatedPagesHeading(locale))}</h2>
          <ul>${related}</ul>
        </section>
      </article>
    </main>
  `;
}

function knowledgeBlockFallback(block: SeoKnowledgePage["content"]["en"]["blocks"][number]) {
  const paragraphs = block.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const bullets = block.bullets?.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "";
  return `<section><h2>${escapeHtml(block.title)}</h2>${paragraphs}${bullets ? `<ul>${bullets}</ul>` : ""}</section>`;
}

function knowledgePageFallback(locale: ArticleLocale, page: SeoKnowledgePage) {
  const content = getSeoKnowledgePageContent(page, locale);
  const blocks = content.blocks.map((item) => knowledgeBlockFallback(item)).join("");
  const faq = content.faq
    .map((item) => `<li><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(item.answer)}</p></li>`)
    .join("");
  const related = page.relatedPaths
    .map(
      (path) => `
        <li>
          <a href="${escapeHtml(localizePath(path, locale))}">${escapeHtml(routeLabelForLocale(locale, path))}</a>
          <p>${escapeHtml(routeDescriptionForLocale(locale, path))}</p>
        </li>
      `,
    )
    .join("");

  return `
    <main id="seo-fallback">
      <article>
        <section>
          <p>${escapeHtml(content.heroBadge)}</p>
          <h1>${escapeHtml(content.h1)}</h1>
          <p>${escapeHtml(content.heroLead)}</p>
          <p>${escapeHtml(content.intro)}</p>
          <nav class="seo-links">
            <a href="${escapeHtml(localizePath("/book", locale))}">${escapeHtml(routeLabelForLocale(locale, "/book"))}</a>
            <a href="${escapeHtml(localizePath("/cabinet-vision-troubleshooting", locale))}">${escapeHtml(routeLabelForLocale(locale, "/cabinet-vision-troubleshooting"))}</a>
          </nav>
        </section>
        ${blocks}
        <section>
          <h2>${escapeHtml(faqHeading(locale))}</h2>
          <ul>${faq}</ul>
        </section>
        <section>
          <h2>${escapeHtml(relatedPagesHeading(locale))}</h2>
          <ul>${related}</ul>
        </section>
      </article>
    </main>
  `;
}

function knowledgeStructuredData(locale: ArticleLocale, page: SeoKnowledgePage, origin: string) {
  const content = getSeoKnowledgePageContent(page, locale);
  const url = `${origin}${localizePath(page.canonicalPath, locale)}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: content.h1,
      description: content.metaDescription,
      inLanguage: locale,
      mainEntityOfPage: url,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: `${origin}${localizePath("/", locale)}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
}

function routeFallback(locale: ArticleLocale, path: string) {
  if (path === "/training") return trainingFallback(locale);

  const title = routeTitle(locale, path);
  const description = routeDescription(locale, path);
  return `
    <main id="seo-fallback">
      <section>
        <h1>${escapeHtml(title.replace(" | CVsolucion", ""))}</h1>
        <p>${escapeHtml(description)}</p>
        <nav class="seo-links">
          <a href="${escapeHtml(localizePath("/", locale))}">${escapeHtml(SITE_NAME)}</a>
          <a href="${escapeHtml(localizePath("/articles", locale))}">${escapeHtml(linkLabel(locale, "/articles") || "Articles")}</a>
          <a href="${escapeHtml(localizePath("/guides", locale))}">${escapeHtml(linkLabel(locale, "/guides") || "Guides")}</a>
          <a href="${escapeHtml(localizePath("/book", locale))}">${escapeHtml(linkLabel(locale, "/book") || "Book")}</a>
        </nav>
      </section>
    </main>
  `;
}

function articlesFallback(locale: ArticleLocale) {
  const articles = listPublishedArticles(locale).slice(0, 12);
  const base = localizePath("/articles", locale);
  const title = routeTitle(locale, "/articles");
  const description = routeDescription(locale, "/articles");
  const items = articles
    .map(
      (article) => `
        <li>
          <a href="${escapeHtml(`${base}/${article.slug}`)}">${escapeHtml(article.title)}</a>
          <p>${escapeHtml(summarizeText(article.body, 220))}</p>
        </li>
      `
    )
    .join("");

  return `
    <main id="seo-fallback">
      <section>
        <h1>${escapeHtml(title.replace(" | CVsolucion", ""))}</h1>
        <p>${escapeHtml(description)}</p>
        <ul>${items}</ul>
      </section>
    </main>
  `;
}

function guidesFallback(locale: ArticleLocale) {
  const title = routeTitle(locale, "/guides");
  const description = routeDescription(locale, "/guides");
  const items = SEO_KNOWLEDGE_PAGE_ORDER.map((key) => {
    const page = SEO_KNOWLEDGE_PAGES[key];
    const content = getSeoKnowledgePageContent(page, locale);
    return `
      <li>
        <a href="${escapeHtml(localizePath(page.canonicalPath, locale))}">${escapeHtml(content.shortTitle)}</a>
        <p>${escapeHtml(content.metaDescription)}</p>
      </li>
    `;
  }).join("");

  return `
    <main id="seo-fallback">
      <section>
        <h1>${escapeHtml(title.replace(" | CVsolucion", ""))}</h1>
        <p>${escapeHtml(description)}</p>
        <ul>${items}</ul>
        <nav class="seo-links">
          <a href="${escapeHtml(localizePath("/articles", locale))}">${escapeHtml(linkLabel(locale, "/articles") || "Articles")}</a>
          <a href="${escapeHtml(localizePath("/book", locale))}">${escapeHtml(linkLabel(locale, "/book") || "Book")}</a>
        </nav>
      </section>
    </main>
  `;
}

function guidesStructuredData(locale: ArticleLocale, origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: routeTitle(locale, "/guides").replace(" | CVsolucion", ""),
    description: routeDescription(locale, "/guides"),
    url: `${origin}${localizePath("/guides", locale)}`,
    hasPart: SEO_KNOWLEDGE_PAGE_ORDER.map((key) => {
      const page = SEO_KNOWLEDGE_PAGES[key];
      const content = getSeoKnowledgePageContent(page, locale);
      return {
        "@type": "TechArticle",
        headline: content.shortTitle,
        description: content.metaDescription,
        url: `${origin}${localizePath(page.canonicalPath, locale)}`,
      };
    }),
  };
}

function articleFallback(locale: ArticleLocale, slug: string) {
  const article = getArticleBySlug(slug, locale);
  if (!article) {
    return routeFallback(locale, "/articles");
  }

  const paragraphs = articleParagraphs(article.body)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  return `
    <main id="seo-fallback">
      <article>
        <h1>${escapeHtml(article.title)}</h1>
        <p>${escapeHtml(summarizeText(article.body, 240))}</p>
        ${paragraphs}
        <nav class="seo-links">
          <a href="${escapeHtml(localizePath("/articles", locale))}">Articles</a>
          <a href="${escapeHtml(localizePath("/book", locale))}">Book</a>
        </nav>
      </article>
    </main>
  `;
}

function notFoundFallback(locale: ArticleLocale) {
  const copy = {
    en: {
      title: "Page not found",
      body: "The requested page is not available on CVsolucion. Use the links below to reach current Cabinet Vision consulting, training, and support content.",
    },
    fr: {
      title: "Page introuvable",
      body: "La page demandee n'est pas disponible sur CVsolucion. Utilisez les liens ci-dessous pour acceder au contenu actuel de consulting, formation et support Cabinet Vision.",
    },
    ar: {
      title: "الصفحة غير موجودة",
      body: "الصفحة المطلوبة غير متاحة على CVsolucion. استخدم الروابط التالية للوصول إلى محتوى استشارات وتدريب ودعم Cabinet Vision الحالي.",
    },
  } as const;

  return `
    <main id="seo-fallback">
      <section>
        <h1>${escapeHtml(copy[locale].title)}</h1>
        <p>${escapeHtml(copy[locale].body)}</p>
        <nav class="seo-links">
          <a href="${escapeHtml(localizePath("/", locale))}">CVsolucion</a>
          <a href="${escapeHtml(localizePath("/articles", locale))}">Articles</a>
          <a href="${escapeHtml(localizePath("/guides", locale))}">Guides</a>
          <a href="${escapeHtml(localizePath("/book", locale))}">Book</a>
        </nav>
      </section>
    </main>
  `;
}

function getPublishedArticleAnyLocale(slug: string) {
  return getArticleBySlug(slug, "en") || getArticleBySlug(slug, "fr") || getArticleBySlug(slug, "ar");
}

function isKnownCleanPath(cleanPath: string) {
  const staticPaths = new Set([
    "/",
    "/training",
    "/training/career",
    "/training/career/thank-you",
    "/design-pricing",
    "/articles",
    "/guides",
    "/about",
    "/book",
    "/book/cart",
    "/book/checkout",
    "/privacy",
    "/terms",
    "/login",
    "/dashboard",
    "/designer",
    "/trainer",
    "/404",
  ]);

  if (staticPaths.has(cleanPath)) return true;
  if (getSeoServicePageByCanonicalPath(cleanPath)) return true;
  if (getSeoKnowledgePageByCanonicalPath(cleanPath)) return true;
  if (cleanPath.startsWith("/articles/")) {
    const slug = cleanPath.slice("/articles/".length);
    return Boolean(slug && getPublishedArticleAnyLocale(slug));
  }

  return false;
}

export function isKnownPublicSeoPath(pathname: string) {
  const cleanPath = stripLocale(pathname.replace(/\/+$/, "") || "/");
  return isKnownCleanPath(cleanPath);
}

function alternatesHtml(origin: string, canonicalPath: string) {
  const links = [
    { hreflang: "en", path: localizePath(canonicalPath, "en") },
    { hreflang: "fr", path: localizePath(canonicalPath, "fr") },
    { hreflang: "ar", path: localizePath(canonicalPath, "ar") },
    { hreflang: "x-default", path: localizePath(canonicalPath, "en") },
  ];

  return links
    .map((item) => `<link rel="alternate" hreflang="${item.hreflang}" href="${origin}${item.path}" />`)
    .join("\n");
}

function getSeoDocument(pathname: string, origin: string): SeoDocument {
  const locale = detectLocale(pathname);
  const cleanPath = stripLocale(pathname.replace(/\/+$/, "") || "/");
  const lang = locale;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const servicePage = getSeoServicePageByCanonicalPath(cleanPath);
  const knowledgePage = getSeoKnowledgePageByCanonicalPath(cleanPath);

  if (cleanPath === "/") {
    return {
      lang,
      dir,
      title: HOME_COPY[locale].title,
      description: HOME_COPY[locale].description,
      canonicalPath: "/",
      ogType: "website",
      robots: "index, follow",
      image: DEFAULT_IMAGE,
      fallbackHtml: homeFallback(locale),
      structuredData: {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        name: SITE_NAME,
        url: `${origin}${localizePath("/", locale)}`,
        description: HOME_COPY[locale].description,
        areaServed: ["Canada", "United States"],
        serviceType: ["Cabinet Vision Consulting", "Cabinet Vision Training", "Cabinet Vision Support"],
      },
    };
  }

  if (cleanPath === "/training") {
    const copy = TRAINING_SEO_CONTENT[locale];
    return {
      lang,
      dir,
      title: copy.seoTitle,
      description: copy.metaDescription,
      canonicalPath: cleanPath,
      ogType: "website",
      robots: "index, follow",
      image: DEFAULT_IMAGE,
      fallbackHtml: trainingFallback(locale),
      structuredData: trainingStructuredData(locale, origin),
    };
  }

  if (cleanPath === "/training/career") {
    const copy = TRAINING_CAREER_COPY[locale];
    return {
      lang,
      dir,
      title: copy.seoTitle,
      description: copy.metaDescription,
      canonicalPath: cleanPath,
      ogType: "website",
      robots: "index, follow",
      image: DEFAULT_IMAGE,
      fallbackHtml: trainingCareerFallback(locale),
      structuredData: trainingCareerStructuredData(locale, origin),
    };
  }

  if (cleanPath === "/training/career/thank-you") {
    const copy = TRAINING_CAREER_COPY[locale];
    const title =
      locale === "ar"
        ? "تم استلام طلب التقييم | CVsolucion"
        : locale === "fr"
          ? "Demande d'evaluation recue | CVsolucion"
          : "Career evaluation request received | CVsolucion";
    const description =
      locale === "ar"
        ? "تم استلام طلب التقييم المهني لتدريب Cabinet Vision."
        : locale === "fr"
          ? "Votre demande d'evaluation de carriere Cabinet Vision a bien ete recue."
          : "Your Cabinet Vision career evaluation request has been received.";
    return {
      lang,
      dir,
      title,
      description,
      canonicalPath: cleanPath,
      ogType: "website",
      robots: "noindex, nofollow",
      image: DEFAULT_IMAGE,
      fallbackHtml: `
        <main id="seo-fallback">
          <section>
            <h1>${escapeHtml(title)}</h1>
            <p>${escapeHtml(description)}</p>
            <a href="${escapeHtml(localizePath("/training/career", locale))}">${escapeHtml(copy.h1)}</a>
          </section>
        </main>
      `,
      structuredData: null,
    };
  }

  if (cleanPath === "/articles") {
    return {
      lang,
      dir,
      title: routeTitle(locale, cleanPath),
      description: routeDescription(locale, cleanPath),
      canonicalPath: cleanPath,
      ogType: "website",
      robots: "index, follow",
      image: DEFAULT_IMAGE,
      fallbackHtml: articlesFallback(locale),
      structuredData: null,
    };
  }

  if (cleanPath === "/guides") {
    return {
      lang,
      dir,
      title: routeTitle(locale, cleanPath),
      description: routeDescription(locale, cleanPath),
      canonicalPath: cleanPath,
      ogType: "website",
      robots: "index, follow",
      image: DEFAULT_IMAGE,
      fallbackHtml: guidesFallback(locale),
      structuredData: guidesStructuredData(locale, origin),
    };
  }

  if (cleanPath.startsWith("/articles/")) {
    const slug = cleanPath.slice("/articles/".length);
    const article = getArticleBySlug(slug, locale);
    if (!article && !getPublishedArticleAnyLocale(slug)) {
      return {
        lang,
        dir,
        title: "404 | CVsolucion",
        description: "The requested page could not be found.",
        canonicalPath: cleanPath,
        ogType: "website",
        robots: "noindex, nofollow",
        image: DEFAULT_IMAGE,
        fallbackHtml: notFoundFallback(locale),
        structuredData: null,
      };
    }
    const articleTitle = article?.title || routeTitle(locale, "/articles");
    const articleDescription = article ? summarizeText(article.body, 180) : routeDescription(locale, "/articles");
    return {
      lang,
      dir,
      title: `${articleTitle} | CVsolucion`,
      description: articleDescription,
      canonicalPath: cleanPath,
      ogType: "article",
      robots: "index, follow",
      image: article?.imageUrl || DEFAULT_IMAGE,
      fallbackHtml: articleFallback(locale, slug),
      structuredData: article
        ? {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: articleDescription,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            image: article.imageUrl ? [article.imageUrl] : [DEFAULT_IMAGE],
            mainEntityOfPage: `${origin}${localizePath(cleanPath, locale)}`,
            publisher: {
              "@type": "Organization",
              name: SITE_NAME,
            },
          }
        : null,
    };
  }

  if (servicePage) {
    const content = getSeoServicePageContent(servicePage, locale);
    const pageImages = getSeoServicePageImageSet(servicePage.key);
    const heroImage = absoluteAssetUrl(origin, pageImages.hero);
    return {
      lang,
      dir,
      title: content.seoTitle,
      description: content.metaDescription,
      canonicalPath: cleanPath,
      ogType: "website",
      robots: "index, follow",
      image: heroImage,
      fallbackHtml: servicePageFallback(locale, servicePage, origin),
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Service",
          name: content.shortTitle,
          serviceType: content.shortTitle,
          description: content.metaDescription,
          image: [heroImage],
          provider: {
            "@type": "Organization",
            name: SITE_NAME,
            url: `${origin}${localizePath("/", locale)}`,
          },
          areaServed: ["Canada", "United States"],
          url: `${origin}${localizePath(cleanPath, locale)}`,
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        },
      ],
    };
  }

  if (knowledgePage) {
    const content = getSeoKnowledgePageContent(knowledgePage, locale);
    return {
      lang,
      dir,
      title: content.seoTitle,
      description: content.metaDescription,
      canonicalPath: cleanPath,
      ogType: "article",
      robots: "index, follow",
      image: DEFAULT_IMAGE,
      fallbackHtml: knowledgePageFallback(locale, knowledgePage),
      structuredData: knowledgeStructuredData(locale, knowledgePage, origin),
    };
  }

  const noindexPaths = new Set(["/login", "/dashboard", "/designer", "/trainer", "/book/cart", "/book/checkout"]);
  const knownPath = isKnownCleanPath(cleanPath);
  const robots = noindexPaths.has(cleanPath) || !knownPath ? "noindex, nofollow" : "index, follow";

  return {
    lang,
    dir,
    title: knownPath ? routeTitle(locale, cleanPath) : "404 | CVsolucion",
    description: knownPath ? routeDescription(locale, cleanPath) : "The requested page could not be found.",
    canonicalPath: cleanPath,
    ogType: "website",
    robots,
    image: DEFAULT_IMAGE,
    fallbackHtml: knownPath ? routeFallback(locale, cleanPath) : notFoundFallback(locale),
    structuredData: null,
  };
}

function replaceMeta(html: string, selector: { name?: string; property?: string }, content: string) {
  const attribute = selector.name ? "name" : "property";
  const key = selector.name ?? selector.property ?? "";
  const pattern = new RegExp(`<meta\\s+${attribute}="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s+content="[^"]*"\\s*\\/?>`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

export function renderSeoHtml(template: string, pathname: string, origin: string) {
  const doc = getSeoDocument(pathname, origin);
  const canonicalUrl = `${origin}${localizePath(doc.canonicalPath, detectLocale(pathname))}`;
  const structured = doc.structuredData
    ? `<script type="application/ld+json">${JSON.stringify(doc.structuredData)}</script>`
    : "";
  const bingVerification = String(process.env.BING_SITE_VERIFICATION || "").trim();

  let html = template;
  html = html.replace(/<html[^>]*lang="[^"]*"[^>]*>/i, `<html lang="${doc.lang}"${doc.dir === "rtl" ? ' dir="rtl"' : ""}>`);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(doc.title)}</title>`);
  html = replaceMeta(html, { name: "title" }, doc.title);
  html = replaceMeta(html, { name: "description" }, doc.description);
  html = replaceMeta(html, { name: "robots" }, doc.robots);
  if (bingVerification) {
    html = replaceMeta(html, { name: "msvalidate.01" }, bingVerification);
  }
  html = replaceMeta(html, { property: "og:type" }, doc.ogType);
  html = replaceMeta(html, { property: "og:url" }, canonicalUrl);
  html = replaceMeta(html, { property: "og:site_name" }, SITE_NAME);
  html = replaceMeta(html, { property: "og:title" }, doc.title);
  html = replaceMeta(html, { property: "og:description" }, doc.description);
  html = replaceMeta(html, { property: "og:image" }, doc.image);
  html = replaceMeta(html, { name: "twitter:url" }, canonicalUrl);
  html = replaceMeta(html, { name: "twitter:title" }, doc.title);
  html = replaceMeta(html, { name: "twitter:description" }, doc.description);
  html = replaceMeta(html, { name: "twitter:image" }, doc.image);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
  html = html.replace("<!-- SEO_ALTERNATES -->", alternatesHtml(origin, doc.canonicalPath));
  html = html.replace("<!-- SEO_STRUCTURED_DATA -->", structured);
  html = html.replace("<!-- SEO_FALLBACK -->", doc.fallbackHtml);
  return html;
}

const SITEMAP_LOCALES: ArticleLocale[] = ["en", "fr", "ar"];
const STATIC_SITEMAP_LASTMOD = new Date().toISOString().slice(0, 10);

type SitemapChangeFreq = "daily" | "weekly" | "monthly";

function normalizeDateOnly(value?: string | null, fallback = STATIC_SITEMAP_LASTMOD) {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString().slice(0, 10);
}

function sitemapAlternatesXml(origin: string, canonicalPath: string) {
  const alternates = [
    { hreflang: "en", href: `${origin}${localizePath(canonicalPath, "en")}` },
    { hreflang: "fr", href: `${origin}${localizePath(canonicalPath, "fr")}` },
    { hreflang: "ar", href: `${origin}${localizePath(canonicalPath, "ar")}` },
    { hreflang: "x-default", href: `${origin}${localizePath(canonicalPath, "en")}` },
  ];

  return alternates
    .map((item) => `<xhtml:link rel="alternate" hreflang="${item.hreflang}" href="${escapeHtml(item.href)}" />`)
    .join("");
}

function sitemapUrlEntriesXml(args: {
  origin: string;
  canonicalPath: string;
  lastmod?: string | null;
  changefreq: SitemapChangeFreq;
  priority: string;
}) {
  const alternates = sitemapAlternatesXml(args.origin, args.canonicalPath);
  const lastmod = normalizeDateOnly(args.lastmod);

  return SITEMAP_LOCALES.map((locale) => {
    const url = `${args.origin}${localizePath(args.canonicalPath, locale)}`;
    return `<url><loc>${escapeHtml(url)}</loc>${alternates}<lastmod>${lastmod}</lastmod><changefreq>${args.changefreq}</changefreq><priority>${args.priority}</priority></url>`;
  }).join("");
}

export function buildSitemapXml(origin: string) {
  const staticPages: Array<{ canonicalPath: string; changefreq: SitemapChangeFreq; priority: string }> = [
    { canonicalPath: "/", changefreq: "weekly", priority: "1.0" },
    { canonicalPath: "/book", changefreq: "weekly", priority: "0.9" },
    { canonicalPath: "/articles", changefreq: "weekly", priority: "0.9" },
    { canonicalPath: "/guides", changefreq: "weekly", priority: "0.88" },
    { canonicalPath: "/training", changefreq: "weekly", priority: "0.9" },
    { canonicalPath: "/training/career", changefreq: "weekly", priority: "0.88" },
    { canonicalPath: "/design-pricing", changefreq: "monthly", priority: "0.8" },
    { canonicalPath: "/about", changefreq: "monthly", priority: "0.7" },
    { canonicalPath: "/privacy", changefreq: "monthly", priority: "0.5" },
    { canonicalPath: "/terms", changefreq: "monthly", priority: "0.5" },
    ...SEO_SERVICE_PAGE_ORDER.map((key) => ({
      canonicalPath: SEO_SERVICE_PAGES[key].canonicalPath,
      changefreq: "monthly" as SitemapChangeFreq,
      priority: "0.85",
    })),
    ...SEO_KNOWLEDGE_PAGE_ORDER.map((key) => ({
      canonicalPath: SEO_KNOWLEDGE_PAGES[key].canonicalPath,
      changefreq: "monthly" as SitemapChangeFreq,
      priority: "0.82",
    })),
  ];

  const articleEntries = listPublishedArticles("en")
    .map((article) => {
      const articleLastmod = normalizeDateOnly(article.updatedAt || article.publishedAt, STATIC_SITEMAP_LASTMOD);
      return sitemapUrlEntriesXml({
        origin,
        canonicalPath: `/articles/${article.slug}`,
        lastmod: articleLastmod,
        changefreq: "monthly",
        priority: "0.8",
      });
    })
    .join("");

  const staticEntries = staticPages
    .map((page) =>
      sitemapUrlEntriesXml({
        origin,
        canonicalPath: page.canonicalPath,
        lastmod: STATIC_SITEMAP_LASTMOD,
        changefreq: page.changefreq,
        priority: page.priority,
      })
    )
    .join("");

  const entries = `${staticEntries}${articleEntries}`;
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries}</urlset>`;
}

export function buildRobotsTxt(origin: string) {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /dashboard",
    "Disallow: /designer",
    "Disallow: /trainer",
    "Disallow: /login",
    "Disallow: /book/cart",
    "Disallow: /book/checkout",
    "Disallow: /fr/dashboard",
    "Disallow: /fr/designer",
    "Disallow: /fr/trainer",
    "Disallow: /fr/login",
    "Disallow: /fr/book/cart",
    "Disallow: /fr/book/checkout",
    "Disallow: /ar/dashboard",
    "Disallow: /ar/designer",
    "Disallow: /ar/trainer",
    "Disallow: /ar/login",
    "Disallow: /ar/book/cart",
    "Disallow: /ar/book/checkout",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
}
