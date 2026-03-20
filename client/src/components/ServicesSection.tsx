import { Card } from "@/components/ui/card";
import {
  Shield,
  Headset,
  Zap,
  Code2,
  Cpu,
  Settings,
  HardDriveDownload,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";

/**
 * Services Section - CV Solution (Upgraded)
 * - Keeps Model 2 structure (section component)
 * - Shows what is included for each service
 * - No "Learn more" — clear and scannable
 */
export default function ServicesSection() {
    const { t } = useI18n();
  const services = t("services.cards") as { title: string; description: string; included: string[] }[];
  const icons = [Shield, Headset, HardDriveDownload, Zap, Code2, Cpu, Settings];

return (
    <section id="services" className="py-20 bg-secondary/20 scroll-mt-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-primary mb-4">{t("services.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("services.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, index) => {
            const Icon = icons[index];
            return (
              <Card key={s.title} className="p-7 bg-white border-border hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-primary">{s.title}</h3>
                    <p className="mt-2 text-foreground/80 leading-relaxed">{s.description}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground">{t("services.includedLabel")}</div>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                    {s.included.map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
