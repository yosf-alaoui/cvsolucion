import { useEffect, useMemo, useState } from "react";
import { CreditCard, Lock } from "lucide-react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import BookingCartSummary from "@/components/booking/BookingCartSummary";
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
  getBookingCheckoutDraft,
  getBookingCheckoutEventName,
  removeBookingCheckoutSlot,
  clearBookingCheckoutDraft,
  type BookingCheckoutDraft,
} from "@/lib/bookingCheckout";
import { createBooking } from "@/lib/bookings";
import { getCustomerDashboard } from "@/lib/customer";
import { createBookingPaymentIntent, getStripeBookingConfig, type StripeConfigResponse } from "@/lib/stripeBooking";
import { useI18n } from "@/i18n/i18n";

function getCopy(locale: string) {
  if (locale === "ar") {
    return {
      title: "إتمام الحجز والدفع",
      subtitle: "راجع السلة، أكمل بياناتك، ثم ادفع داخل الموقع.",
      cart: "ملخص الطلب",
      appointments: "الجلسات المختارة",
      invoice: "الفاتورة",
      empty: "لا يوجد أي موعد داخل السلة حالياً.",
      service: "الخدمة",
      priority: "الأولوية",
      subtotal: "المجموع الفرعي",
      tax: "الضرائب",
      total: "الإجمالي المستحق",
      remove: "إزالة",
      item: "جلسة",
      note: "خدمة رقمية بدون شحن. كل موعد مختار يُحاسب كجلسة مستقلة.",
      details: "بيانات العميل",
      payment: "الدفع",
      secure: "دفع آمن عبر Stripe",
      paymentHint: "أدخل بيانات البطاقة لإتمام الطلب.",
      cardReady: "أدخل بيانات البطاقة لتفعيل زر الدفع.",
      backToCart: "العودة إلى السلة",
      backToBooking: "العودة إلى اختيار المواعيد",
      signInRequired: "يجب تسجيل الدخول لإكمال الحجز.",
      signIn: "تسجيل الدخول",
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
      payNow: "ادفع وأكد الطلب",
      processing: "جارٍ تأكيد الدفع...",
      preparing: "جارٍ تجهيز الدفع الآمن...",
      paymentUnavailable: "الدفع غير متاح حالياً لهذا النوع.",
      success: "تم تأكيد الحجز بنجاح.",
      profileAutoFill: "تم ملء البيانات تلقائياً من حسابك وآخر حجز مسجل.",
      seoTitle: "الدفع وإتمام الحجز | CVsolucion",
    };
  }
  if (locale === "fr") {
    return {
      title: "Checkout et paiement",
      subtitle: "Revisez le panier, completez vos coordonnees, puis payez dans le site.",
      cart: "Resume de commande",
      appointments: "Sessions choisies",
      invoice: "Facture",
      empty: "Aucun horaire n'est dans le panier pour le moment.",
      service: "Service",
      priority: "Priorite",
      subtotal: "Sous-total",
      tax: "Taxes",
      total: "Total a payer",
      remove: "Retirer",
      item: "Session",
      note: "Service numerique sans livraison. Chaque horaire choisi est facture comme une session separee.",
      details: "Coordonnees client",
      payment: "Paiement",
      secure: "Paiement securise par Stripe",
      paymentHint: "Entrez les details de la carte pour finaliser la commande.",
      cardReady: "Entrez la carte pour activer le paiement.",
      backToCart: "Retour au panier",
      backToBooking: "Retour au booking",
      signInRequired: "La connexion est obligatoire pour finaliser le booking.",
      signIn: "Se connecter",
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
      payNow: "Payer et confirmer",
      processing: "Confirmation du paiement...",
      preparing: "Preparation du paiement securise...",
      paymentUnavailable: "Le paiement n'est pas disponible pour ce type pour le moment.",
      success: "Booking confirme avec succes.",
      profileAutoFill: "Les informations ont ete remplies depuis votre compte et votre dernier booking.",
      seoTitle: "Checkout et paiement | CVsolucion",
    };
  }
  return {
    title: "Checkout and payment",
    subtitle: "Review your cart, complete your details, then pay inside the site.",
    cart: "Order summary",
    appointments: "Selected sessions",
    invoice: "Invoice details",
    empty: "There are no appointments in your cart right now.",
    service: "Service",
    priority: "Priority",
    subtotal: "Subtotal",
    tax: "Taxes",
    total: "Total due now",
    remove: "Remove",
    item: "Session",
    note: "Digital service with no shipping. Each selected appointment is billed as a separate session.",
    details: "Customer details",
    payment: "Payment",
    secure: "Secure payment by Stripe",
    paymentHint: "Enter your card details to complete the order.",
    cardReady: "Enter your card details to enable payment.",
    backToCart: "Back to cart",
    backToBooking: "Back to booking",
    signInRequired: "Sign in is required to complete this booking.",
    signIn: "Sign in",
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
    payNow: "Pay and confirm",
    processing: "Confirming payment...",
    preparing: "Preparing secure payment...",
    paymentUnavailable: "Payment is not available for this type right now.",
    success: "Booking confirmed successfully.",
    profileAutoFill: "Your details were auto-filled from your account and latest booking.",
    seoTitle: "Checkout and payment | CVsolucion",
  };
}

