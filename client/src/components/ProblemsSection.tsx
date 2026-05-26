import GlassCard from "@/components/GlassCard";
import { Check, Cpu, FileText, Package, Wrench, Zap } from "lucide-react";
import { useI18n } from "@/i18n/i18n";

/**
 * Problems Section - CVsolucion
 * Displays common Cabinet Vision problems we solve
 * Design: Card-based layout with icons and categories
 */
export default function ProblemsSection() {
  const { t } = useI18n();
  const problems = t("problems.cards") as { title: string; items: string[] }[];
  const icons = [Zap, Package, Wrench, Cpu, FileText];

  return (
    <section id="problems" className="py-20 bg-transparent">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="mb-16 text-center">
          <h2
            className="mb-4 text-4xl font-bold text-primary md:text-5xl"
            style={{ fontFamily: "Playfair Display" }}
          >
            {t("problems.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t("problems.subtitle")}
          </p>
        </div>

        <div className="card-stage grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, index) => {
            const Icon = icons[index];
            return (
              <GlassCard key={index} className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3
                    className="text-xl font-bold text-primary"
                    style={{ fontFamily: "Poppins" }}
                  >
                    {problem.title}
                  </h3>
                </div>

                <ul className="card-list text-sm">
                  {problem.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="card-list-item">
                      <span className="card-list-icon">
                        <Check />
                      </span>
                      <span className="card-list-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
