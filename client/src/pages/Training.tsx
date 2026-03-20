import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, MessageCircle, Sparkles } from "lucide-react";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";

export default function Training() {
  const { t, locale } = useI18n();
  const [openPackage, setOpenPackage] = useState<number | null>(null);

  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", t("whatsapp.needHelp"));

  const homeHref = locale === "en" ? "/" : `/${locale}`;
  const tracks = (t("trainingPage.tracks") as any[]) || [];
  const formatBullets = (t("trainingPage.formatBullets") as any[]) || [];
  const packages = (t("trainingPage.packages") as any[]) || [];
  const goalLabel = t("trainingPage.goalLabel") || "Goal";
  const skillsLabel = t("trainingPage.skillsLabel") || "Skills you gain";
  const deliverableLabel = t("trainingPage.deliverableLabel") || "Deliverable";
  const showMoreLabel = t("trainingPage.showMore") || "Show details";
  const showLessLabel = t("trainingPage.showLess") || "Hide details";
  const deliveryModes = (t("trainingPage.deliveryModes") as string[]) || [];

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
                    <Sparkles className="h-4 w-4" />
                    {t("trainingPage.title")}
                  </span>
                  {deliveryModes.map((mode) => (
                    <span key={mode} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      {mode}
                    </span>
                  ))}
                </div>

                <h1
                  className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-primary"
                  style={{ fontFamily: "Playfair Display" }}
                >
                  {t("trainingPage.title")}
                </h1>

                <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
                  {t("trainingPage.subtitle")}
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <Button className="rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold gap-2">
                      <MessageCircle className="w-5 h-5" />
                      {t("trainingPage.ctaButton")}
                    </Button>
                  </a>

                  <a href={homeHref} className="inline-flex">
                    <Button variant="outline" className="rounded-full font-semibold">
                      {t("trainingPage.backHome")}
                    </Button>
                  </a>
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
              {t("trainingPage.tracksTitle")}
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {tracks.map((trk, idx) => (
                <Card key={idx} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-center font-bold">{trk.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pr-5 pl-5 space-y-2 text-muted-foreground">
                      {(trk.bullets || []).map((b: string, j: number) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
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
              {t("trainingPage.packagesTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground text-center">{t("trainingPage.packagesSubtitle")}</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto items-start">
              {packages.map((pkg: any, idx: number) => {
                const expanded = openPackage === idx;
                const pkgWhatsapp = buildWhatsAppLink("+1 438 807 8747", pkg.whatsappMessage || t("whatsapp.needHelp"));
                return (
                  <Card
                    key={idx}
                    className={`self-start p-8 transition-all duration-300 ${
                      pkg.highlight
                        ? "border-primary shadow-lg scale-[1.02] bg-primary/5"
                        : "border-border hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] bg-white"
                    }`}
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-primary mb-1">{pkg.title}</h3>
                      <div className="text-sm text-muted-foreground">{pkg.subtitle}</div>
                      {pkg.duration ? (
                        <div className="text-muted-foreground mt-2">{pkg.duration}</div>
                      ) : null}
                    </div>

                    <div className="text-sm text-foreground/80">{pkg.summary}</div>
                    {(pkg.preview || []).length ? (
                      <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                        {(pkg.preview || []).map((item: string, j: number) => (
                          <li key={j} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {expanded ? (
                      <div className="mt-6 space-y-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-foreground">{goalLabel}</div>
                          <p className="mt-2">{pkg.goal}</p>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-foreground">{skillsLabel}</div>
                          <ul className="mt-2 space-y-2">
                            {(pkg.skills || []).map((skill: string, j: number) => (
                              <li key={j} className="flex items-start gap-2">
                                <Check className="mt-0.5 h-4 w-4 text-primary" />
                                <span>{skill}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-foreground">{deliverableLabel}</div>
                          <p className="mt-2">{pkg.deliverable}</p>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-6 space-y-4">
                      <button
                        type="button"
                        className="text-sm font-semibold text-primary hover:text-primary/80"
                        onClick={() => setOpenPackage(expanded ? null : idx)}
                      >
                        {expanded ? showLessLabel : showMoreLabel}
                      </button>

                      <a href={pkgWhatsapp} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold gap-2">
                          <MessageCircle className="w-5 h-5" />
                          {pkg.ctaLabel || t("trainingPage.packageCta")}
                        </Button>
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">{t("trainingPage.formatTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {formatBullets.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">{t("trainingPage.ctaTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t("trainingPage.ctaText")}</p>
                  <div className="mt-4">
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                      <Button className="rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold gap-2">
                        <MessageCircle className="w-5 h-5" />
                        {t("trainingPage.ctaButton")}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