function StripeCardCheckout({
  publishableKey,
  clientSecret,
  billingReady,
  billingDetails,
  submitLabel,
  processingLabel,
  helperLabel,
  onSuccess,
}: {
  publishableKey: string;
  clientSecret: string;
  billingReady: boolean;
  billingDetails: { name: string; email: string; phone: string };
  submitLabel: string;
  processingLabel: string;
  helperLabel: string;
  onSuccess: (paymentIntentId: string) => Promise<void>;
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  return (
    <Elements stripe={stripePromise}>
      <StripeCardCheckoutInner
        clientSecret={clientSecret}
        billingReady={billingReady}
        billingDetails={billingDetails}
        submitLabel={submitLabel}
        processingLabel={processingLabel}
        helperLabel={helperLabel}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}

function StripeCardCheckoutInner({
  clientSecret,
  billingReady,
  billingDetails,
  submitLabel,
  processingLabel,
  helperLabel,
  onSuccess,
}: {
  clientSecret: string;
  billingReady: boolean;
  billingDetails: { name: string; email: string; phone: string };
  submitLabel: string;
  processingLabel: string;
  helperLabel: string;
  onSuccess: (paymentIntentId: string) => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(stripe && elements && billingReady && cardComplete && !busy);

  async function handleSubmit() {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) {
      setError("Card form is not ready.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment failed.");
      }
      const paymentIntentId = result.paymentIntent?.id;
      if (!paymentIntentId) {
        throw new Error("Stripe did not return a payment reference.");
      }
      await onSuccess(paymentIntentId);
    } catch (caught: any) {
      setError(caught?.message || "Payment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <CreditCard className="h-4 w-4 text-primary" />
          Card details
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: "16px",
                  color: "#0f172a",
                  fontFamily: "ui-sans-serif, system-ui, sans-serif",
                  "::placeholder": {
                    color: "#94a3b8",
                  },
                },
                invalid: {
                  color: "#dc2626",
                },
              },
            }}
            onChange={(event) => {
              setCardComplete(event.complete);
              setError(event.error?.message || null);
            }}
          />
        </div>
      </div>

      {error ? <div className="text-sm text-rose-600">{error}</div> : <div className="text-sm text-slate-500">{helperLabel}</div>}

      <Button type="button" className="w-full rounded-full bg-primary text-white hover:bg-primary/90" disabled={!canSubmit} onClick={handleSubmit}>
        {busy ? processingLabel : submitLabel}
      </Button>
    </div>
  );
}

