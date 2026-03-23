import { Suspense, lazy, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { useI18n } from "@/i18n/i18n";

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

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const timeout = window.setTimeout(scrollToHash, 0);
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", scrollToHash);
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

        <Suspense fallback={<HomeSectionsFallback />}>
          <HomeContentSections />
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
