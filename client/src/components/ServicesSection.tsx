import GlassCard from "@/components/GlassCard";
import {
  Check,
  Code2,
  Cpu,
  HardDriveDownload,
  Headset,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { HOME_SERVICE_SEO_TARGETS } from "@shared/seoServicePages";

/**
 * Services Section - CVsolucion (Upgraded)
 * - Keeps Model 2 structure (section component)
 * - Shows what is included for each service
 * - No "Learn more" clear and scannable
 */
export default function ServicesSection() {
  const { locale, t } = useI18n();
  const services = t("services.cards") as {
    title: string;
    description: string;
    included: string[];
  }[];
  const icons = [Shield, Headset, HardDriveDownload, Zap, Code2, Cpu, Settings];
  const exploreLabel =
    locale === "ar" ? "تفاصيل الخدمة" : locale === "fr" ? "Voir la page" : "View service page";

  const localizePath = (path: string) => {
    if (locale === "fr") return `/fr${path}`;
    if (locale === "ar") return `/ar${path}`;
    return path;
  };

  return (
    <section id="services" className="scroll-mt-28 bg-transparent py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-4xl font-bold text-primary">{t("services.title")}</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t("services.subtitle")}
          </p>
        </div>

        <div className="card-stage grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = icons[index];
            const serviceHref = HOME_SERVICE_SEO_TARGETS[index]
              ? localizePath(HOME_SERVICE_SEO_TARGETS[index])
              : undefined;
            return (
              <GlassCard key={service.title} className="p-7">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-primary">
                      {serviceHref ? (
                        <a href={serviceHref} className="transition-colors hover:text-primary/80">
                          {service.title}
                        </a>
                      ) : (
                        service.title
                      )}
                    </h3>
                    <p className="mt-2 leading-relaxed text-foreground/80">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {t("services.includedLabel")}
                  </div>
                  <ul className="card-list mt-3 text-sm">
                    {service.included.map((item) => (
                      <li key={item} className="card-list-item">
                        <span className="card-list-icon">
                          <Check />
                        </span>
                        <span className="card-list-text leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                  {serviceHref ? (
                    <a
                      href={serviceHref}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      {exploreLabel}
                    </a>
                  ) : null}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
