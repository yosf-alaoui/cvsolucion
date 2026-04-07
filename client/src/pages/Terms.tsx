import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { TermsContent } from "@/content/legal";
import { useI18n } from "@/i18n/i18n";

export default function Terms() {
  const { locale } = useI18n();
  const copy =
    locale === "ar"
      ? {
          title: "الشروط والأحكام | CVsolucion",
          description: "راجع الشروط والأحكام التي تنظم استخدام خدمات CVsolucion.",
          eyebrow: "قانوني",
          heading: "الشروط والأحكام",
          subtitle: "الشروط التي تنظم كيفية استخدامك لخدمات CVsolucion.",
        }
      : locale === "fr"
        ? {
            title: "Conditions d'utilisation | CVsolucion",
            description: "Consultez les conditions qui encadrent l'utilisation des services CVsolucion.",
            eyebrow: "Legal",
            heading: "Conditions d'utilisation",
            subtitle: "Les conditions qui encadrent l'utilisation des services CVsolucion.",
          }
        : {
            title: "Terms and Conditions | CVsolucion",
            description: "Review the terms and conditions that govern use of CVsolucion services.",
            eyebrow: "Legal",
            heading: "Terms and Conditions",
            subtitle: "The terms and conditions that govern how you use CVsolucion services.",
          };

  return (
    <div className="site-page min-h-screen flex flex-col bg-transparent">
      <Seo
        title={copy.title}
        description={copy.description}
        type="website"
      />
      <Header />
      <main className="flex-1 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="space-y-2">
            <p className="text-sm text-slate-500 uppercase tracking-wide">{copy.eyebrow}</p>
            <h1 className="text-4xl font-bold text-slate-900">{copy.heading}</h1>
            <p className="text-slate-600">{copy.subtitle}</p>
          </header>

          <section className="glass-card-strong card-static rounded-2xl p-8">
            <div className="prose max-w-none prose-slate prose-headings:mt-8 prose-headings:font-semibold">
              <TermsContent locale={locale as "en" | "fr" | "ar"} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
