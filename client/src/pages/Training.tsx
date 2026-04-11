import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, MessageCircle, Sparkles } from "lucide-react";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { TRAINING_SEO_CONTENT, type TrainingSeoLocale } from "@shared/trainingSeoContent";

function localizePath(locale: TrainingSeoLocale, path: string) {
  if (locale === "fr") return path === "/" ? "/fr" : `/fr${path}`;
  if (locale === "ar") return path === "/" ? "/ar" : `/ar${path}`;
  return path;
}

export default function Training() {
  const { t, locale } = useI18n();
  const [openPackage, setOpenPackage] = useState<number | null>(null);
  const seoLocale: TrainingSeoLocale = locale === "fr" || locale === "ar" ? locale : "en";
  const trainingSeo = TRAINING_SEO_CONTENT[seoLocale];

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
  const trainingStructuredData = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: trainingSeo.h1,
        serviceType: "Cabinet Vision Training",
        description: trainingSeo.metaDescription,
        provider: {
          "@type": "Organization",
          name: "CVsolucion",
          url: "https://cvsolucion.com",
        },
        areaServed: ["Canada", "United States"],
        url: `https://cvsolucion.com${localizePath(seoLocale, "/training")}`,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: trainingSeo.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
    [seoLocale, trainingSeo],
  );

  return (
    <div className="site-page min-h-screen flex flex-col bg-transparent">
      <Seo
        title={trainingSeo.seoTitle}
        description={trainingSeo.metaDescription}
        type="website"
        structuredData={trainingStructuredData}
      />
      <Header />

      <main className="flex-1 pt-28">
        <section className="pb-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="glass-card-strong relative overflow-hidden rounded-3xl px-3 sm:px-6">
              <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="relative p-8 md:p-12 lg:p-14 text-center">
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                    <Sparkles className="h-4 w-4" />
                    {t("trainingPage.title")}
                  </span>
                  {deliveryModes.map((mode) => (
                    <span key={mode} className="glass-chip rounded-full px-3 py-1 text-slate-600">
                      {mode}
                    </span>
                  ))}
                </div>

                <h1
                  className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-primary"
                  style={{ fontFamily: "Playfair Display" }}
                >
                  {trainingSeo.h1}
                </h1>

                <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
                  {trainingSeo.intro}
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
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className="text-2xl font-bold text-primary"
                style={{ fontFamily: "Playfair Display" }}
              >
                {trainingSeo.outcomesTitle}
              </h2>
            </div>
            <div className="card-stage mt-6 grid gap-6 md:grid-cols-3">
              {trainingSeo.outcomes.map((item) => (
                <GlassCard key={item.title} className="rounded-[28px] p-7">
                  <h3 className="text-xl font-bold text-primary">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.body}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2
              className="text-2xl font-bold text-primary text-center"
              style={{ fontFamily: "Playfair Display" }}
            >
              {t("trainingPage.tracksTitle")}
            </h2>

            <div className="card-stage mt-6 grid gap-6 md:grid-cols-3">
              {tracks.map((trk, idx) => (
                <GlassCard key={idx} className="rounded-[28px]">
                  <CardHeader>
                    <CardTitle className="text-xl text-center font-bold">{trk.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="card-list text-sm">
                      {(trk.bullets || []).map((b: string, j: number) => (
                        <li key={j} className="card-list-item">
                          <span className="card-list-icon">
                            <Check />
                          </span>
                          <span className="card-list-text">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2
              className="text-2xl font-bold text-primary text-center"
              style={{ fontFamily: "Playfair Display" }}
            >
              {trainingSeo.modulesTitle}
            </h2>
            <div className="card-stage mt-6 grid gap-6 md:grid-cols-3">
              {trainingSeo.modules.map((module) => (
                <GlassCard key={module.title} className="rounded-[28px] p-7">
                  <h3 className="text-xl font-bold text-primary">{module.title}</h3>
                  <ul className="card-list mt-5 text-sm">
                    {module.items.map((item) => (
                      <li key={item} className="card-list-item">
                        <span className="card-list-icon">
                          <Check />
                        </span>
                        <span className="card-list-text">{item}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2
              className="text-2xl font-bold text-primary text-center"
              style={{ fontFamily: "Playfair Display" }}
            >
              {t("trainingPage.packagesTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground text-center">{t("trainingPage.packagesSubtitle")}</p>
            <div className="card-stage mt-8 grid max-w-6xl mx-auto items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg: any, idx: number) => {
                const expanded = openPackage === idx;
                const pkgWhatsapp = buildWhatsAppLink("+1 438 807 8747", pkg.whatsappMessage || t("whatsapp.needHelp"));
                return (
                  <GlassCard
                    key={idx}
                    strong={pkg.highlight}
                    className="self-start rounded-[28px] p-8"
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
                      <ul className="card-list mt-4 text-sm">
                        {(pkg.preview || []).map((item: string, j: number) => (
                          <li key={j} className="card-list-item">
                            <span className="card-list-icon">
                              <Check />
                            </span>
                            <span className="card-list-text">{item}</span>
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
                          <ul className="card-list mt-2 text-sm">
                            {(pkg.skills || []).map((skill: string, j: number) => (
                              <li key={j} className="card-list-item">
                                <span className="card-list-icon">
                                  <Check />
                                </span>
                                <span className="card-list-text">{skill}</span>
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
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2
              className="text-2xl font-bold text-primary text-center"
              style={{ fontFamily: "Playfair Display" }}
            >
              {trainingSeo.processTitle}
            </h2>
            <div className="card-stage mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {trainingSeo.process.map((step) => (
                <GlassCard key={step.label} className="rounded-[28px] p-7">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {step.label}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{step.text}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2
              className="text-2xl font-bold text-primary text-center"
              style={{ fontFamily: "Playfair Display" }}
            >
              {trainingSeo.faqTitle}
            </h2>
            <div className="card-stage mx-auto mt-6 grid max-w-5xl gap-6 md:grid-cols-2">
              {trainingSeo.faq.map((item) => (
                <GlassCard key={item.question} className="rounded-[28px] p-7">
                  <h3 className="text-lg font-bold text-primary">{item.question}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2
              className="text-2xl font-bold text-primary text-center"
              style={{ fontFamily: "Playfair Display" }}
            >
              {trainingSeo.relatedTitle}
            </h2>
            <div className="card-stage mt-6 grid gap-6 md:grid-cols-3">
              {trainingSeo.related.map((item) => (
                <GlassCard key={item.href} className="rounded-[28px] p-7">
                  <h3 className="text-xl font-bold text-primary">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                  <a
                    href={localizePath(seoLocale, item.href)}
                    className="mt-6 inline-flex text-sm font-semibold text-primary hover:text-primary/80"
                  >
                    {item.title}
                  </a>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="card-stage grid gap-6 md:grid-cols-2">
              <GlassCard className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl">{t("trainingPage.formatTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="card-list text-sm">
                    {formatBullets.map((b: string, i: number) => (
                      <li key={i} className="card-list-item">
                        <span className="card-list-icon">
                          <Check />
                        </span>
                        <span className="card-list-text">{b}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </GlassCard>

              <GlassCard className="rounded-2xl">
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
              </GlassCard>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
