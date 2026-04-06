import { useEffect, useMemo, useState } from "react";
import BookingFlowSteps from "@/components/booking/BookingFlowSteps";
import BookingOrderSummary from "@/components/booking/BookingOrderSummary";
import StripePaymentForm from "@/components/booking/StripePaymentForm";
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
  clearBookingCheckoutDraft,
  getBookingCheckoutDraft,
  getBookingCheckoutEventName,
  removeBookingCheckoutSlot,
  type BookingCheckoutDraft,
} from "@/lib/bookingCheckout";
import { createBooking } from "@/lib/bookings";
import { getCustomerDashboard } from "@/lib/customer";
import { getBookingCountryLabel, getBookingRegionLabel } from "@/lib/bookingTime";
import { createBookingPaymentIntent, getStripeBookingConfig, type StripeConfigResponse } from "@/lib/stripeBooking";
import { useI18n } from "@/i18n/i18n";

function getCopy(locale: string) {
  if (locale === "ar") {
    return {
      title: "الدفع وإتمام الحجز",
      subtitle: "راجع الطلب، أكمل بياناتك، ثم ادفع داخل الموقع مثل أي متجر خدمات رقمي.",
      empty: "لا توجد مواعيد داخل السلة حالياً.",
      orderSummary: "ملخص الطلب",
      lineItems: "الجلسات المختارة",
      invoice: "تفاصيل الفاتورة",
      service: "الخدمة",
      priority: "الأولوية",
      package: "الباقة",
      subtotal: "المجموع الفرعي",
      taxes: "الضرائب",
      total: "الإجمالي المستحق الآن",
      selectedCount: "عدد الجلسات",
      digitalNote: "خدمة رقمية بدون شحن. كل موعد مختار يُحاسب كجلسة مستقلة ويظهر كسطر منفصل في الفاتورة.",
      remove: "إزالة",
      details: "بيانات العميل",
      signInRequired: "يجب تسجيل الدخول قبل إتمام هذا الطلب.",
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
      backToCart: "العودة إلى السلة",
      backToBooking: "العودة لاختيار المواعيد",
      success: "تم تأكيد الحجز بنجاح.",
      profileAutoFill: "تم ملء البيانات تلقائياً من حسابك وآخر حجز محفوظ.",
      paymentTitle: "الدفع",
      paymentSubtitle: "أدخل بيانات البطاقة ثم أكد الطلب.",
      secure: "دفع آمن عبر Stripe",
      cardNumber: "رقم البطاقة",
      expiry: "تاريخ الانتهاء",
      cvc: "CVC",
      missingCustomer: "أكمل بيانات العميل أولاً لتفعيل الدفع.",
      missingCard: "أدخل بيانات البطاقة كاملة لتفعيل الدفع.",
      paymentReady: "النموذج جاهز. يمكنك الدفع الآن.",
      payNow: "ادفع وأكد",
      processing: "جارٍ تأكيد الدفع...",
      preparing: "جارٍ تجهيز نموذج الدفع الآمن...",
      paymentUnavailable: "الدفع غير متاح حالياً لهذا النوع.",
      seoTitle: "الدفع وإتمام الحجز | CVsolucion",
    };
  }

  if (locale === "fr") {
    return {
      title: "Paiement et validation",
      subtitle: "Revisez la commande, completez vos coordonnees, puis payez comme sur un vrai checkout de service.",
      empty: "Aucun horaire n'est dans le panier pour le moment.",
      orderSummary: "Resume de commande",
      lineItems: "Sessions choisies",
      invoice: "Facture",
      service: "Service",
      priority: "Priorite",
      package: "Forfait",
      subtotal: "Sous-total",
      taxes: "Taxes",
      total: "Total a payer",
      selectedCount: "Sessions",
      digitalNote: "Service numerique sans livraison. Chaque horaire choisi est facture comme une session distincte.",
      remove: "Retirer",
      details: "Coordonnees client",
      signInRequired: "La connexion est obligatoire avant de finaliser cette commande.",
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
      backToCart: "Retour au panier",
      backToBooking: "Retour au booking",
      success: "Booking confirme avec succes.",
      profileAutoFill: "Les informations ont ete remplies depuis votre compte et votre dernier booking.",
      paymentTitle: "Paiement",
      paymentSubtitle: "Entrez la carte puis confirmez la commande.",
      secure: "Paiement securise par Stripe",
      cardNumber: "Numero de carte",
      expiry: "Expiration",
      cvc: "CVC",
      missingCustomer: "Completez d'abord les coordonnees client.",
      missingCard: "Entrez tous les champs carte pour activer le paiement.",
      paymentReady: "Le paiement est pret.",
      payNow: "Payer et confirmer",
      processing: "Confirmation du paiement...",
      preparing: "Preparation du paiement securise...",
      paymentUnavailable: "Le paiement n'est pas disponible pour ce type actuellement.",
      seoTitle: "Paiement et validation | CVsolucion",
    };
  }

  return {
    title: "Checkout and payment",
    subtitle: "Review the order, complete your details, then pay like a proper digital-service checkout.",
    empty: "There are no appointments in your cart right now.",
    orderSummary: "Order summary",
    lineItems: "Selected sessions",
    invoice: "Invoice details",
    service: "Service",
    priority: "Priority",
    package: "Package",
    subtotal: "Subtotal",
    taxes: "Taxes",
    total: "Total due now",
    selectedCount: "Selected sessions",
    digitalNote: "This is a digital service with no shipping. Every selected appointment is billed as a separate session.",
    remove: "Remove",
    details: "Customer details",
    signInRequired: "You must sign in before completing this order.",
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
    backToCart: "Back to cart",
    backToBooking: "Back to booking",
    success: "Booking confirmed successfully.",
    profileAutoFill: "Your details were auto-filled from your account and latest booking.",
    paymentTitle: "Payment",
    paymentSubtitle: "Enter card details and confirm the order.",
    secure: "Secure payment by Stripe",
    cardNumber: "Card number",
    expiry: "Expiry",
    cvc: "CVC",
    missingCustomer: "Complete the customer details first.",
    missingCard: "Enter all card fields to enable payment.",
    paymentReady: "Payment is ready.",
    payNow: "Pay and confirm",
    processing: "Confirming payment...",
    preparing: "Preparing secure payment...",
    paymentUnavailable: "Payment is not available for this type right now.",
    seoTitle: "Checkout and payment | CVsolucion",
  };
}

