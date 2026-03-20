import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Packages Section - CV Solution (Upgraded)
 * Uses Model 1 package structure (Audit / Fix Day / Support Plan)
 */
export default function PackagesSection() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", t("whatsapp.annualPlan"));
  type ServicePackage = {
    title: string;
    subtitle: string;
    duration: string;
    price?: string;
    highlight: boolean;
    bullets: string[];
  };

  const packages = t("packages.cards") as ServicePackage[];
  const loginHref = locale === "en" ? "/login" : `/${locale}/login`;
  const canSeePrice = Boolean(user?.emailVerifiedAt);

  return (
    <section id="packages" className="py-20 bg-white scroll-mt-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-primary mb-4">{t("packages.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("packages.subtitle")}
          </p>
        </div>

        {/* 3 cards should sit on one row on desktop (no 2+1 layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <Card
              key={pkg.title}
              className={`p-8 transition-all duration-300 ${
                pkg.highlight
                  ? "border-primary shadow-lg scale-[1.02] bg-primary/5"
                  : "border-border hover:shadow-md bg-white"
              }`}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-primary mb-1">{pkg.title}</h3>
                <div className="text-sm text-muted-foreground">{pkg.subtitle}</div>

                {pkg.price ? (
                  canSeePrice ? (
                    <div className="text-3xl font-bold text-primary mt-3">{pkg.price}</div>
                  ) : (
                    <a
                      href={loginHref}
                      className="inline-flex mt-3 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      {t("packages.priceHidden")}
                    </a>
                  )
                ) : null}
                <div className="text-muted-foreground">{pkg.duration}</div>
              </div>

              <ul className="space-y-3 mb-8">
                {pkg.bullets.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="p-1 bg-primary/10 rounded-full mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <Button
                className={`w-full ${
                  pkg.highlight ? "bg-primary hover:bg-primary/90" : "bg-secondary hover:bg-secondary/90 text-primary"
                }`}
                >
                  {t("packages.cta")}
                </Button>
              </a>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          {t("packages.note")}</p>
      </div>
    </section>
  );
}
