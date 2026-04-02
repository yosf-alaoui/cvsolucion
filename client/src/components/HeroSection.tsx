import { Button } from "@/components/ui/button";
import { CalendarDays, MessageCircle, Send } from "lucide-react";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { getBookingHref } from "@/lib/site";
import HeroFiberGlow from "@/components/HeroFiberGlow";

/**
 * Hero Section - CV Solution
 * Modern professional hero with background image
 * Design: Large Playfair Display heading, clear CTAs
 */
export default function HeroSection() {
  const { locale, t } = useI18n();
  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", t("whatsapp.needHelp"));
  const bookingHref = getBookingHref(locale);
  const contactHref = `${locale === "en" ? "/" : `/${locale}`}#contact`;
  const bookLabel = locale === "ar" ? "احجز استشارة" : locale === "fr" ? "Reserver une consultation" : "Book consultation";
  const contactLabel = locale === "ar" ? "أرسل طلباً" : locale === "fr" ? "Envoyer une demande" : "Send a request";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <picture className="absolute inset-0">
        <source srcSet="/images/Header-CVsolucion.webp" type="image/webp" />
        <img
          src="/images/Header-CVsolucion.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover object-center"
        />
      </picture>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/52 via-black/36 to-black/42" />

      {/* Fiber Glow Effect */}
      <HeroFiberGlow
        className="absolute inset-0 z-[1] h-full w-full opacity-65 mix-blend-screen"
        style={{
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 34%, rgba(0,0,0,0.3) 54%, rgba(0,0,0,0) 70%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 34%, rgba(0,0,0,0.3) 54%, rgba(0,0,0,0) 70%)",
        }}
      />

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        <div className="relative mx-auto max-w-4xl animate-fade-in px-4 py-6 sm:px-6 sm:py-8">
          <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),rgba(255,255,255,0)_46%)] blur-xl sm:blur-2xl" />
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[38px] border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.06)_100%)] px-6 py-8 shadow-[0_18px_42px_rgba(0,0,0,0.24)] ring-1 ring-white/16 backdrop-blur-[12px] backdrop-saturate-125 sm:px-10 sm:py-10 sm:shadow-[0_26px_70px_rgba(0,0,0,0.24)] sm:backdrop-blur-[22px] sm:backdrop-saturate-150">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(10,22,48,0.18),rgba(10,22,48,0)_62%)]" />
            <div className="absolute inset-x-10 top-4 hidden h-24 rounded-full bg-white/18 blur-3xl sm:block" />
            <div className="absolute inset-x-16 bottom-5 hidden h-20 rounded-full bg-primary/18 blur-3xl sm:block" />
            <div className="absolute inset-x-0 top-0 h-px bg-white/42" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-white/12" />
            <div className="absolute inset-y-6 left-0 w-px bg-white/12" />
            <div className="absolute inset-y-6 right-0 w-px bg-white/12" />
            <div className="relative">
          {/* Main Heading */}
          <h1 
            className="mb-6 whitespace-pre-line text-4xl font-bold leading-tight text-white drop-shadow-[0_18px_38px_rgba(0,0,0,0.88)] md:text-5xl"
            style={{ fontFamily: 'Playfair Display' }}
          >
            {t("hero.title")}
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/95 drop-shadow-[0_12px_26px_rgba(0,0,0,0.8)] md:text-xl">
            {t("hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
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
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="text-white/60 text-sm">{t("hero.scroll")}</div>
      </div>
    </section>
  );
}
