import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';
import { useI18n } from "@/i18n/i18n";

/**
 * FAQ Section - CV Solution
 * Frequently asked questions with accordion
 * Design: Accordion cards with smooth transitions
 */
export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

    const { t } = useI18n();
  const faqs = t("faq.items") as { question: string; answer: string }[];

  return (
    <section id="faq" className="py-20 bg-white scroll-mt-28">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl font-bold text-primary mb-4"
            style={{ fontFamily: 'Playfair Display' }}
          >
            {t("faq.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("faq.subtitle")}</p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card 
              key={index}
              className="border-border overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <h3 
                  className="text-lg font-semibold text-foreground text-left"
                  style={{ fontFamily: 'Poppins' }}
                >
                  {faq.question}
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Answer */}
              {openIndex === index && (
                <div className="px-6 py-4 bg-secondary/20 border-t border-border">
                  <p className="text-foreground/80 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
