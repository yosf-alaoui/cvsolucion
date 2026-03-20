import { Card } from '@/components/ui/card';
import { 
  Zap, 
  Package, 
  Wrench, 
  Cpu, 
  FileText 
} from 'lucide-react';
import { useI18n } from "@/i18n/i18n";

/**
 * Problems Section - CV Solution
 * Displays common Cabinet Vision problems we solve
 * Design: Card-based layout with icons and categories
 */
export default function ProblemsSection() {
    const { t } = useI18n();
  const problems = t("problems.cards") as { title: string; items: string[] }[];
  const icons = [Zap, Package, Wrench, Cpu, FileText];

  return (
    <section id="problems" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl font-bold text-primary mb-4"
            style={{ fontFamily: 'Playfair Display' }}
          >
            {t("problems.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("problems.subtitle")}
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {problems.map((problem, index) => {
            const Icon = icons[index];
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-lg transition-shadow duration-300 border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 
                    className="text-xl font-bold text-primary"
                    style={{ fontFamily: 'Poppins' }}
                  >
                    {problem.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {problem.items.map((item, itemIndex) => (
                    <li 
                      key={itemIndex}
                      className="text-foreground/80 text-sm flex items-start gap-2"
                    >
                      <span className="text-accent mt-1.5 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
