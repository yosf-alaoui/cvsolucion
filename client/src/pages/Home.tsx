import { useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProblemsSection from "@/components/ProblemsSection";
import ServicesSection from "@/components/ServicesSection";
import PackagesSection from "@/components/PackagesSection";
import BenefitsSection from "@/components/BenefitsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { useI18n } from "@/i18n/i18n";

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
      ? window.location.href
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

        {/* Problems Section */}
        <ProblemsSection />

        {/* Services Section */}
        <ServicesSection />

        {/* Packages Section */}
        <PackagesSection />

        {/* Social Proof Section */}
        <TestimonialsSection />

        {/* Benefits Section */}
        <BenefitsSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Contact Section */}
        <ContactSection />

        {/* CTA Section */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
