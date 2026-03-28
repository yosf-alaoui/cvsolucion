import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, ShieldCheck, ShoppingCart } from "lucide-react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
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
import { clearBookingCheckoutDraft, getBookingCheckoutDraft } from "@/lib/bookingCheckout";
import { createBooking } from "@/lib/bookings";
import { getCustomerDashboard } from "@/lib/customer";
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

function formatSlotSummary(date: string, hour: number) {
  return `${date} ${String(hour).padStart(2, "0")}:00`;
}

function BookingPaymentElement({
  clientSecret,
  publishableKey,
  submitLabel,
  processingLabel,
  onConfirm,
  billingDetails,
}: {
  clientSecret: string;
  publishableKey: string;
  submitLabel: string;
  processingLabel: string;
  onConfirm: (paymentIntentId: string) => Promise<void>;
  billingDetails: {
    name: string;
    email: string;
    phone: string;
    country: string;
  };
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  const options = useMemo<StripeElementsOptions>(() => ({ clientSecret, appearance: { theme: "stripe" } }), [clientSecret]);

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentInner
        clientSecret={clientSecret}
        submitLabel={submitLabel}
        processingLabel={processingLabel}
        onConfirm={onConfirm}
        billingDetails={billingDetails}
      />
    </Elements>
  );
}

function StripePaymentInner({
  clientSecret,
  submitLabel,
  processingLabel,
  onConfirm,
  billingDetails,
}: {
  clientSecret: string;
  submitLabel: string;
  processingLabel: string;
  onConfirm: (paymentIntentId: string) => Promise<void>;
  billingDetails: {
    name: string;
    email: string;
    phone: string;
    country: string;
  };
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!stripe || !elements) return;
    setBusy(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card form is not ready yet.");
      }
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone,
          },
        },
      });
      if (result.error) throw new Error(result.error.message || "Payment confirmation failed.");
      const paymentIntentId = result.paymentIntent?.id;
      if (!paymentIntentId) throw new Error("Stripe did not return a payment intent.");
      await onConfirm(paymentIntentId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: "16px",
                color: "#0f172a",
                fontFamily: "Cairo, ui-sans-serif, system-ui, sans-serif",
                "::placeholder": {
                  color: "#94a3b8",
                },
              },
            },
          }}
        />
      </div>
      <Button type="button" className="w-full rounded-full bg-primary text-white hover:bg-primary/90" disabled={!stripe || !elements || busy} onClick={handleSubmit}>
        {busy ? processingLabel : submitLabel}
      </Button>
    </div>
  );
}

