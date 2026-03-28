import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, ShieldCheck, ShoppingCart, Zap } from "lucide-react";
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

export default function Booking() {
  const { locale } = useI18n();
  const [priority, setPriority] = useState<BookingPriority>("standard");
  const [serviceType, setServiceType] = useState<BookingServiceType>("consultation");
  const [days, setDays] = useState<BookingAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<BookingAvailabilitySlot[]>([]);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "اختر موعد الحجز",
        subtitle: "اختر الخدمة والموعد أولاً، ثم انتقل إلى صفحة الدفع والتأكيد.",
        standardTitle: "حجز عادي",
        standardText: "للاستشارة أو الدعم خلال ساعات العمل العادية.",
        expressTitle: "Express Priority",
        expressText: "أولوية أعلى مع تكلفة إضافية، لليوم والغد فقط.",
        consultation: "استشارة",
        support: "دعم",
        timezone: "جميع المواعيد حسب توقيت كيبيك، كندا",
        lunch: "توقف يومي: 12:00 - 13:00",
        booked: "محجوز",
        available: "متاح",
        summary: "سلة الحجز",
        summaryEmpty: "اختر موعداً واحداً أو أكثر قبل المتابعة.",
        loading: "جارٍ تحميل المواعيد...",
        continueCheckout: "المتابعة إلى الدفع",
        chooseSlot: "اختر موعداً صالحاً أولاً.",
        tooManySlots: "يمكن اختيار حتى 3 مواعيد فقط.",
        primarySlot: "الموعد الأساسي",
        option: "خيار",
        seoTitle: "حجز موعد | CVsolucion",
      };
    }
    if (locale === "fr") {
      return {
        title: "Choisir un booking",
        subtitle: "Choisissez d'abord le service et l'horaire, puis passez au checkout et au paiement.",
        standardTitle: "Booking standard",
        standardText: "Pour consultation ou support pendant les heures normales.",
        expressTitle: "Express Priority",
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
        continueCheckout: "Continuer vers le checkout",
        chooseSlot: "Choisissez d'abord un horaire valide.",
        tooManySlots: "Vous pouvez choisir jusqu'a 3 horaires seulement.",
        primarySlot: "Horaire principal",
        option: "Option",
        seoTitle: "Reserver un booking | CVsolucion",
      };
    }
    return {
      title: "Choose your booking",
      subtitle: "Pick the service and time first, then continue to checkout and payment.",
      standardTitle: "Standard booking",
      standardText: "For consultation or support during normal business hours.",
      expressTitle: "Express Priority",
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
      continueCheckout: "Continue to checkout",
      chooseSlot: "Choose a valid slot first.",
      tooManySlots: "You can choose up to 3 time slots only.",
      primarySlot: "Primary slot",
      option: "Option",
      seoTitle: "Book an appointment | CVsolucion",
    };
  }, [locale]);

  useEffect(() => {
    setLoading(true);
    setSelectedSlots([]);
    setStatus(null);
    getBookingAvailability(priority)
      .then((response) => setDays(response.days))
      .catch((error: Error) => setStatus({ tone: "error", text: error.message }))
      .finally(() => setLoading(false));
  }, [priority]);

  const weeks = useMemo(() => chunkDays(days, priority === "express" ? 2 : 5), [days, priority]);
  const checkoutHref = locale === "en" ? "/book/checkout" : `/${locale}/book/checkout`;

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

  function continueToCheckout() {
    if (!selectedSlots.length) {
      setStatus({ tone: "error", text: copy.chooseSlot });
      return;
    }
    saveBookingCheckoutDraft({
      priority,
      serviceType,
      slots: selectedSlots.map((slot) => ({ id: slot.id, date: slot.date, hour: slot.hour })),
      createdAt: Date.now(),
    });
    window.location.href = checkoutHref;
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
              <Button type="button" variant="outline" className="mt-5 rounded-full border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => setPriority("express")}>
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
                  <Button type="button" variant={serviceType === "consultation" ? "default" : "outline"} className="rounded-full" onClick={() => setServiceType("consultation")}>
                    {copy.consultation}
                  </Button>
                  <Button type="button" variant={serviceType === "support" ? "default" : "outline"} className="rounded-full" onClick={() => setServiceType("support")}>
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
                                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">{booked ? copy.booked : copy.available}</span>
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
              <GlassCard className="card-static rounded-[32px] p-7">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-slate-950">{copy.summary}</h2>
                </div>
                {selectedSlots.length ? (
                  <div className="mt-5 space-y-4 text-slate-700">
                    {selectedSlots.map((slot, index) => (
                      <div key={slot.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {index === 0 ? copy.primarySlot : `${copy.option} ${index + 1}`}
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-primary" />
                          <span>{dateLabel(slot.date, locale)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <Clock3 className="h-5 w-5 text-primary" />
                          <span>{timeLabel(slot.hour, locale)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <ShieldCheck className={`h-5 w-5 ${priority === "express" ? "text-amber-500" : "text-primary"}`} />
                      <span>{priority === "express" ? copy.expressTitle : copy.standardTitle}</span>
                    </div>
                    <Button type="button" className="mt-2 w-full rounded-full bg-primary text-white hover:bg-primary/90" onClick={continueToCheckout}>
                      {copy.continueCheckout}
                    </Button>
                  </div>
                ) : (
                  <p className="mt-5 text-base leading-7 text-slate-600">{copy.summaryEmpty}</p>
                )}

                {status ? (
                  <div
                    className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                      status.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {status.text}
                  </div>
                ) : null}
              </GlassCard>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
