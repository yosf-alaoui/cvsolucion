import GlassCard from "@/components/GlassCard";
import { 
  Brain, 
  CheckCircle2, 
  DollarSign, 
  Headphones, 
  Lightbulb, 
  TrendingUp 
} from 'lucide-react';
import { useI18n } from "@/i18n/i18n";

/**
 * Benefits Section - CV Solution
 * Why choose CV Solution
 * Design: Icon cards with benefits
 */
export default function BenefitsSection() {
    const { t } = useI18n();
  const benefits = t("benefits.cards") as { title: string; description: string }[];
  const icons = [Brain, CheckCircle2, DollarSign, Headphones, Lightbulb, TrendingUp];

  return (
    <section className="py-20 bg-transparent">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl font-bold text-primary mb-4"
            style={{ fontFamily: 'Playfair Display' }}
          >
            {t("benefits.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("benefits.subtitle")}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="card-stage grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = icons[index];
            return (
              <GlassCard
                key={index}
                className="p-8"
              >
                <div className="mb-4">
                  <Icon className="w-10 h-10 text-primary" />
                </div>
                <h3 
                  className="text-xl font-bold text-primary mb-3"
                  style={{ fontFamily: 'Poppins' }}
                >
                  {benefit.title}
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  {benefit.description}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
