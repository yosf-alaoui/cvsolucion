import { Suspense, lazy, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, MessageCircle, Send } from "lucide-react";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { getBookingHref } from "@/lib/site";
import { navigateToHomeSection } from "@/lib/sectionNavigation";

const HeroFiberGlow = lazy(() => import("@/components/HeroFiberGlow"));

export default function HeroSection() {
  const { locale, t } = useI18n();
  const [showFiberGlow, setShowFiberGlow] = useState(false);
  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", t("whatsapp.needHelp"));
  const bookingHref = getBookingHref(locale);
  const bookLabel =
    locale === "ar" ? "احجز استشارة" : locale === "fr" ? "Reserver une consultation" : "Book consultation";
  const contactLabel =
    locale === "ar" ? "أرسل طلباً" : locale === "fr" ? "Envoyer une demande" : "Send a request";

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wideViewport = window.innerWidth >= 1280;

    if (!finePointer || reduceMotion || !wideViewport) {
      return;
    }

    let idleHandle = 0;
    const requestIdle = window.requestIdleCallback?.bind(window);
    const cancelIdle = window.cancelIdleCallback?.bind(window);
    const fallbackTimer = window.setTimeout(() => setShowFiberGlow(true), 1800);

    if (requestIdle) {
      idleHandle = requestIdle(() => setShowFiberGlow(true), { timeout: 1800 });
    }

    return () => {
      window.clearTimeout(fallbackTimer);
      if (idleHandle && cancelIdle) {
        cancelIdle(idleHandle);
      }
    };
  }, []);

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-24 sm:pt-28">
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

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/66 via-slate-950/44 to-slate-950/52 sm:from-black/52 sm:via-black/36 sm:to-black/42" />

      {showFiberGlow ? (
        <Suspense fallback={null}>
          <HeroFiberGlow
            className="absolute inset-0 z-[1] hidden h-full w-full opacity-65 mix-blend-screen xl:block"
            style={{
              maskImage:
                "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 34%, rgba(0,0,0,0.3) 54%, rgba(0,0,0,0) 70%)",
              WebkitMaskImage:
                "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 34%, rgba(0,0,0,0.3) 54%, rgba(0,0,0,0) 70%)",
            }}
          />
        </Suspense>
      ) : null}

      <div className="container relative z-10 mx-auto px-4 py-16 text-center sm:py-20">
        <div className="relative mx-auto max-w-4xl animate-fade-in px-0 py-4 sm:px-6 sm:py-8">
          <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0)_46%)] blur-md sm:rounded-[40px] sm:blur-2xl" />
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[30px] border border-white/20 bg-[linear-gradient(180deg,rgba(11,18,35,0.66)_0%,rgba(15,23,42,0.54)_48%,rgba(15,23,42,0.42)_100%)] px-5 py-7 shadow-[0_18px_42px_rgba(0,0,0,0.28)] ring-1 ring-white/12 sm:rounded-[38px] sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.06)_100%)] sm:px-10 sm:py-10 sm:shadow-[0_26px_70px_rgba(0,0,0,0.24)] sm:ring-white/16 sm:backdrop-blur-[18px] sm:backdrop-saturate-140">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(10,22,48,0.26),rgba(10,22,48,0)_62%)] sm:bg-[radial-gradient(circle_at_50%_30%,rgba(10,22,48,0.18),rgba(10,22,48,0)_62%)]" />
            <div className="absolute inset-x-10 top-4 hidden h-24 rounded-full bg-white/18 blur-3xl sm:block" />
            <div className="absolute inset-x-16 bottom-5 hidden h-20 rounded-full bg-primary/18 blur-3xl sm:block" />
            <div className="absolute inset-x-0 top-0 h-px bg-white/42" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-white/12" />
            <div className="absolute inset-y-6 left-0 w-px bg-white/12" />
            <div className="absolute inset-y-6 right-0 w-px bg-white/12" />

            <div className="relative">
              <h1
                className="mb-5 text-balance whitespace-pre-line text-[clamp(2.3rem,8vw,4.2rem)] font-bold leading-[1.08] text-white drop-shadow-[0_18px_38px_rgba(0,0,0,0.88)]"
                style={{ fontFamily: "Playfair Display" }}
              >
                {t("hero.title")}
              </h1>

              <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-white/92 drop-shadow-[0_12px_26px_rgba(0,0,0,0.8)] sm:text-lg sm:leading-relaxed md:text-xl">
                {t("hero.subtitle")}
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full gap-2 bg-green-500 font-semibold text-white hover:bg-green-600 sm:w-auto">
                    <MessageCircle className="h-5 w-5" />
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
                    className="w-full gap-2 border-white/35 bg-white/12 font-semibold text-white hover:bg-white/18 sm:w-auto sm:backdrop-blur-md"
                  >
                    <CalendarDays className="h-5 w-5" />
                    {bookLabel}
                  </Button>
                </a>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 border-white/35 bg-white/12 font-semibold text-white hover:bg-white/18 sm:w-auto sm:backdrop-blur-md"
                  onClick={() => navigateToHomeSection(locale, "contact")}
                >
                  <Send className="h-5 w-5" />
                  {contactLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-bounce sm:block">
        <div className="text-sm text-white/60">{t("hero.scroll")}</div>
      </div>
    </section>
  );
}
