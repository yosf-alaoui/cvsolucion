import { useEffect, useMemo, useState } from "react";
import { Clock3, Zap } from "lucide-react";
import BookingCartSummary from "@/components/booking/BookingCartSummary";
import BookingFlowSteps from "@/components/booking/BookingFlowSteps";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n";
import {
  getBookingAvailability,
  type BookingAvailabilityDay,
  type BookingAvailabilitySlot,
  type BookingPriority,
  type BookingServiceType,
} from "@/lib/bookings";
import { saveBookingCheckoutDraft } from "@/lib/bookingCheckout";
import { getStripeBookingConfig, type StripeConfigResponse } from "@/lib/stripeBooking";

function isBookingPriority(value: string | null): value is BookingPriority {
  return value === "standard" || value === "express";
}

function isBookingServiceType(value: string | null): value is BookingServiceType {
  return value === "consultation" || value === "support";
}

function getInitialBookingFilters() {
  if (typeof window === "undefined") {
    return {
      priority: "standard" as BookingPriority,
      serviceType: "consultation" as BookingServiceType,
      packageKey: null as string | null,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const priority = params.get("priority");
  const serviceType = params.get("service");
  const packageKey = params.get("package");

  return {
    priority: isBookingPriority(priority) ? priority : ("standard" as BookingPriority),
    serviceType: isBookingServiceType(serviceType) ? serviceType : ("consultation" as BookingServiceType),
    packageKey: typeof packageKey === "string" && packageKey.trim() ? packageKey.trim() : null,
  };
}

function getPackageLabel(packageKey: string | null, locale: string) {
  if (!packageKey) return null;

  const labels = {
    en: { audit: "Audit", "fix-day": "Fix Day", "support-plan": "Annual Support Plan" },
    fr: { audit: "Audit", "fix-day": "Fix Day", "support-plan": "Plan de Support Annuel" },
    ar: { audit: "Audit", "fix-day": "Fix Day", "support-plan": "خطة الدعم السنوية" },
  } as const;

  const language = locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en";
  return labels[language][packageKey as keyof typeof labels.en] || packageKey;
}

function dateLabel(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

function timeLabel(hour: number, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(Date.UTC(2026, 0, 1, hour, 0, 0)));
}

function chunkDays(days: BookingAvailabilityDay[], size: number) {
  const chunks: BookingAvailabilityDay[][] = [];
  for (let index = 0; index < days.length; index += size) chunks.push(days.slice(index, index + size));
  return chunks;
}

function getCopy(locale: string) {
  if (locale === "ar") {
    return {
      title: "اختر موعد الحجز",
      subtitle: "اختر الخدمة والمواعيد، ثم راجع السلة قبل الدفع.",
      standardTitle: "حجز عادي",
      standardText: "للاستشارة أو الدعم خلال ساعات العمل العادية.",
      expressTitle: "أولوية إكسبريس",
      expressText: "أولوية أعلى مع تكلفة إضافية، متاحة لليوم والغد فقط.",
      consultation: "استشارة",
      support: "دعم",
      timezone: "جميع المواعيد حسب توقيت كيبيك، كندا",
      lunch: "توقف يومي: 12:00 - 13:00",
      booked: "محجوز",
      available: "متاح",
      summary: "سلة الحجز",
      summaryEmpty: "اختر موعداً واحداً أو أكثر قبل المتابعة.",
      loading: "جارٍ تحميل المواعيد...",
      reviewCart: "مراجعة السلة",
      chooseSlot: "اختر موعداً صالحاً أولاً.",
      tooManySlots: "يمكن اختيار حتى 3 مواعيد فقط.",
      service: "الخدمة",
      priority: "الأولوية",
      package: "الباقة",
      selectedPackage: "الباقة المختارة",
      seoTitle: "حجز موعد | CVsolucion",
      appointments: "الجلسات المختارة",
      invoice: "تفاصيل الفاتورة",
      remove: "إزالة",
      item: "جلسة",
      subtotal: "المجموع الفرعي",
      taxes: "الضرائب",
      total: "الإجمالي المستحق",
      note: "خدمة رقمية بدون شحن. كل موعد مختار يُحاسب كجلسة مستقلة.",
    };
  }
  if (locale === "fr") {
    return {
      title: "Choisir un booking",
      subtitle: "Choisissez le service et les horaires, puis revisez le panier avant le paiement.",
      standardTitle: "Booking standard",
      standardText: "Pour consultation ou support pendant les heures normales.",
      expressTitle: "Priorite express",
      expressText: "Priorite plus forte avec cout supplementaire, seulement aujourd'hui et demain.",
      consultation: "Consultation",
      support: "Support",
      timezone: "Tous les horaires sont en heure du Quebec, Canada",
      lunch: "Pause quotidienne : 12:00 - 13:00",
      booked: "Reserve",
      available: "Disponible",
      summary: "Panier du booking",
      summaryEmpty: "Choisissez un ou plusieurs horaires avant de continuer.",
      loading: "Chargement des horaires...",
      reviewCart: "Reviser le panier",
      chooseSlot: "Choisissez d'abord un horaire valide.",
      tooManySlots: "Vous pouvez choisir jusqu'a 3 horaires seulement.",
      service: "Service",
      priority: "Priorite",
      package: "Forfait",
      selectedPackage: "Forfait choisi",
      seoTitle: "Reserver un booking | CVsolucion",
      appointments: "Sessions choisies",
      invoice: "Facture",
      remove: "Retirer",
      item: "Session",
      subtotal: "Sous-total",
      taxes: "Taxes",
      total: "Total a payer",
      note: "Service numerique sans livraison. Chaque horaire choisi est facture comme une session separee.",
    };
  }
  return {
    title: "Choose your booking",
    subtitle: "Pick the service and sessions, then review your cart before payment.",
    standardTitle: "Standard booking",
    standardText: "For consultation or support during normal business hours.",
    expressTitle: "Express priority",
    expressText: "Higher priority with extra cost, available only today and tomorrow.",
    consultation: "Consultation",
    support: "Support",
    timezone: "All times are shown in Quebec, Canada time",
    lunch: "Daily pause: 12:00 - 13:00",
    booked: "Booked",
    available: "Available",
    summary: "Booking cart",
    summaryEmpty: "Choose one or more time slots before continuing.",
    loading: "Loading schedule...",
    reviewCart: "Review cart",
      chooseSlot: "Choose a valid slot first.",
      tooManySlots: "You can choose up to 3 time slots only.",
      service: "Service",
      priority: "Priority",
      package: "Package",
      selectedPackage: "Selected package",
      seoTitle: "Book an appointment | CVsolucion",
    appointments: "Selected sessions",
    invoice: "Invoice details",
    remove: "Remove",
    item: "Session",
    subtotal: "Subtotal",
    taxes: "Taxes",
    total: "Total due now",
    note: "Digital service with no shipping. Each selected appointment is billed as a separate session.",
  };
}

export default function Booking() {
  const { locale } = useI18n();
  const [priority, setPriority] = useState<BookingPriority>(() => getInitialBookingFilters().priority);
  const [serviceType, setServiceType] = useState<BookingServiceType>(() => getInitialBookingFilters().serviceType);
  const [packageKey] = useState<string | null>(() => getInitialBookingFilters().packageKey);
  const [days, setDays] = useState<BookingAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<BookingAvailabilitySlot[]>([]);
  const [stripeConfig, setStripeConfig] = useState<StripeConfigResponse | null>(null);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const copy = useMemo(() => getCopy(locale), [locale]);

  useEffect(() => {
    setLoading(true);
    setSelectedSlots([]);
    setStatus(null);
    getBookingAvailability(priority)
      .then((response) => setDays(response.days))
      .catch((error: Error) => setStatus({ tone: "error", text: error.message }))
      .finally(() => setLoading(false));
  }, [priority]);

  useEffect(() => {
    getStripeBookingConfig()
      .then((response) => setStripeConfig(response))
      .catch(() => setStripeConfig(null));
  }, []);

  const weeks = useMemo(() => chunkDays(days, priority === "express" ? 2 : 5), [days, priority]);
  const cartHref = locale === "en" ? "/book/cart" : `/${locale}/book/cart`;
  const priceKey = `${priority}:${serviceType}`;
  const unitAmount = stripeConfig?.prices?.[priceKey] ?? 0;
  const totalAmount = unitAmount * selectedSlots.length;
  const totalAmountLabel =
    totalAmount > 0
      ? new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
          style: "currency",
          currency: (stripeConfig?.currency || "usd").toUpperCase(),
        }).format(totalAmount / 100)
      : null;
  const serviceLabel = serviceType === "support" ? copy.support : copy.consultation;
  const priorityLabel = priority === "express" ? copy.expressTitle : copy.standardTitle;
  const packageLabel = useMemo(() => getPackageLabel(packageKey, locale), [locale, packageKey]);

  function toggleSlot(slot: BookingAvailabilitySlot) {
    setStatus(null);
    setSelectedSlots((current) => {
      const exists = current.some((item) => item.id === slot.id);
      if (exists) return current.filter((item) => item.id !== slot.id);
      if (current.length >= 3) {
        setStatus({ tone: "error", text: copy.tooManySlots });
        return current;
      }
      return [...current, slot];
    });
  }

  function continueToCart() {
    if (!selectedSlots.length) {
      setStatus({ tone: "error", text: copy.chooseSlot });
      return;
    }

    saveBookingCheckoutDraft({
      priority,
      serviceType,
      packageKey,
      slots: selectedSlots.map((slot) => ({ id: slot.id, date: slot.date, hour: slot.hour })),
      createdAt: Date.now(),
    });
    window.location.href = cartHref;
  }

  return (
    <div className="site-page min-h-screen bg-transparent">
      <Seo title={copy.seoTitle} description={copy.subtitle} type="website" />
      <Header />
      <main className="pt-32 pb-20">
        <section className="container">
          <div className="mx-auto max-w-4xl text-center">
            <span className="glass-chip inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              Quebec Schedule
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{copy.title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.subtitle}</p>
          </div>

          <BookingFlowSteps locale={locale} current="select" />

          <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
            <GlassCard className={`card-static rounded-[30px] p-6 ${priority === "standard" ? "ring-2 ring-primary/30" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">{copy.standardTitle}</h2>
                  <p className="mt-3 text-base leading-7 text-slate-600">{copy.standardText}</p>
                </div>
                <Clock3 className="h-6 w-6 text-primary" />
              </div>
              <Button type="button" className="mt-5 rounded-full" onClick={() => setPriority("standard")}>
                {copy.standardTitle}
              </Button>
            </GlassCard>

            <GlassCard className={`card-static rounded-[30px] p-6 ${priority === "express" ? "ring-2 ring-amber-400/40" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">{copy.expressTitle}</h2>
                  <p className="mt-3 text-base leading-7 text-slate-600">{copy.expressText}</p>
                </div>
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-5 rounded-full border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => setPriority("express")}
              >
                {copy.expressTitle}
              </Button>
            </GlassCard>
          </div>

          <div className="mx-auto mt-5 flex max-w-6xl flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
            <span className="glass-chip rounded-full px-4 py-2">{copy.timezone}</span>
            <span className="glass-chip rounded-full px-4 py-2">{copy.lunch}</span>
          </div>

          <div className="mx-auto mt-12 grid max-w-7xl gap-8 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6">
              <GlassCard className="card-static rounded-[32px] p-7">
                <div className="flex flex-wrap items-center gap-3">
                  {packageLabel ? (
                    <span className="glass-chip rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {copy.selectedPackage}: {packageLabel}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant={serviceType === "consultation" ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setServiceType("consultation")}
                  >
                    {copy.consultation}
                  </Button>
                  <Button
                    type="button"
                    variant={serviceType === "support" ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setServiceType("support")}
                  >
                    {copy.support}
                  </Button>
                </div>

                {loading ? (
                  <div className="mt-8 text-sm text-slate-500">{copy.loading}</div>
                ) : (
                  <div className="mt-8 space-y-8">
                    {weeks.map((week, weekIndex) => (
                      <div key={`week-${weekIndex}`} className={`grid gap-4 ${priority === "express" ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
                        {week.map((day) => (
                          <div key={day.date} className="rounded-[24px] border border-slate-200 bg-white/60 p-4">
                            <div className="text-sm font-semibold text-slate-500">{dateLabel(day.date, locale)}</div>
                            <div className="mt-4 grid gap-2">
                              {day.slots.map((slot) => {
                                const selected = selectedSlots.some((item) => item.id === slot.id);
                                const booked = slot.status === "booked";
                                return (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    disabled={booked}
                                    onClick={() => toggleSlot(slot)}
                                    className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition ${
                                      booked
                                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                        : selected
                                          ? "border-primary bg-primary/10 text-primary"
                                          : "border-slate-200 bg-white text-slate-700 hover:border-primary/35 hover:bg-primary/5"
                                    }`}
                                  >
                                    <span>{timeLabel(slot.hour, locale)}</span>
                                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                                      {booked ? copy.booked : copy.available}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            <div className="space-y-6">
              <BookingCartSummary
                draft={{
                  priority,
                  serviceType,
                  packageKey,
                  slots: selectedSlots.map((slot) => ({ id: slot.id, date: slot.date, hour: slot.hour })),
                  createdAt: Date.now(),
                }}
                locale={locale}
                currency={stripeConfig?.currency || "usd"}
                unitAmount={unitAmount}
                serviceLabel={serviceLabel}
                priorityLabel={priorityLabel}
                packageLabel={packageLabel}
                title={copy.summary}
                appointmentsLabel={copy.appointments}
                invoiceLabel={copy.invoice}
                emptyLabel={copy.summaryEmpty}
                serviceText={copy.service}
                priorityText={copy.priority}
                packageText={copy.package}
                subtotalText={copy.subtotal}
                taxText={copy.taxes}
                totalText={copy.total}
                removeText={copy.remove}
                itemLabel={copy.item}
                digitalNote={copy.note}
                actionLabel={selectedSlots.length ? (totalAmountLabel ? `${copy.reviewCart} • ${totalAmountLabel}` : copy.reviewCart) : undefined}
                actionDisabled={!selectedSlots.length}
                onAction={continueToCart}
                onRemoveSlot={(slotId) => setSelectedSlots((current) => current.filter((slot) => slot.id !== slotId))}
              />

              {status ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    status.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {status.text}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
