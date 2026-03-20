import { Card } from '@/components/ui/card';
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
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = icons[index];
            return (
              <Card 
                key={index}
                className="p-8 hover:shadow-lg hover:border-primary transition-all duration-300 border-border bg-white"
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
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