export default function BookingCheckout() {
  const { locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [draft, setDraft] = useState<BookingCheckoutDraft | null>(() => getBookingCheckoutDraft());
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<StripeConfigResponse | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    company: "",
    problem: "",
  });

  const copy = useMemo(() => getCopy(locale), [locale]);
  const bookingHref = locale === "en" ? "/book" : `/${locale}/book`;
  const cartHref = locale === "en" ? "/book/cart" : `/${locale}/book/cart`;
  const checkoutHref = locale === "en" ? "/book/checkout" : `/${locale}/book/checkout`;
  const loginPath = locale === "en" ? "/login" : `/${locale}/login`;
  const loginHref = `${loginPath}?next=${encodeURIComponent(checkoutHref)}`;

  useEffect(() => {
    const sync = () => setDraft(getBookingCheckoutDraft());
    sync();
    const eventName = getBookingCheckoutEventName();
    window.addEventListener(eventName, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

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

  const unitAmount = draft ? stripeConfig?.prices?.[`${draft.priority}:${draft.serviceType}`] ?? 0 : 0;
  const totalAmount = unitAmount * (draft?.slots.length || 0);
  const stripeEnabled = Boolean(stripeConfig?.enabled && stripeConfig.publishableKey && totalAmount > 0);
  const serviceLabel = draft ? (draft.serviceType === "support" ? copy.support : copy.consultation) : "";
  const priorityLabel = draft ? (draft.priority === "express" ? copy.express : copy.standard) : "";
  const billingReady = Boolean(form.name.trim() && form.email.trim() && form.phone.trim() && form.country.trim() && form.problem.trim());

  useEffect(() => {
    if (!user || !draft || !draft.slots.length || !stripeEnabled) {
      setPaymentClientSecret(null);
      return;
    }
    let cancelled = false;
    setPaymentClientSecret(null);
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
  }, [draft, locale, stripeEnabled, user]);

  async function finalizeBooking(paymentIntentId: string) {
    if (!draft || !draft.slots.length) return;
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
        notes: form.problem,
        paymentIntentId,
        locale,
      });
      clearBookingCheckoutDraft();
      setDraft(null);
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

  return (
    <div className="site-page min-h-screen bg-transparent">
      <Seo title={copy.seoTitle} description={copy.subtitle} type="website" />
      <Header />
      <main className="pt-32 pb-20">
        <section className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{copy.title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.subtitle}</p>
          </div>

          {!draft || !draft.slots.length ? (
            <div className="mx-auto mt-12 max-w-4xl">
              <GlassCard className="card-static rounded-[32px] p-8 text-center">
                <p className="text-base leading-7 text-slate-600">{copy.empty}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white/75">
                    <a href={cartHref}>{copy.backToCart}</a>
                  </Button>
                  <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
                    <a href={bookingHref}>{copy.backToBooking}</a>
                  </Button>
                </div>
              </GlassCard>
            </div>
          ) : (
            <div className="mx-auto mt-12 grid max-w-7xl gap-8 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-6">
                <BookingCartSummary
                  draft={draft}
                  locale={locale}
                  currency={stripeConfig?.currency || "cad"}
                  unitAmount={unitAmount}
                  serviceLabel={serviceLabel}
                  priorityLabel={priorityLabel}
                  title={copy.cart}
                  appointmentsLabel={copy.appointments}
                  invoiceLabel={copy.invoice}
                  emptyLabel={copy.empty}
                  serviceText={copy.service}
                  priorityText={copy.priority}
                  subtotalText={copy.subtotal}
                  taxText={copy.tax}
                  totalText={copy.total}
                  removeText={copy.remove}
                  itemLabel={copy.item}
                  digitalNote={copy.note}
                  secondaryActionLabel={copy.backToBooking}
                  secondaryActionHref={bookingHref}
                  onRemoveSlot={(slotId) => {
                    const nextDraft = removeBookingCheckoutSlot(slotId);
                    setDraft(nextDraft);
                  }}
                />
              </div>

              <div className="space-y-6">
                <GlassCard className="card-static rounded-[32px] p-7">
                  <h2 className="text-2xl font-bold text-slate-950">{copy.details}</h2>
                  {authLoading ? (
                    <div className="mt-6 text-sm text-slate-500">...</div>
                  ) : !user ? (
                    <div className="mt-6 space-y-4">
                      <p className="text-base leading-7 text-slate-600">{copy.signInRequired}</p>
                      <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
                        <a href={loginHref}>{copy.signIn}</a>
                      </Button>
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
                        <Input id="booking-company" value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} />
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
                    </form>
                  )}
                </GlassCard>

                <GlassCard className="card-static rounded-[32px] p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-950">{copy.payment}</h2>
                      <p className="mt-2 text-sm text-slate-600">{copy.paymentHint}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                      <Lock className="h-4 w-4" />
                      {copy.secure}
                    </div>
                  </div>

                  {!user ? null : stripeEnabled ? (
                    paymentLoading ? (
                      <div className="mt-6 text-sm text-slate-500">{copy.preparing}</div>
                    ) : paymentClientSecret && stripeConfig?.publishableKey ? (
                      <div className="mt-6">
                        <StripeCardCheckout
                          publishableKey={stripeConfig.publishableKey}
                          clientSecret={paymentClientSecret}
                          billingReady={billingReady}
                          billingDetails={{
                            name: form.name,
                            email: form.email,
                            phone: form.phone,
                          }}
                          submitLabel={saving ? copy.processing : `${copy.payNow}`}
                          processingLabel={copy.processing}
                          helperLabel={copy.cardReady}
                          onSuccess={finalizeBooking}
                        />
                      </div>
                    ) : null
                  ) : (
                    <div className="mt-6 text-sm text-slate-500">{copy.paymentUnavailable}</div>
                  )}
                </GlassCard>

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
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
