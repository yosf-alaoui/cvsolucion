import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Check,
  ClipboardList,
  Factory,
  FileText,
  Layers,
  Package,
  Ruler,
  Settings,
} from "lucide-react";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";

export default function DesignPricing() {
  const { t } = useI18n();
  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", t("whatsapp.needHelp"));

  const scope = (t("designPricingPage.scopeItems") as string[]) || [];
  const designIncludes = (t("designPricingPage.designIncludes") as string[]) || [];
  const pricingIncludes = (t("designPricingPage.pricingIncludes") as string[]) || [];
  const deliverables = (t("designPricingPage.deliverables") as string[]) || [];
  const compatibility = (t("designPricingPage.compatibility") as string[]) || [];
  const accuracy = (t("designPricingPage.accuracy") as string[]) || [];
  const whoFor = (t("designPricingPage.whoFor") as string[]) || [];
  const workflow = (t("designPricingPage.workflow") as string[]) || [];
  const requirements = (t("designPricingPage.requirements") as string[]) || [];

  const infoBlocks = [
    {
      title: t("designPricingPage.designTitle"),
      icon: Layers,
      items: designIncludes,
    },
    {
      title: t("designPricingPage.pricingTitle"),
      icon: Calculator,
      items: pricingIncludes,
    },
  ];

  const detailBlocks = [
    {
      title: t("designPricingPage.deliverablesTitle"),
      icon: FileText,
      items: deliverables,
    },
    {
      title: t("designPricingPage.compatibilityTitle"),
      icon: Settings,
      items: compatibility,
    },
    {
      title: t("designPricingPage.accuracyTitle"),
      icon: ClipboardList,
      items: accuracy,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 pt-28">
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg px-3 sm:px-6">
              <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="relative p-8 md:p-12 lg:p-14 text-center">
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                    <Factory className="h-4 w-4" />
                    {t("designPricingPage.badge")}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {t("designPricingPage.remote")}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {t("designPricingPage.factoryReady")}
                  </span>
                </div>

                <h1
                  className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-primary"
                  style={{ fontFamily: "Playfair Display" }}
                >
                  {t("designPricingPage.title")}
                </h1>

                <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
                  {t("designPricingPage.subtitle")}
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <Button className="rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold gap-2">
                      {t("designPricingPage.cta")}
                    </Button>
                  </a>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                    <Ruler className="h-4 w-4 text-primary" />
                    {t("designPricingPage.note")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="container mx-auto px-4">
            <h2
              className="text-2xl font-bold text-primary text-center"
              style={{ fontFamily: "Playfair Display" }}
            >
              {t("designPricingPage.scopeTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground text-center max-w-3xl mx-auto">
              {t("designPricingPage.scopeSubtitle")}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {scope.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2">
              {infoBlocks.map((block) => (
                <div key={block.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <block.icon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{block.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="container mx-auto px-4">
            <h2
              className="text-2xl font-bold text-primary text-center"
              style={{ fontFamily: "Playfair Display" }}
            >
              {t("designPricingPage.detailsTitle")}
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {detailBlocks.map((block) => (
                <div key={block.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <block.icon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{block.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t("designPricingPage.whoForTitle")}</h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {whoFor.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t("designPricingPage.requirementsTitle")}</h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {requirements.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="container mx-auto px-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <Package className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-bold text-primary">
                  {t("designPricingPage.workflowTitle")}
                </h3>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {workflow.map((step, index) => (
                  <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="text-sm font-semibold text-primary">
                      {t("designPricingPage.stepLabel")} {index + 1}
                    </div>
                    <div className="mt-2 text-sm text-slate-700">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center shadow-sm">
              <h3 className="text-2xl font-bold text-primary" style={{ fontFamily: "Playfair Display" }}>
                {t("designPricingPage.finalTitle")}
              </h3>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                {t("designPricingPage.finalSubtitle")}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <Button className="rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold gap-2">
                    {t("designPricingPage.cta")}
                  </Button>
                </a>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                  <FileText className="h-4 w-4 text-primary" />
                  {t("designPricingPage.deliveryNote")}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
