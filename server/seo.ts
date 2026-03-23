import { getArticleBySlug, listPublishedArticles, type ArticleLocale } from "./articleStore";

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

const HOME_COPY = {
  en: {
    title: "Cabinet Vision Consulting, Training & Support | CVsolucion",
    description:
      "Cabinet Vision consulting, training, support, and optimization for cabinet shops: fix errors, speed up workflows, standardize libraries, and stabilize CNC output.",
    h1: "Cabinet Vision Consulting, Support, Training, and Booking",
    p1: "CVsolucion helps cabinet shops fix Cabinet Vision errors, improve performance, standardize libraries, stabilize CNC output, and train designers, engineers, and production teams. The goal is not generic software support. It is reliable implementation that works inside real cabinet manufacturing workflows.",
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
    h1: "Consulting, support, formation et reservation Cabinet Vision",
    p1: "CVsolucion aide les ateliers d'ebnisterie a corriger les erreurs Cabinet Vision, ameliorer les performances, standardiser les bibliotheques, stabiliser la sortie CNC et former les designers, ingenieurs et equipes de production. L'objectif n'est pas un support logiciel generique, mais une implementation fiable dans un vrai contexte usine.",
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
    h1: "استشارات ودعم وتدريب وحجز Cabinet Vision",
    p1: "تساعد CVsolucion مصانع الخزائن والمطابخ على إصلاح مشاكل Cabinet Vision، تحسين الأداء، توحيد المكتبات، تثبيت مخرجات CNC، وتدريب المصممين والمهندسين وفرق الإنتاج. الهدف ليس دعماً عاماً للبرنامج، بل تنفيذاً عملياً مستقراً داخل بيئة تصنيع حقيقية.",
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
  const map = {
    en: {
      "/training": "Cabinet Vision Training | CVsolucion",
      "/design-pricing": "Cabinet Vision Design & Pricing Setup | CVsolucion",
      "/articles": "Cabinet Vision Articles, Guides & Case Studies | CVsolucion",
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
  const map = {
    en: {
      "/training": "Remote Cabinet Vision training for designers, engineers, and production teams with practical sessions and implementation guidance.",
      "/design-pricing": "Structured Cabinet Vision design and pricing setup for factories that need clean quoting logic and production-ready outputs.",
      "/articles": "Cabinet Vision articles, implementation lessons, troubleshooting guides, and production case studies from real shop-floor work.",
      "/about": "Learn how CVsolucion helps cabinet shops improve Cabinet Vision workflows, libraries, reports, and CNC output.",
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
      "/about": "About",
      "/book": "Book a session",
      "/privacy": "Privacy Policy",
      "/terms": "Terms of Service",
    },
    fr: {
      "/training": "Formation",
      "/design-pricing": "Design & Pricing",
      "/articles": "Articles",
      "/about": "A propos",
      "/book": "Reserver",
      "/privacy": "Confidentialite",
      "/terms": "Conditions",
    },
    ar: {
      "/training": "التدريب",
      "/design-pricing": "التصميم والتسعير",
      "/articles": "المقالات",
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
  const links = ["/training", "/design-pricing", "/articles", "/about", "/book", "/privacy", "/terms"]
    .map((path) => `<a href="${escapeHtml(localizePath(path, locale))}">${escapeHtml(linkLabel(locale, path) || path)}</a>`)
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
        <h2>${escapeHtml(copy.h2b)}</h2>
        <ul>
          <li><a href="${escapeHtml(localizePath("/training", locale))}">${escapeHtml(linkLabel(locale, "/training") || "")}</a></li>
          <li><a href="${escapeHtml(localizePath("/design-pricing", locale))}">${escapeHtml(linkLabel(locale, "/design-pricing") || "")}</a></li>
          <li><a href="${escapeHtml(localizePath("/articles", locale))}">${escapeHtml(linkLabel(locale, "/articles") || "")}</a></li>
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

function routeFallback(locale: ArticleLocale, path: string) {
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

  if (cleanPath.startsWith("/articles/")) {
    const slug = cleanPath.slice("/articles/".length);
    const article = getArticleBySlug(slug, locale);
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

  const robots = cleanPath === "/login" || cleanPath === "/dashboard" ? "noindex, nofollow" : "index, follow";

  return {
    lang,
    dir,
    title: routeTitle(locale, cleanPath),
    description: routeDescription(locale, cleanPath),
    canonicalPath: cleanPath,
    ogType: "website",
    robots,
    image: DEFAULT_IMAGE,
    fallbackHtml: routeFallback(locale, cleanPath),
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

  let html = template;
  html = html.replace(/<html[^>]*lang="[^"]*"[^>]*>/i, `<html lang="${doc.lang}"${doc.dir === "rtl" ? ' dir="rtl"' : ""}>`);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(doc.title)}</title>`);
  html = replaceMeta(html, { name: "title" }, doc.title);
  html = replaceMeta(html, { name: "description" }, doc.description);
  html = replaceMeta(html, { name: "robots" }, doc.robots);
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

export function buildSitemapXml(origin: string) {
  const staticPaths = ["/", "/training", "/design-pricing", "/articles", "/about", "/book", "/privacy", "/terms"];
  const urls = new Set<string>();

  for (const locale of ["en", "fr", "ar"] as ArticleLocale[]) {
    for (const path of staticPaths) {
      urls.add(`${origin}${localizePath(path, locale)}`);
    }
  }

  for (const locale of ["en", "fr", "ar"] as ArticleLocale[]) {
    for (const article of listPublishedArticles(locale)) {
      urls.add(`${origin}${localizePath(`/articles/${article.slug}`, locale)}`);
    }
  }

  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = Array.from(urls)
    .sort()
    .map((url) => {
      const priority = url.endsWith("/articles") || url.includes("/articles/") ? "0.8" : url === `${origin}/` ? "1.0" : "0.7";
      return `<url><loc>${escapeHtml(url)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export function buildRobotsTxt(origin: string) {
  return `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /admin\n\nSitemap: ${origin}/sitemap.xml\n`;
}
