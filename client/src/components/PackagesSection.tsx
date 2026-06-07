import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { getPublicCatalog, type PublicCatalogPackage } from "@/lib/catalog";
import { getBookingHref } from "@/lib/site";

/**
 * Packages Section - CVsolucion (Upgraded)
 * Uses Model 1 package structure (Audit / Fix Day / Support Plan)
 */
export default function PackagesSection() {
  const { t, locale } = useI18n();
  const { user } = useAuth();

  type ServicePackage = {
    title: string;
    subtitle: string;
    duration: string;
    price?: string;
    highlight: boolean;
    bullets: string[];
  };

  const fallbackPackages = (t("packages.cards") as ServicePackage[]) || [];
  const [packages, setPackages] = useState<ServicePackage[]>(fallbackPackages);
  const loginHref = locale === "en" ? "/login" : `/${locale}/login`;
  const canSeePrice = Boolean(user?.emailVerifiedAt);

  function buildPackageBookingHref(pkg: ServicePackage, index: number) {
    const baseHref = getBookingHref(locale);
    const normalized = `${pkg.title} ${pkg.subtitle}`.toLowerCase();

    let serviceType: "consultation" | "support" = "consultation";
    let priority: "standard" | "express" = "standard";
    let packageKey = `package-${index + 1}`;

    if (normalized.includes("audit")) {
      serviceType = "consultation";
      packageKey = "audit";
    } else if (normalized.includes("fix")) {
      serviceType = "support";
      packageKey = "fix-day";
    } else if (normalized.includes("support") || pkg.highlight) {
      serviceType = "support";
      packageKey = "support-plan";
    } else if (index === 0) {
      serviceType = "support";
      packageKey = "support-plan";
    } else if (index === 2) {
      serviceType = "support";
      packageKey = "fix-day";
    }

    const params = new URLSearchParams({
      service: serviceType,
      priority,
      package: packageKey,
    });

    return `${baseHref}${baseHref.includes("?") ? "&" : "?"}${params.toString()}`;
  }

  useEffect(() => {
    setPackages(fallbackPackages);
  }, [locale, t]);

  useEffect(() => {
    getPublicCatalog(locale)
      .then((response) => {
        const mapped = response.servicePackages.map((pkg: PublicCatalogPackage) => ({
          title: pkg.title,
          subtitle: pkg.subtitle,
          duration: pkg.duration,
          price: pkg.priceLabel || undefined,
          highlight: pkg.highlight,
          bullets: pkg.bullets,
        }));
        if (mapped.length) {
          setPackages(mapped);
        }
      })
      .catch(() => {});
  }, [locale]);

  return (
    <section id="packages" className="scroll-mt-28 bg-transparent py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-4xl font-bold text-primary">{t("packages.title")}</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t("packages.subtitle")}
          </p>
        </div>

        <div className="card-stage mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <GlassCard key={pkg.title} strong={pkg.highlight} className="p-8">
              <div className="mb-6 text-center">
                <h3 className="mb-1 text-2xl font-bold text-primary">{pkg.title}</h3>
                <div className="text-sm text-muted-foreground">{pkg.subtitle}</div>

                {pkg.price ? (
                  canSeePrice ? (
                    <div className="mt-3 text-3xl font-bold text-primary">{pkg.price}</div>
                  ) : (
                    <a
                      href={loginHref}
                      rel="nofollow"
                      className="mt-3 inline-flex text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      {t("packages.priceHidden")}
                    </a>
                  )
                ) : null}

                <div className="text-muted-foreground">{pkg.duration}</div>
              </div>

              <ul className="card-list mb-8">
                {pkg.bullets.map((feature) => (
                  <li key={feature} className="card-list-item">
                    <span className="card-list-icon">
                      <Check />
                    </span>
                    <span className="card-list-text">{feature}</span>
                  </li>
                ))}
              </ul>

              <a href={buildPackageBookingHref(pkg, index)}>
                <Button
                  className={`w-full ${
                    pkg.highlight
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-secondary text-primary hover:bg-secondary/90"
                  }`}
                >
                  {t("packages.cta")}
                </Button>
              </a>
            </GlassCard>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">{t("packages.note")}</p>
      </div>
    </section>
  );
}
