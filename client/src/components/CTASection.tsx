import { Button } from '@/components/ui/button';
import { MessageCircle, Mail } from 'lucide-react';
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";

/**
 * CTA Section - CV Solution
 * Final call-to-action section
 * Design: Large background image with overlay and CTAs
 */
export default function CTASection() {
  const { t } = useI18n();
  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", t("whatsapp.annualPlan"));

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/images/consultation-bg.jpg')] bg-cover bg-center bg-no-repeat bg-scroll md:bg-fixed" />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16 text-center">
        <h2 
          className="text-4xl md:text-5xl font-bold text-white mb-4"
          style={{ fontFamily: 'Playfair Display' }}
        >
          {t("cta.title")}
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          {t("cta.subtitle")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold gap-2 w-full sm:w-auto"
            >
              <MessageCircle className="w-5 h-5" />
              {t("cta.whatsapp")}
            </Button>
          </a>
          <a 
            href="mailto:contact@cvsolucion.com"
          >
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 font-semibold gap-2 w-full sm:w-auto"
            >
              <Mail className="w-5 h-5" />
              {t("cta.email")}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
