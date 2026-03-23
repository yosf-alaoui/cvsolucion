import { Button } from "@/components/ui/button";
import { CalendarDays, MessageCircle, Send } from "lucide-react";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { getBookingHref } from "@/lib/site";

/**
 * Hero Section - CV Solution
 * Modern professional hero with background image
 * Design: Large Playfair Display heading, clear CTAs
 */
export default function HeroSection() {
  const { locale, t } = useI18n();
  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", t("whatsapp.needHelp"));
  const bookingHref = getBookingHref();
  const contactHref = `${locale === "en" ? "/" : `/${locale}`}#contact`;
  const bookLabel = locale === "ar" ? "احجز استشارة" : locale === "fr" ? "Reserver une consultation" : "Book consultation";
  const contactLabel = locale === "ar" ? "أرسل طلباً" : locale === "fr" ? "Envoyer une demande" : "Send a request";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/images/Header-CVsolucion.png')] bg-cover bg-center bg-no-repeat bg-scroll md:bg-fixed" />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto animate-fade-in">
          {/* Main Heading */}
          <h1 
            className="whitespace-pre-line text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: 'Playfair Display' }}
          >
            {t("hero.title")}
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto">
            {t("hero.subtitle")}
          </p>

          {/* Statistics Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 inline-block border border-white/20">
            <div className="text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display' }}>
              500+
            </div>
            <p className="text-white/80 mt-2">{t("hero.statsLabel")}</p>
          </div>

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
                {t("hero.ctaWhatsapp")}
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
                className="border-white/35 bg-white/10 text-white backdrop-blur-md hover:bg-white/15 font-semibold gap-2 w-full sm:w-auto"
              >
                <CalendarDays className="w-5 h-5" />
                {bookLabel}
              </Button>
            </a>
            <a href={contactHref}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/35 bg-white/10 text-white backdrop-blur-md hover:bg-white/15 font-semibold gap-2 w-full sm:w-auto"
              >
                <Send className="w-5 h-5" />
                {contactLabel}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="text-white/60 text-sm">{t("hero.scroll")}</div>
      </div>
    </section>
  );
}
