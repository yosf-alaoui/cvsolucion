import { useState } from 'react';
import GlassCard from "@/components/GlassCard";
import { ChevronDown } from 'lucide-react';
import { useI18n } from "@/i18n/i18n";

/**
 * FAQ Section - CVsolucion
 * Frequently asked questions with accordion
 * Design: Accordion cards with smooth transitions
 */
export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

    const { t } = useI18n();
  const faqs = t("faq.items") as { question: string; answer: string }[];

  return (
    <section id="faq" className="py-20 bg-transparent scroll-mt-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
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
        <div className="card-stage mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <GlassCard
              key={index}
              className="overflow-hidden rounded-2xl"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/25 transition-colors"
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
                <div className="border-t border-white/20 bg-white/18 px-6 py-4">
                  <p className="text-foreground/80 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
