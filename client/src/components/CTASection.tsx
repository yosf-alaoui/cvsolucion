import { Button } from '@/components/ui/button';
import { CalendarDays, Mail, MessageCircle, Send } from 'lucide-react';
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { CONTACT_EMAIL, getBookingHref } from "@/lib/site";
import { navigateToHomeSection } from "@/lib/sectionNavigation";

/**
 * CTA Section - CVsolucion
 * Final call-to-action section
 * Design: Large background image with overlay and CTAs
 */
export default function CTASection() {
  const { locale, t } = useI18n();
  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", t("whatsapp.annualPlan"));
  const bookingHref = getBookingHref(locale);
  const bookLabel = locale === "ar" ? "احجز استشارة" : locale === "fr" ? "Reserver une consultation" : "Book consultation";
  const contactLabel = locale === "ar" ? "نموذج التواصل" : locale === "fr" ? "Formulaire de contact" : "Contact form";

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Image */}
      <picture className="absolute inset-0">
        <source srcSet="/images/consultation-bg.webp" type="image/webp" />
        <img
          src="/images/consultation-bg.jpg"
          alt=""
          aria-hidden="true"
          width={1600}
          height={893}
          loading="lazy"
          fetchPriority="low"
          decoding="async"
          className="h-full w-full object-cover object-center"
        />
      </picture>
      
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
            href={bookingHref}
            target={bookingHref.startsWith("http") ? "_blank" : undefined}
            rel={bookingHref.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 font-semibold gap-2 w-full sm:w-auto"
            >
              <CalendarDays className="w-5 h-5" />
              {bookLabel}
            </Button>
          </a>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10 font-semibold gap-2 w-full sm:w-auto"
            onClick={() => navigateToHomeSection(locale, "contact")}
          >
            <Send className="w-5 h-5" />
            {contactLabel}
          </Button>
          <a 
            href={`mailto:${CONTACT_EMAIL}`}
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