function getPackageLabel(packageKey: string | null | undefined, locale: string) {
  if (!packageKey) return null;

  const labels = {
    en: { audit: "Audit", "fix-day": "Fix Day", "support-plan": "Annual Support Plan" },
    fr: { audit: "Audit", "fix-day": "Fix Day", "support-plan": "Plan de Support Annuel" },
    ar: { audit: "Audit", "fix-day": "Fix Day", "support-plan": "خطة الدعم السنوية" },
  } as const;

  const language = locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en";
  return labels[language][packageKey as keyof typeof labels.en] || packageKey;
}

function moneyLabel(amount: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default function BookingCheckout() {
  const { locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [draft, setDraft] = useState<BookingCheckoutDraft | null>(() => getBookingCheckoutDraft(user?.id ?? null));
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
  const dashboardHref = locale === "en" ? "/dashboard" : `/${locale}/dashboard`;
  const loginPath = locale === "en" ? "/login" : `/${locale}/login`;
  const loginHref = `${loginPath}?next=${encodeURIComponent(checkoutHref)}`;

  useEffect(() => {
    const sync = () => setDraft(getBookingCheckoutDraft(user?.id ?? null));
    sync();
    const eventName = getBookingCheckoutEventName();
    window.addEventListener(eventName, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener("storage", sync);
    };
  }, [user?.id]);

  useEffect(() => {
    getStripeBookingConfig()
      .then((response) => setStripeConfig(response))
      .catch(() => setStripeConfig({ enabled: false, publishableKey: null, currency: "usd", prices: {} }));
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    const draftLocation = draft?.countryCode
      ? [
          getBookingCountryLabel(draft.countryCode, locale),
          draft.regionCode ? getBookingRegionLabel(draft.countryCode, draft.regionCode, locale) : "",
        ]
          .filter(Boolean)
          .join(" - ")
      : "";

    setForm((current) => ({
      ...current,
      email: user.email,
      country: current.country || draftLocation,
    }));
  }, [draft?.countryCode, draft?.regionCode, locale, user?.email]);

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
  const currency = stripeConfig?.currency || "usd";
  const totalLabel = moneyLabel(totalAmount, locale, currency);
  const stripeEnabled = Boolean(stripeConfig?.enabled && stripeConfig.publishableKey && totalAmount > 0);
  const serviceLabel = draft ? (draft.serviceType === "support" ? copy.support : copy.consultation) : "";
  const priorityLabel = draft ? (draft.priority === "express" ? copy.express : copy.standard) : "";
  const packageLabel = draft ? getPackageLabel(draft.packageKey, locale) : null;
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
        if (!cancelled) {
          setPaymentClientSecret(response.clientSecret);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setStatus({ tone: "error", text: error.message });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPaymentLoading(false);
        }
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
        packageKey: draft.packageKey || undefined,
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
        window.location.href = dashboardHref;
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

          <BookingFlowSteps locale={locale} current="checkout" />

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
            <div className="mx-auto mt-12 grid max-w-7xl gap-8 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-6 xl:sticky xl:top-32 xl:self-start">
                <BookingOrderSummary
                  locale={locale}
                  currency={currency}
                  draft={draft}
                  unitAmount={unitAmount}
                  serviceLabel={serviceLabel}
                  priorityLabel={priorityLabel}
                  packageLabel={packageLabel}
                  labels={{
                    title: copy.orderSummary,
                    lineItems: copy.lineItems,
                    invoice: copy.invoice,
                    service: copy.service,
                    priority: copy.priority,
                    package: copy.package,
                    subtotal: copy.subtotal,
                    taxes: copy.taxes,
                    total: copy.total,
                    selectedCount: copy.selectedCount,
                    digitalNote: copy.digitalNote,
                    remove: copy.remove,
                  }}
                  onRemoveSlot={(slotId) => {
                    const nextDraft = removeBookingCheckoutSlot(slotId, user?.id ?? null);
                    setDraft(nextDraft);
                  }}
                />
              </div>

              <div className="space-y-6">
                <GlassCard className="card-static rounded-[32px] p-7">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-slate-950">{copy.details}</h2>
                    <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white/75">
                      <a href={cartHref}>{copy.backToCart}</a>
                    </Button>
                  </div>

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
                    <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
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
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="booking-company">{copy.company}</Label>
                        <Input id="booking-company" value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="booking-problem">{copy.problem}</Label>
                        <Textarea
                          id="booking-problem"
                          className="min-h-36"
                          value={form.problem}
                          onChange={(event) => setForm((current) => ({ ...current, problem: event.target.value }))}
                          required
                        />
                      </div>
                    </form>
                  )}
                </GlassCard>

                {!user ? null : stripeEnabled ? (
                  paymentLoading ? (
                    <GlassCard className="card-static rounded-[32px] p-7">
                      <div className="text-sm text-slate-500">{copy.preparing}</div>
                    </GlassCard>
                  ) : paymentClientSecret && stripeConfig?.publishableKey ? (
                    <StripePaymentForm
                      publishableKey={stripeConfig.publishableKey}
                      clientSecret={paymentClientSecret}
                      amountLabel={totalLabel}
                      billingReady={billingReady}
                      billingDetails={{
                        name: form.name,
                        email: form.email,
                        phone: form.phone,
                      }}
                      copy={{
                        title: copy.paymentTitle,
                        subtitle: copy.paymentSubtitle,
                        secure: copy.secure,
                        number: copy.cardNumber,
                        expiry: copy.expiry,
                        cvc: copy.cvc,
                        missingCustomer: copy.missingCustomer,
                        missingCard: copy.missingCard,
                        ready: copy.paymentReady,
                        payNow: saving ? copy.processing : copy.payNow,
                        processing: copy.processing,
                      }}
                      onSuccess={finalizeBooking}
                    />
                  ) : null
                ) : (
                  <GlassCard className="card-static rounded-[32px] p-7">
                    <div className="text-sm text-slate-500">{copy.paymentUnavailable}</div>
                  </GlassCard>
                )}

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
