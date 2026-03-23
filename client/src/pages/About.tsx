import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, Factory, FileCog, GraduationCap, ShieldCheck } from "lucide-react";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { WHATSAPP_PHONE, getBookingHref } from "@/lib/site";

export default function About() {
  const { locale, t } = useI18n();
  const prefix = locale === "en" ? "" : `/${locale}`;
  const trainingHref = `${prefix}/training`;
  const articlesHref = `${prefix}/articles`;
  const bookingHref = getBookingHref(locale);
  const whatsappHref = buildWhatsAppLink(WHATSAPP_PHONE, t("whatsapp.needHelp"));

  const copy =
    locale === "ar"
      ? {
          title: "من نحن",
          description:
            "CVsolucion جهة متخصصة في Cabinet Vision تركّز على الاستقرار، التوحيد، وسرعة التنفيذ داخل بيئة الإنتاج، لا على الشروحات العامة فقط.",
          introTitle: "خبرة تشغيلية وليست دعماً عاماً",
          introBody:
            "نحن لا نتعامل مع Cabinet Vision كبرنامج منعزل، بل كجزء من منظومة كاملة: مكتبات، تقارير، قواعد، CNC، فرق تصميم، وواقع المصنع اليومي. هدفنا أن ينتقل العميل من الارتباك والاعتماد على الحلول المؤقتة إلى workflow واضح يمكن الوثوق به.",
          pillars: [
            { title: "استشارات تنفيذية", body: "قراءة الوضع الحالي بسرعة ثم ترتيب الأولويات التي تؤثر فعلاً على الإنتاج.", icon: Factory },
            { title: "تدريب مرتبط بالواقع", body: "تدريب مبني على ملفاتك ومكتباتك وقواعدك، لا على أمثلة عامة فقط.", icon: GraduationCap },
            { title: "أنظمة وتقارير ومخرجات", body: "تنظيم UCS والتقارير والمسارات والمخرجات لتصبح قابلة للاعتماد داخل المصنع.", icon: FileCog },
            { title: "تنفيذ آمن", body: "أي تغيير يتم مع تفكير backup-first لتقليل المخاطرة أثناء العمل الفعلي.", icon: ShieldCheck },
          ],
          expertiseTitle: "ما الذي يميزنا",
          expertiseItems: [
            "فهم عملي لعلاقة Cabinet Vision بالإنتاج والـCNC",
            "حل المشاكل من الجذر بدل معالجة العرض الظاهر فقط",
            "تركيز على السرعة، التوحيد، والاستقرار طويل المدى",
          ],
          ctaTitle: "إذا كنت تبحث عن جهة تفهم الورشة لا الواجهة فقط",
          ctaBody: "ابدأ بجلسة استشارية، أو اطلع على التدريب، أو تابع المقالات التقنية المتخصصة.",
          buttons: {
            booking: "احجز استشارة",
            training: "استكشف التدريب",
            articles: "اقرأ المقالات",
          },
          seoTitle: "من نحن | خبراء Cabinet Vision وCNC | CVsolucion",
          seoDescription:
            "تعرّف على CVsolucion: خبرة متخصصة في Cabinet Vision، المكتبات، التقارير، الـCNC، التدريب، والتنفيذ الآمن داخل بيئة إنتاج حقيقية.",
        }
      : locale === "fr"
        ? {
            title: "A propos",
            description:
              "CVsolucion est specialise dans Cabinet Vision avec une approche operationnelle: stabiliser, standardiser et accelerer les workflows en production.",
            introTitle: "Une expertise operationnelle, pas un support generique",
            introBody:
              "Nous ne traitons pas Cabinet Vision comme un simple logiciel isole. Nous l'abordons comme un systeme complet: bibliotheques, rapports, regles, CNC, equipe design et realite atelier. L'objectif est de passer d'un workflow fragile a une execution fiable.",
            pillars: [
              { title: "Conseil executif", body: "Analyser rapidement la situation et prioriser ce qui affecte vraiment la production.", icon: Factory },
              { title: "Formation ancree dans le reel", body: "Former a partir de vos fichiers, bibliotheques et regles, pas seulement d'exemples generiques.", icon: GraduationCap },
              { title: "Rapports et sorties", body: "Structurer les UCS, rapports et sorties pour qu'ils soient fiables dans l'usine.", icon: FileCog },
              { title: "Execution securisee", body: "Chaque changement est pense avec sauvegarde et retour arriere si necessaire.", icon: ShieldCheck },
            ],
            expertiseTitle: "Ce qui nous distingue",
            expertiseItems: [
              "Une comprehension directe du lien entre Cabinet Vision, production et CNC",
              "Une resolution des problemes a la racine, pas seulement des symptomes",
              "Un focus sur la vitesse, la standardisation et la stabilite durable",
            ],
            ctaTitle: "Si vous cherchez un partenaire qui comprend l'atelier, pas seulement l'interface",
            ctaBody: "Demarrez par une consultation, explorez la formation, ou lisez les articles techniques.",
            buttons: {
              booking: "Reserver une consultation",
              training: "Voir la formation",
              articles: "Lire les articles",
            },
            seoTitle: "A propos | Experts Cabinet Vision et CNC | CVsolucion",
            seoDescription:
              "Decouvrez CVsolucion: expertise Cabinet Vision, bibliotheques, rapports, CNC, formation et execution securisee en environnement atelier.",
          }
        : {
            title: "About Us",
            description:
              "CVsolucion specializes in Cabinet Vision with an operational focus: stabilizing, standardizing, and accelerating real production workflows.",
            introTitle: "Operational expertise, not generic software support",
            introBody:
              "We do not treat Cabinet Vision as an isolated software tool. We work on the full production system around it: libraries, reports, rules, CNC output, design teams, and what actually happens on the shop floor. The goal is to move a team from patchwork fixes to a workflow they can trust.",
            pillars: [
              { title: "Execution-focused consulting", body: "Quickly read the current state and prioritize what actually affects production.", icon: Factory },
              { title: "Training tied to real files", body: "Training built around your own libraries, reports, and team habits, not generic demos.", icon: GraduationCap },
              { title: "Reports, rules, and output systems", body: "Structure UCS, reports, and output logic so the factory can rely on them daily.", icon: FileCog },
              { title: "Safe implementation", body: "Every change follows backup-first thinking to reduce risk while the shop keeps moving.", icon: ShieldCheck },
            ],
            expertiseTitle: "What makes the approach different",
            expertiseItems: [
              "Hands-on understanding of how Cabinet Vision connects to production and CNC",
              "Root-cause fixes instead of symptom-only support",
              "A bias toward speed, standardization, and long-term stability",
            ],
            ctaTitle: "If you need a partner who understands the shop, not only the interface",
            ctaBody: "Start with a consultation, explore training, or read the technical articles.",
            buttons: {
              booking: "Book a consultation",
              training: "Explore training",
              articles: "Read articles",
            },
            seoTitle: "About | Cabinet Vision and CNC Experts | CVsolucion",
            seoDescription:
              "Meet CVsolucion: specialized Cabinet Vision expertise across libraries, reports, CNC output, training, and safe workflow implementation.",
          };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "CVsolucion",
    url: typeof window !== "undefined" ? window.location.href : "https://cvsolucion.com/about",
    areaServed: ["Canada", "United States"],
    serviceType: ["Cabinet Vision Consulting", "Cabinet Vision Training", "CNC Troubleshooting"],
  };

  return (
    <div className="site-page min-h-screen bg-transparent">
      <Seo title={copy.seoTitle} description={copy.seoDescription} structuredData={structuredData} />
      <Header />
      <main className="pt-32 pb-20">
        <section className="container">
          <div className="mx-auto max-w-4xl text-center">
            <span className="glass-chip inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              CVsolucion
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{copy.title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.description}</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <GlassCard className="card-static rounded-[32px] p-8">
              <h2 className="text-3xl font-bold text-slate-950">{copy.introTitle}</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">{copy.introBody}</p>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {copy.pillars.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="glass-chip rounded-[24px] p-5">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard className="card-static rounded-[32px] p-8">
              <h2 className="text-2xl font-bold text-slate-950">{copy.expertiseTitle}</h2>
              <ul className="mt-6 space-y-4">
                {copy.expertiseItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base leading-8 text-slate-700">
                    <ArrowRight className="mt-2 h-4 w-4 flex-none text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-slate-200/70 pt-8">
                <h3 className="text-xl font-bold text-slate-900">{copy.ctaTitle}</h3>
                <p className="mt-4 text-base leading-8 text-slate-600">{copy.ctaBody}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={bookingHref} target={bookingHref.startsWith("http") ? "_blank" : undefined} rel={bookingHref.startsWith("http") ? "noopener noreferrer" : undefined}>
                    <Button className="rounded-full bg-primary text-white hover:bg-primary/90">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {copy.buttons.booking}
                    </Button>
                  </a>
                  <a href={trainingHref}>
                    <Button variant="outline" className="rounded-full">
                      {copy.buttons.training}
                    </Button>
                  </a>
                  <a href={articlesHref}>
                    <Button variant="outline" className="rounded-full">
                      {copy.buttons.articles}
                    </Button>
                  </a>
                </div>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex text-sm font-semibold text-primary hover:text-primary/80">
                  WhatsApp
                </a>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
