import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, ShieldCheck, Zap } from "lucide-react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  createBooking,
  getBookingAvailability,
  type BookingAvailabilityDay,
  type BookingAvailabilitySlot,
  type BookingPriority,
  type BookingServiceType,
} from "@/lib/bookings";
import { createBookingPaymentIntent, getStripeBookingConfig, type StripeConfigResponse } from "@/lib/stripeBooking";
import { useI18n } from "@/i18n/i18n";

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
  for (let index = 0; index < days.length; index += size) {
    chunks.push(days.slice(index, index + size));
  }
  return chunks;
}

function formatSlotSummary(date: string, hour: number) {
  return `${date} ${String(hour).padStart(2, "0")}:00`;
}

function BookingPaymentElement({
  clientSecret,
  publishableKey,
  locale,
  submitLabel,
  processingLabel,
  onConfirm,
}: {
  clientSecret: string;
  publishableKey: string;
  locale: string;
  submitLabel: string;
  processingLabel: string;
  onConfirm: (paymentIntentId: string) => Promise<void>;
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  const options = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
      },
    }),
    [clientSecret]
  );

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentInner locale={locale} submitLabel={submitLabel} processingLabel={processingLabel} onConfirm={onConfirm} />
    </Elements>
  );
}

function StripePaymentInner({
  locale,
  submitLabel,
  processingLabel,
  onConfirm,
}: {
  locale: string;
  submitLabel: string;
  processingLabel: string;
  onConfirm: (paymentIntentId: string) => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!stripe || !elements) return;
    setBusy(true);
    try {
      const submitResult = await elements.submit();
      if (submitResult.error) {
        throw new Error(submitResult.error.message || "Payment form is incomplete.");
      }

      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment confirmation failed.");
      }

      const paymentIntentId = result.paymentIntent?.id;
      if (!paymentIntentId) {
        throw new Error("Stripe did not return a payment intent.");
      }

      await onConfirm(paymentIntentId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button type="button" className="w-full rounded-full bg-primary text-white hover:bg-primary/90" disabled={!stripe || !elements || busy} onClick={handleSubmit}>
        {busy ? processingLabel : submitLabel}
      </Button>
    </div>
  );
}

