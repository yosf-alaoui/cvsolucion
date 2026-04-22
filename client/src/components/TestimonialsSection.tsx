import { Factory, Quote, ShieldCheck, TrendingUp } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useI18n } from "@/i18n/i18n";

export default function TestimonialsSection() {
  const { locale } = useI18n();

  const copy =
    locale === "ar"
      ? {
          kicker: "الثقة والنتائج",
          title: "لماذا تلتزم الورش معنا بعد أول تدخل",
          subtitle:
            "القرار هنا لا يُبنى على الوعود فقط، بل على وضوح التنفيذ، استقرار الإخراج، وسرعة حل المشاكل داخل بيئة إنتاج حقيقية.",
          metrics: [
            { label: "تحسينات منفذة", value: "500+" },
            { label: "دعم عن بُعد سريع", value: "< 24h" },
            { label: "تغييرات آمنة مع نسخ احتياطي", value: "100%" },
          ],
          quotes: [
            {
              quote:
                "أول مرة نحصل على دعم يفهم فعلاً العلاقة بين Cabinet Vision والمكتبات والـCNC بدل الاكتفاء بحل واجهة المشكلة.",
              author: "Production Manager",
              location: "Quebec cabinet shop",
            },
            {
              quote:
                "المهم بالنسبة لنا لم يكن فقط إصلاح الخطأ، بل توحيد طريقة العمل حتى لا يعود الخطأ بعد أسبوعين. هذا ما حدث فعلاً.",
              author: "Owner",
              location: "Custom millwork team",
            },
            {
              quote:
                "جلسة واحدة أعادت ترتيب التقارير، المسميات، والإخراج. التأثير ظهر مباشرة على السرعة داخل المصنع.",
              author: "Design Lead",
              location: "CNC production office",
            },
          ],
          trustPoints: [
            "Cabinet Vision consulting",
            "CNC troubleshooting",
            "Safe migrations and restore plans",
          ],
        }
      : locale === "fr"
        ? {
            kicker: "Confiance & preuve",
            title: "Pourquoi les ateliers restent avec nous apres la premiere intervention",
            subtitle:
              "Ici, la confiance vient d'un workflow plus stable, d'une sortie CNC plus previsible et d'une execution claire dans un vrai contexte de production.",
            metrics: [
              { label: "Optimisations realisees", value: "500+" },
              { label: "Support remote rapide", value: "< 24h" },
              { label: "Interventions avec backup", value: "100%" },
            ],
            quotes: [
              {
                quote:
                  "C'est la premiere fois qu'un support comprend vraiment le lien entre Cabinet Vision, les bibliotheques et la sortie CNC.",
                author: "Responsable production",
                location: "Atelier au Quebec",
              },
              {
                quote:
                  "Le plus important n'etait pas seulement de corriger l'erreur, mais de stabiliser la methode pour qu'elle ne revienne pas.",
                author: "Dirigeant",
                location: "Equipe de menuiserie sur mesure",
              },
              {
                quote:
                  "Une seule session a remis de l'ordre dans les rapports, les noms et les sorties. L'impact a ete immediat sur le rythme atelier.",
                author: "Responsable design",
                location: "Bureau technique CNC",
              },
            ],
            trustPoints: [
              "Conseil Cabinet Vision",
              "Depannage CNC",
              "Migrations et restaurations securisees",
            ],
          }
        : {
            kicker: "Trust & Social Proof",
            title: "Why shops stay after the first engagement",
            subtitle:
              "Trust here comes from cleaner execution, stable CNC output, and fast decisions inside real production workflows, not generic software support.",
            metrics: [
              { label: "Optimizations delivered", value: "500+" },
              { label: "Fast remote support", value: "< 24h" },
              { label: "Safe backup-first changes", value: "100%" },
            ],
            quotes: [
              {
                quote:
                  "This was the first support we used that actually understood the link between Cabinet Vision, libraries, and CNC output instead of fixing only symptoms.",
                author: "Production Manager",
                location: "Quebec cabinet shop",
              },
              {
                quote:
                  "What mattered was not only removing the error, but standardizing the workflow so it would not come back two weeks later. That is what changed.",
                author: "Owner",
                location: "Custom millwork team",
              },
              {
                quote:
                  "One session cleaned up reports, naming, and output logic. The effect was visible immediately on shop-floor speed.",
                author: "Design Lead",
                location: "CNC production office",
              },
            ],
            trustPoints: [
              "Cabinet Vision consulting",
              "CNC troubleshooting",
              "Safe migrations and restore plans",
            ],
          };

  const icons = [Factory, TrendingUp, ShieldCheck];

  return (
    <section id="proof" className="py-22">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="glass-chip inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            {copy.kicker}
          </span>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{copy.title}</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{copy.subtitle}</p>
        </div>

        <div className="card-stage mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-3">
          {copy.metrics.map((metric, index) => {
            const Icon = icons[index];
            return (
              <GlassCard key={metric.label} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-3xl font-bold text-slate-950">{metric.value}</div>
                    <p className="mt-2 text-sm font-medium text-slate-600">{metric.label}</p>
                  </div>
                  <span className="glass-chip inline-flex h-12 w-12 items-center justify-center rounded-2xl text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>

        <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-600">
          {copy.trustPoints.map((point) => (
            <span key={point} className="glass-chip rounded-full px-4 py-2">
              {point}
            </span>
          ))}
        </div>

        <div className="card-stage mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-3">
          {copy.quotes.map((item) => (
            <GlassCard key={`${item.author}-${item.location}`} className="p-7">
              <div className="glass-chip mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-primary">
                <Quote className="h-5 w-5" />
              </div>
              <p className="text-base leading-8 text-slate-700">{item.quote}</p>
              <div className="mt-6 border-t border-slate-200/60 pt-4">
                <div className="font-semibold text-slate-900">{item.author}</div>
                <div className="mt-1 text-sm text-slate-500">{item.location}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
