import { Suspense, lazy, useEffect, useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { useI18n } from "@/i18n/i18n";
import { clearPendingHomeSection, readPendingHomeSection } from "@/lib/sectionNavigation";

const HomeContentSections = lazy(() => import("@/components/HomeContentSections"));

function HomeSectionsFallback() {
  return <div className="min-h-[60vh]" aria-hidden="true" />;
}

/**
 * Home Page - CV Solution
 * Main landing page with all sections
 * Design: Modern professional layout with smooth scrolling
 */
export default function Home() {
  const { locale, t } = useI18n();
  const [showSections, setShowSections] = useState(false);

  useEffect(() => {
    const scrollToPendingTarget = () => {
      const targetId = readPendingHomeSection() || window.location.hash.slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        clearPendingHomeSection();
        if (window.location.hash) {
          window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
        }
      }
    };

    const timeout = window.setTimeout(scrollToPendingTarget, 0);
    window.addEventListener("hashchange", scrollToPendingTarget);
    window.addEventListener("cvsolucion:scroll-home-section", scrollToPendingTarget as EventListener);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", scrollToPendingTarget);
      window.removeEventListener("cvsolucion:scroll-home-section", scrollToPendingTarget as EventListener);
    };
  }, [showSections]);

  useEffect(() => {
    let idleHandle = 0;
    let fallbackTimer = 0;

    const show = () => setShowSections(true);
    const events: Array<keyof WindowEventMap> = ["scroll", "pointerdown", "keydown", "touchstart"];
    const onInteraction = () => {
      setShowSections(true);
      events.forEach((eventName) => window.removeEventListener(eventName, onInteraction));
    };

    const requestIdle = window.requestIdleCallback?.bind(window);
    const cancelIdle = window.cancelIdleCallback?.bind(window);

    if (requestIdle) {
      idleHandle = requestIdle(() => setShowSections(true), { timeout: 2500 });
    } else {
      fallbackTimer = window.setTimeout(show, 2500);
    }

    events.forEach((eventName) =>
      window.addEventListener(eventName, onInteraction, { passive: true, once: true }),
    );

    return () => {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
      if (idleHandle && cancelIdle) {
        cancelIdle(idleHandle);
      }
      events.forEach((eventName) => window.removeEventListener(eventName, onInteraction));
    };
  }, []);

  const homeUrl =
    typeof window !== "undefined"
      ? (() => {
          const url = new URL(window.location.href);
          url.hash = "";
          url.search = "";
          return url.toString();
        })()
      : locale === "en"
        ? "https://cvsolucion.com"
        : `https://cvsolucion.com/${locale}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "CVsolucion",
    url: homeUrl,
    description: t("meta.description"),
    areaServed: ["Canada", "United States"],
    serviceType: ["Cabinet Vision Consulting", "Cabinet Vision Training", "Cabinet Vision Support"],
  };

  return (
    <div className="site-page min-h-screen flex flex-col bg-transparent">
      <Seo
        title={t("meta.title")}
        description={t("meta.description")}
        type="website"
        structuredData={structuredData}
      />
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {showSections ? (
          <Suspense fallback={<HomeSectionsFallback />}>
            <HomeContentSections />
          </Suspense>
        ) : (
          <HomeSectionsFallback />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