export default function Booking() {
  const { locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [priority, setPriority] = useState<BookingPriority>("standard");
  const [serviceType, setServiceType] = useState<BookingServiceType>("consultation");
  const [days, setDays] = useState<BookingAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<StripeConfigResponse | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<BookingAvailabilitySlot[]>([]);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    company: "",
    problem: "",
  });

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "حجز الاستشارة أو الدعم",
        subtitle:
          "اختر موعدك حسب توقيت كيبيك. الحجز العادي متاح من 8:00 إلى 18:00 مع توقف بين 12:00 و13:00، أما Express فيعطي أولوية أعلى مع تكلفة إضافية ويظهر فقط لليوم والغد.",
        standardTitle: "حجز عادي",
        standardText: "مناسب للاستشارة المنظمة أو الدعم غير الطارئ خلال ساعات العمل.",
        expressTitle: "Express Priority",
        expressText: "أولوية أعلى مع تكلفة إضافية، ويظهر فقط لليوم والغد مع ساعات اليوم الحقيقي حتى 9:00 مساءً.",
        consultation: "استشارة",
        support: "دعم",
        timezone: "جميع المواعيد حسب توقيت كيبيك، كندا",
        lunch: "توقف يومي: 12:00 - 13:00",
        booked: "محجوز",
        available: "متاح",
        summary: "ملخص الحجز",
        summaryEmpty: "اختر موعداً من الجدول أولاً.",
        formTitle: "بيانات الحجز",
        name: "الاسم",
        email: "البريد الإلكتروني",
        phone: "الهاتف / واتساب",
        country: "الدولة",
        company: "الشركة",
        problem: "اشرح المشكل أو الطلب",
        showcase: "المواعيد المملوءة الظاهرة للثقة تظهر فقط خلال أول 10 أيام من الشهر.",
        expressWindow: "Express يعرض فقط اليوم والغد.",
        expressTime: "ساعات Express لليوم تبدأ من الوقت الحقيقي الحالي في كيبيك حتى 9:00 مساءً.",
        loading: "جارٍ تحميل المواعيد...",
        submit: "تأكيد الحجز",
        sending: "جارٍ التأكيد...",
        payment: "الدفع",
        paymentSecure: "ادفع الآن داخل الموقع لإكمال الحجز.",
        paymentUnavailable: "الدفع غير متاح حالياً. أكمل إعداد Stripe أولاً.",
        paymentLoading: "جارٍ تجهيز الدفع الآمن...",
        success: "تم تسجيل الحجز بنجاح. ستصلك رسالة تأكيد عبر البريد.",
        chooseSlot: "اختر موعداً صالحاً قبل الإرسال.",
        seoTitle: "حجز استشارة أو دعم | CVsolucion",
      };
    }

    if (locale === "fr") {
      return {
        title: "Reservation consultation ou support",
        subtitle:
          "Choisissez votre horaire en heure du Quebec. Le booking standard est ouvert de 8h a 18h avec pause 12h-13h. Le mode express ajoute une priorite reelle, un cout supplementaire, et n'affiche que aujourd'hui et demain.",
        standardTitle: "Booking standard",
        standardText: "Adapte a une consultation claire ou a un support non urgent pendant les heures normales.",
        expressTitle: "Express Priority",
        expressText: "Priorite renforcee avec frais supplementaires, disponible seulement pour aujourd'hui et demain, avec les heures du jour jusqu'a 21h.",
        consultation: "Consultation",
        support: "Support",
        timezone: "Tous les horaires sont affiches en heure du Quebec, Canada",
        lunch: "Pause quotidienne : 12:00 - 13:00",
        booked: "Reserve",
        available: "Disponible",
        summary: "Resume du booking",
        summaryEmpty: "Choisissez d'abord un horaire dans le calendrier.",
        formTitle: "Coordonnees du booking",
        name: "Nom",
        email: "Email",
        phone: "Telephone / WhatsApp",
        country: "Pays",
        company: "Societe",
        problem: "Decrivez le probleme ou la demande",
        showcase: "Aujourd'hui est complet, demain matin aussi, puis 5 bookings de 2 heures sont repartis sur les 7 jours suivants.",
        expressWindow: "Express affiche seulement aujourd'hui et demain.",
        expressTime: "Pour aujourd'hui, les heures Express suivent l'heure reelle du Quebec jusqu'a 21h.",
        loading: "Chargement des horaires...",
        submit: "Confirmer le booking",
        sending: "Confirmation...",
        payment: "Paiement",
        paymentSecure: "Payez maintenant dans le site pour finaliser le booking.",
        paymentUnavailable: "Le paiement n'est pas encore disponible. Stripe doit encore être configure.",
        paymentLoading: "Preparation du paiement securise...",
        success: "Le booking est enregistre. Un email de confirmation sera envoye.",
        chooseSlot: "Choisissez un horaire valide avant de confirmer.",
        seoTitle: "Reservation consultation ou support | CVsolucion",
      };
    }

    return {
      title: "Book a consultation or support session",
      subtitle:
        "Choose your appointment in Quebec time. Standard booking runs from 8:00 to 18:00 with a 12:00-13:00 break. Express adds clear priority, extra cost, and only shows today and tomorrow.",
      standardTitle: "Standard booking",
      standardText: "Best for planned consulting or non-urgent support during normal business hours.",
      expressTitle: "Express Priority",
      expressText: "Higher priority with an extra fee, available only for today and tomorrow, with same-day hours following real Quebec time until 9:00 PM.",
      consultation: "Consultation",
      support: "Support",
      timezone: "All appointment times are shown in Quebec, Canada time",
      lunch: "Daily pause: 12:00 - 13:00",
      booked: "Booked",
      available: "Available",
      summary: "Booking summary",
      summaryEmpty: "Choose a time slot from the schedule first.",
      formTitle: "Booking details",
      name: "Name",
      email: "Email",
      phone: "Phone / WhatsApp",
      country: "Country",
      company: "Company",
      problem: "Describe the issue or request",
      showcase: "Today is full, tomorrow morning is full, and 5 scattered 2-hour bookings are shown across the next 7 days.",
      expressWindow: "Express shows only today and tomorrow.",
      expressTime: "Today's Express slots follow the real current Quebec time until 9:00 PM.",
      loading: "Loading schedule...",
      submit: "Confirm booking",
      sending: "Confirming...",
      payment: "Payment",
      paymentSecure: "Pay securely inside the site to finalize this booking.",
      paymentUnavailable: "Payment is not available yet. Stripe still needs to be configured.",
      paymentLoading: "Preparing secure payment...",
      success: "Booking recorded successfully. A confirmation email will be sent.",
      chooseSlot: "Choose a valid slot before confirming.",
      seoTitle: "Book a consultation or support session | CVsolucion",
    };
  }, [locale]);

  const bookingPath = locale === "en" ? "/book" : `/${locale}/book`;
  const loginPath = locale === "en" ? "/login" : `/${locale}/login`;
  const loginHref = `${loginPath}?next=${encodeURIComponent(bookingPath)}`;
  const signupHref = `${loginPath}?mode=signup&next=${encodeURIComponent(bookingPath)}`;
  const standardShowcaseDetail =
    locale === "ar"
      ? "اليوم ممتلئ، وصباح الغد ممتلئ، ثم 5 حجوزات متفرقة من ساعتين خلال الأيام السبعة التالية."
      : locale === "fr"
        ? "Aujourd'hui est complet, demain matin aussi, puis 5 bookings de 2 heures sont repartis sur les 7 jours suivants."
        : "Today is full, tomorrow morning is full, and 5 scattered 2-hour bookings are shown across the next 7 days.";
  const standardShowcaseMeta =
    locale === "ar"
      ? "5 مواعيد متفرقة، وكل موعد منها مدته ساعتان."
      : locale === "fr"
        ? "5 bookings eparpilles, 2 heures chacun."
        : "5 scattered bookings, 2 hours each.";
  const loginRequiredTitle =
    locale === "ar" ? "يجب تسجيل الدخول أولاً" : locale === "fr" ? "Connexion obligatoire" : "Sign in required";
  const loginRequiredText =
    locale === "ar"
      ? "لتأكيد أي موعد، يجب أن تدخل إلى حسابك أو تنشئ حساباً أولاً."
      : locale === "fr"
        ? "Pour confirmer un booking, le client doit d'abord se connecter ou creer un compte."
        : "To confirm any booking, the client must sign in or create an account first.";
  const loginButtonLabel = locale === "ar" ? "تسجيل الدخول" : locale === "fr" ? "Se connecter" : "Sign in";
  const signupButtonLabel = locale === "ar" ? "إنشاء حساب" : locale === "fr" ? "Creer un compte" : "Create account";
  const authLoadingText =
    locale === "ar" ? "جارٍ التحقق من الحساب..." : locale === "fr" ? "Verification du compte..." : "Checking your account...";
  const loginRequiredError =
    locale === "ar"
      ? "يجب تسجيل الدخول أولاً قبل تأكيد الحجز."
      : locale === "fr"
        ? "Merci de vous connecter avant de confirmer le booking."
        : "Please sign in before confirming a booking.";
  const multiSlotHint =
    locale === "ar"
      ? "يمكنك اختيار حتى 3 مواعيد مفضلة."
      : locale === "fr"
        ? "Vous pouvez choisir jusqu'a 3 horaires preferes."
        : "You can choose up to 3 preferred time slots.";
  const tooManySlotsError =
    locale === "ar"
      ? "يمكن اختيار حتى 3 مواعيد فقط."
      : locale === "fr"
        ? "Vous pouvez choisir jusqu'a 3 horaires seulement."
        : "You can choose up to 3 time slots only.";
  const primarySlotLabel =
    locale === "ar" ? "الموعد الأساسي" : locale === "fr" ? "Horaire principal" : "Primary slot";
  const optionLabel = locale === "ar" ? "خيار" : locale === "fr" ? "Option" : "Option";

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
      .catch(() => setStripeConfig({ enabled: false, publishableKey: null, currency: "cad", prices: {} }));
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    setForm((current) => ({
      ...current,
      email: user.email,
      }));
  }, [user?.email]);

  useEffect(() => {
    const primarySlot = selectedSlots[0];
    const stripeEnabled = Boolean(stripeConfig?.enabled && stripeConfig.publishableKey);
    if (!user || !primarySlot || !stripeEnabled) {
      setPaymentClientSecret(null);
      setPaymentIntentId(null);
      return;
    }

    let cancelled = false;
    setPaymentLoading(true);
    createBookingPaymentIntent({
      serviceType,
      priority,
      date: primarySlot.date,
      hour: primarySlot.hour,
      locale,
    })
      .then((response) => {
        if (cancelled) return;
        setPaymentClientSecret(response.clientSecret);
        setPaymentIntentId(response.paymentIntentId);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setPaymentClientSecret(null);
        setPaymentIntentId(null);
        setStatus({ tone: "error", text: error.message });
      })
      .finally(() => {
        if (!cancelled) setPaymentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale, priority, selectedSlots, serviceType, stripeConfig?.enabled, stripeConfig?.publishableKey, user]);

  const weeks = useMemo(() => chunkDays(days, priority === "express" ? 2 : 5), [days, priority]);
  const stripePriceKey = `${priority}:${serviceType}`;
  const stripeAmount = stripeConfig?.prices?.[stripePriceKey] ?? 0;
  const stripeEnabled = Boolean(stripeConfig?.enabled && stripeConfig.publishableKey && stripeAmount > 0);
  const stripeAmountLabel =
    stripeAmount > 0
      ? new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
          style: "currency",
          currency: (stripeConfig?.currency || "cad").toUpperCase(),
        }).format(stripeAmount / 100)
      : null;

  function toggleSlot(slot: BookingAvailabilitySlot) {
    setStatus(null);
    setSelectedSlots((current) => {
      const exists = current.some((item) => item.id === slot.id);
      if (exists) {
        return current.filter((item) => item.id !== slot.id);
      }
      if (current.length >= 3) {
        setStatus({ tone: "error", text: tooManySlotsError });
        return current;
      }
      return [...current, slot];
    });
  }

  const finalizeBooking = async (confirmedPaymentIntentId?: string | null) => {
    if (!user) {
      setStatus({ tone: "error", text: loginRequiredError });
      return;
    }
    if (!selectedSlots.length) {
      setStatus({ tone: "error", text: copy.chooseSlot });
      return;
    }

    const [primarySlot, ...alternativeSlotItems] = selectedSlots;
    if (!primarySlot) {
      setStatus({ tone: "error", text: copy.chooseSlot });
      return;
    }
    const alternativeSlots = alternativeSlotItems.map((slot) => formatSlotSummary(slot.date, slot.hour));
    const bookingNotes = alternativeSlots.length
      ? `${form.problem}\n\nAlternative preferred slots:\n- ${alternativeSlots.join("\n- ")}`
      : form.problem;

    try {
      setSaving(true);
      setStatus(null);
      await createBooking({
        serviceType,
        priority,
        date: primarySlot.date,
        hour: primarySlot.hour,
        name: form.name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        company: form.company,
        notes: bookingNotes,
        paymentIntentId: confirmedPaymentIntentId || paymentIntentId || "",
        locale,
      });

      setStatus({ tone: "success", text: copy.success });
      setForm({ name: "", email: user.email, phone: "", country: "", company: "", problem: "" });
      setSelectedSlots([]);
      const refreshed = await getBookingAvailability(priority);
      setDays(refreshed.days);
    } catch (error: any) {
      setStatus({ tone: "error", text: error?.message || "Booking failed." });
    } finally {
      setSaving(false);
    }
  };

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
            <span className="glass-chip rounded-full px-4 py-2">
              {priority === "express" ? copy.expressWindow : standardShowcaseDetail}
            </span>
            <span className="glass-chip rounded-full px-4 py-2">
              {priority === "express" ? copy.expressTime : standardShowcaseMeta}
            </span>
          </div>

          <div className="mx-auto mt-12 grid max-w-7xl gap-8 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6">
              <GlassCard className="card-static rounded-[32px] p-7">
                <div className="flex flex-wrap items-center gap-3">
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
                <p className="mt-4 text-sm text-slate-500">{multiSlotHint}</p>

                {loading ? (
                  <div className="mt-8 text-sm text-slate-500">{copy.loading}</div>
                ) : (
                  <div className="mt-8 space-y-8">
                    {weeks.map((week, weekIndex) => (
                      <div
                        key={`week-${weekIndex}`}
                        className={`grid gap-4 ${priority === "express" ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}
                      >
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
              <GlassCard className="card-static rounded-[32px] p-7">
                <h2 className="text-2xl font-bold text-slate-950">{copy.summary}</h2>
                {selectedSlots.length ? (
                  <div className="mt-5 space-y-4 text-slate-700">
                    {selectedSlots.map((slot, index) => (
                      <div key={slot.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {index === 0 ? primarySlotLabel : `${optionLabel} ${index + 1}`}
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
                  </div>
                ) : (
                  <p className="mt-5 text-base leading-7 text-slate-600">{copy.summaryEmpty}</p>
                )}
              </GlassCard>

              <GlassCard className="card-static rounded-[32px] p-7">
                <h2 className="text-2xl font-bold text-slate-950">{copy.formTitle}</h2>
                {authLoading ? (
                  <div className="mt-6 text-sm text-slate-500">{authLoadingText}</div>
                ) : !user ? (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">{loginRequiredTitle}</h3>
                    <p className="text-base leading-7 text-slate-600">{loginRequiredText}</p>
                    <div className="flex flex-wrap gap-3">
                      <a href={loginHref}>
                        <Button type="button" className="rounded-full">
                          {loginButtonLabel}
                        </Button>
                      </a>
                      <a href={signupHref}>
                        <Button type="button" variant="outline" className="rounded-full">
                          {signupButtonLabel}
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <form
                    className="mt-6 space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="booking-name">{copy.name}</Label>
                      <Input
                        id="booking-name"
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-email">{copy.email}</Label>
                      <Input id="booking-email" type="email" value={form.email} readOnly disabled className="opacity-80" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-phone">{copy.phone}</Label>
                      <Input
                        id="booking-phone"
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-country">{copy.country}</Label>
                      <Input
                        id="booking-country"
                        value={form.country}
                        onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-company">{copy.company}</Label>
                      <Input
                        id="booking-company"
                        value={form.company}
                        onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-problem">{copy.problem}</Label>
                      <Textarea
                        id="booking-problem"
                        className="min-h-32"
                        value={form.problem}
                        onChange={(event) => setForm((current) => ({ ...current, problem: event.target.value }))}
                        required
                      />
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white/70 p-4">
                      <div className="text-sm font-semibold text-slate-900">{copy.payment}</div>
                      <div className="mt-2 text-sm text-slate-600">
                        {stripeAmountLabel ? `${copy.paymentSecure} ${stripeAmountLabel}` : copy.paymentSecure}
                      </div>

                      {stripeEnabled ? (
                        paymentLoading ? (
                          <div className="mt-4 text-sm text-slate-500">{copy.paymentLoading}</div>
                        ) : paymentClientSecret && stripeConfig?.publishableKey ? (
                          <div className="mt-4">
                            <BookingPaymentElement
                              clientSecret={paymentClientSecret}
                              publishableKey={stripeConfig.publishableKey}
                              locale={locale}
                              submitLabel={saving ? copy.sending : copy.submit}
                              processingLabel={copy.sending}
                              onConfirm={async (confirmedPaymentIntentId) => {
                                await finalizeBooking(confirmedPaymentIntentId);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="mt-4 text-sm text-slate-500">{copy.chooseSlot}</div>
                        )
                      ) : (
                        <div className="mt-4 space-y-4">
                          <div className="text-sm text-slate-500">{copy.paymentUnavailable}</div>
                          <Button
                            type="button"
                            className="w-full rounded-full bg-primary text-white hover:bg-primary/90"
                            disabled={saving}
                            onClick={() => void finalizeBooking()}
                          >
                            {saving ? copy.sending : copy.submit}
                          </Button>
                        </div>
                      )}
                    </div>
                  </form>
                )}

                {status ? (
                  <div
                    className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                      status.tone === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
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