export default function BookingCheckout() {
  const { locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<StripeConfigResponse | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    company: "",
    problem: "",
  });

  const draft = useMemo(() => getBookingCheckoutDraft(), []);

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "إتمام الحجز والدفع",
        subtitle: "راجع السلة، تحقق من بياناتك، ثم أكمل الدفع داخل الموقع.",
        cart: "سلة الحجز",
        details: "بيانات الحجز",
        payment: "الدفع",
        summaryMissing: "لا يوجد حجز مختار حالياً. عد إلى صفحة الحجز أولاً.",
        back: "العودة إلى الحجز",
        name: "الاسم",
        email: "البريد الإلكتروني",
        phone: "الهاتف / واتساب",
        country: "الدولة",
        company: "الشركة",
        problem: "اشرح المشكلة أو الطلب",
        consultation: "استشارة",
        support: "دعم",
        standard: "عادي",
        express: "إكسبريس",
        primarySlot: "الموعد الأساسي",
        option: "خيار",
        service: "الخدمة",
        priority: "الأولوية",
        price: "السعر",
        total: "الإجمالي المستحق",
        backupNote: "المواعيد الإضافية تبقى بدائل فقط ولا تُحاسب بشكل منفصل.",
        signInRequired: "يجب تسجيل الدخول أولاً لإتمام الحجز.",
        checkout: "إتمام الدفع والحجز",
        paying: "جارٍ التأكيد...",
        paymentLoading: "جارٍ تجهيز الدفع الآمن...",
        paymentUnavailable: "الدفع غير متاح لهذا النوع حالياً.",
        success: "تم تسجيل الحجز بنجاح.",
        profileAutoFill: "تم ملء البيانات تلقائياً من حسابك وآخر حجز مسجل.",
      };
    }
    if (locale === "fr") {
      return {
        title: "Checkout et paiement",
        subtitle: "Revisez le panier, verifiez vos informations, puis payez dans le site.",
        cart: "Panier du booking",
        details: "Coordonnees du booking",
        payment: "Paiement",
        summaryMissing: "Aucun booking selectionne. Revenez d'abord a la page de booking.",
        back: "Retour au booking",
        name: "Nom",
        email: "Email",
        phone: "Telephone / WhatsApp",
        country: "Pays",
        company: "Societe",
        problem: "Decrivez le probleme ou la demande",
        consultation: "Consultation",
        support: "Support",
        standard: "Standard",
        express: "Express",
        primarySlot: "Horaire principal",
        option: "Option",
        service: "Service",
        priority: "Priorite",
        price: "Prix",
        total: "Total a payer",
        backupNote: "Les horaires supplementaires restent des options de secours et ne sont pas factures separement.",
        signInRequired: "Connexion obligatoire pour finaliser le booking.",
        checkout: "Payer et confirmer",
        paying: "Confirmation...",
        paymentLoading: "Preparation du paiement securise...",
        paymentUnavailable: "Le paiement n'est pas disponible pour ce type.",
        success: "Booking confirme avec succes.",
        profileAutoFill: "Les informations ont ete remplies depuis votre compte et votre dernier booking.",
      };
    }
    return {
      title: "Checkout and payment",
      subtitle: "Review your cart, confirm your details, then pay inside the site.",
      cart: "Booking cart",
      details: "Booking details",
      payment: "Payment",
      summaryMissing: "No booking is selected right now. Go back to the booking page first.",
      back: "Back to booking",
      name: "Name",
      email: "Email",
      phone: "Phone / WhatsApp",
      country: "Country",
      company: "Company",
      problem: "Describe the issue or request",
      consultation: "Consultation",
      support: "Support",
      standard: "Standard",
      express: "Express",
      primarySlot: "Primary slot",
      option: "Option",
      service: "Service",
      priority: "Priority",
      price: "Price",
      total: "Total due now",
      backupNote: "Extra selected slots stay as backups only and are not charged separately.",
      signInRequired: "Sign in is required to complete this booking.",
      checkout: "Pay and confirm",
      paying: "Confirming...",
      paymentLoading: "Preparing secure payment...",
      paymentUnavailable: "Payment is not available for this type right now.",
      success: "Booking confirmed successfully.",
      profileAutoFill: "Your details were auto-filled from your account and latest booking.",
    };
  }, [locale]);

  const bookingPath = locale === "en" ? "/book" : `/${locale}/book`;
  const loginPath = locale === "en" ? "/login" : `/${locale}/login`;
  const loginHref = `${loginPath}?next=${encodeURIComponent(locale === "en" ? "/book/checkout" : `/${locale}/book/checkout`)}`;

  useEffect(() => {
    setDraftLoaded(true);
    if (!draft) setRedirecting(true);
  }, [draft]);

  useEffect(() => {
    getStripeBookingConfig()
      .then((response) => setStripeConfig(response))
      .catch(() => setStripeConfig({ enabled: false, publishableKey: null, currency: "cad", prices: {} }));
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    setForm((current) => ({ ...current, email: user.email }));
  }, [user?.email]);

  useEffect(() => {
    if (!user) return;
    getCustomerDashboard()
      .then((response) => {
        const latestBooking = [...response.bookings]
          .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0];
        setForm((current) => ({
          ...current,
          name: current.name || response.profile.name || latestBooking?.name || "",
          email: user.email,
          phone: current.phone || response.profile.phone || latestBooking?.phone || "",
          country: current.country || response.profile.country || latestBooking?.country || "",
          company: current.company || response.profile.company || latestBooking?.company || "",
        }));
        setStatus((current) => current ?? { tone: "success", text: copy.profileAutoFill });
      })
      .catch(() => {});
  }, [copy.profileAutoFill, user]);

  const primarySlot = draft?.slots[0] ?? null;
  const stripePriceKey = draft ? `${draft.priority}:${draft.serviceType}` : "";
  const unitAmount = stripeConfig?.prices?.[stripePriceKey] ?? 0;
  const totalAmount = unitAmount * (draft?.slots.length || 0);
  const stripeEnabled = Boolean(stripeConfig?.enabled && stripeConfig.publishableKey && totalAmount > 0);
  const stripeAmountLabel =
    unitAmount > 0
      ? new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
          style: "currency",
          currency: (stripeConfig?.currency || "cad").toUpperCase(),
        }).format(unitAmount / 100)
      : null;
  const totalAmountLabel =
    totalAmount > 0
      ? new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
          style: "currency",
          currency: (stripeConfig?.currency || "cad").toUpperCase(),
        }).format(totalAmount / 100)
      : null;
  const serviceLabel = draft ? (draft.serviceType === "support" ? copy.support : copy.consultation) : "";
  const priorityLabel = draft ? (draft.priority === "express" ? copy.express : copy.standard) : "";

  useEffect(() => {
    if (!user || !draft || !primarySlot || !stripeEnabled) {
      setPaymentClientSecret(null);
      setPaymentIntentId(null);
      return;
    }
    let cancelled = false;
    setPaymentLoading(true);
    createBookingPaymentIntent({
      serviceType: draft.serviceType,
      priority: draft.priority,
      slots: draft.slots.map((slot) => ({ date: slot.date, hour: slot.hour })),
      locale,
    })
      .then((response) => {
        if (cancelled) return;
        setPaymentClientSecret(response.clientSecret);
        setPaymentIntentId(response.paymentIntentId);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setStatus({ tone: "error", text: error.message });
      })
      .finally(() => {
        if (!cancelled) setPaymentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draft, locale, primarySlot, stripeEnabled, user]);

  async function finalizeBooking(confirmedPaymentIntentId?: string | null) {
    if (!draft || !primarySlot) return;
    const alternativeSlots = draft.slots.slice(1).map((slot) => formatSlotSummary(slot.date, slot.hour));
    const bookingNotes = alternativeSlots.length
      ? `${form.problem}\n\nAlternative preferred slots:\n- ${alternativeSlots.join("\n- ")}`
      : form.problem;

    try {
      setSaving(true);
      setStatus(null);
      await createBooking({
        serviceType: draft.serviceType,
        priority: draft.priority,
        slots: draft.slots.map((slot) => ({ date: slot.date, hour: slot.hour })),
        name: form.name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        company: form.company,
        notes: bookingNotes,
        paymentIntentId: confirmedPaymentIntentId || paymentIntentId || "",
        locale,
      });
      clearBookingCheckoutDraft();
      setStatus({ tone: "success", text: copy.success });
      setTimeout(() => {
        window.location.href = locale === "en" ? "/dashboard" : `/${locale}/dashboard`;
      }, 1200);
    } catch (error: any) {
      setStatus({ tone: "error", text: error?.message || "Booking failed." });
    } finally {
      setSaving(false);
    }
  }

  if (!draftLoaded) return null;

  if (!draft || redirecting) {
    return (
      <div className="site-page min-h-screen bg-transparent">
        <Header />
        <main className="pt-32 pb-20">
          <section className="container">
            <div className="mx-auto max-w-3xl">
              <GlassCard className="card-static rounded-[32px] p-8 text-center">
                <p className="text-lg text-slate-600">{copy.summaryMissing}</p>
                <a href={bookingPath}>
                  <Button className="mt-6 rounded-full">{copy.back}</Button>
                </a>
              </GlassCard>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-page min-h-screen bg-transparent">
      <Seo title={`${copy.title} | CVsolucion`} description={copy.subtitle} type="website" />
      <Header />
      <main className="pt-32 pb-20">
        <section className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{copy.title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.subtitle}</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-7xl gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <GlassCard className="card-static rounded-[32px] p-7">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-slate-950">{copy.cart}</h2>
                </div>
                <div className="mt-5 space-y-4 text-slate-700">
                  {draft.slots.map((slot, index) => (
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
                    <ShieldCheck className={`h-5 w-5 ${draft.priority === "express" ? "text-amber-500" : "text-primary"}`} />
                    <span>{draft.priority === "express" ? copy.express : copy.standard}</span>
                    <span className="text-slate-400">•</span>
                    <span>{draft.serviceType === "support" ? copy.support : copy.consultation}</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">{copy.service}</span>
                      <span className="font-semibold text-slate-900">{serviceLabel}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-slate-500">{copy.priority}</span>
                      <span className="font-semibold text-slate-900">{priorityLabel}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-slate-500">{copy.price}</span>
                      <span className="font-semibold text-slate-900">{stripeAmountLabel || "—"}</span>
                    </div>
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-semibold text-slate-900">{copy.total}</span>
                        <span className="text-lg font-bold text-primary">{totalAmountLabel || "—"}</span>
                      </div>
                      <p className="mt-3 text-xs leading-6 text-slate-500">
                        {draft.slots.length > 1 ? `Selected appointments: ${draft.slots.length}.` : copy.backupNote}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="space-y-6">
              <GlassCard className="card-static rounded-[32px] p-7">
                <h2 className="text-2xl font-bold text-slate-950">{copy.details}</h2>
                {authLoading ? (
                  <div className="mt-6 text-sm text-slate-500">...</div>
                ) : !user ? (
                  <div className="mt-6 space-y-4">
                    <p className="text-base leading-7 text-slate-600">{copy.signInRequired}</p>
                    <a href={loginHref}>
                      <Button className="rounded-full">Sign in</Button>
                    </a>
                  </div>
                ) : (
                  <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
                    <div className="space-y-2">
                      <Label htmlFor="booking-name">{copy.name}</Label>
                      <Input id="booking-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-email">{copy.email}</Label>
                      <Input id="booking-email" type="email" value={form.email} readOnly disabled className="opacity-80" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-phone">{copy.phone}</Label>
                      <Input id="booking-phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-country">{copy.country}</Label>
                      <Input id="booking-country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-company">{copy.company}</Label>
                      <Input id="booking-company" value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking-problem">{copy.problem}</Label>
                      <Textarea id="booking-problem" className="min-h-32" value={form.problem} onChange={(event) => setForm((current) => ({ ...current, problem: event.target.value }))} required />
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white/70 p-4">
                      <div className="text-sm font-semibold text-slate-900">{copy.payment}</div>
                      {totalAmountLabel ? <div className="mt-2 text-sm text-slate-600">{copy.total}: {totalAmountLabel}</div> : null}
                      {stripeEnabled ? (
                        paymentLoading ? (
                          <div className="mt-4 text-sm text-slate-500">{copy.paymentLoading}</div>
                        ) : paymentClientSecret && stripeConfig?.publishableKey ? (
                          <div className="mt-4">
                            <BookingPaymentElement
                              clientSecret={paymentClientSecret}
                              publishableKey={stripeConfig.publishableKey}
                              submitLabel={saving ? copy.paying : copy.checkout}
                              processingLabel={copy.paying}
                              billingDetails={{
                                name: form.name,
                                email: form.email,
                                phone: form.phone,
                                country: form.country,
                              }}
                              onConfirm={async (confirmedPaymentIntentId) => {
                                await finalizeBooking(confirmedPaymentIntentId);
                              }}
                            />
                          </div>
                        ) : null
                      ) : (
                        <div className="mt-4 text-sm text-slate-500">{copy.paymentUnavailable}</div>
                      )}
                    </div>
                  </form>
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
