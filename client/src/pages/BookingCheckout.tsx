import { useEffect, useMemo, useRef, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  clearBookingCheckoutDraft,
  getBookingCheckoutDraft,
  getBookingCheckoutEventName,
  removeBookingCheckoutSlot,
  type BookingCheckoutDraft,
} from "@/lib/bookingCheckout";
import { createBooking, getBookingAvailability, type BookingAvailabilityResponse } from "@/lib/bookings";
import { getCustomerDashboard } from "@/lib/customer";
import { getBookingCountryLabel, getBookingCountryOptions, getBookingRegionLabel } from "@/lib/bookingTime";
import { buildInternationalPhone, getDefaultPhoneCountryCode, getPhoneCountryOptions, splitInternationalPhone } from "@/lib/phone";
import { createBookingPaymentIntent, getStripeBookingConfig, type StripeConfigResponse } from "@/lib/stripeBooking";
import { trackFunnelEvent } from "@/lib/analytics";
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
      cardFee: "رسوم الدفع بالبطاقة",
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
      company: "الشركة (اختياري)",
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
      continuePayment: "متابعة إلى الدفع الآمن",
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
      cardFee: "Frais de paiement par carte",
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
      company: "Societe (facultatif)",
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
      continuePayment: "Continuer vers le paiement securise",
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
    cardFee: "Card payment fee",
    taxes: "Taxes",
    total: "Total due now",
    selectedCount: "Selected sessions",
    digitalNote: "This is a digital service with no shipping. Every selected appointment is billed as a separate session.",
    remove: "Remove",
    unavailable: "No longer available",
    replace: "Replace slot",
    details: "Customer details",
    signInRequired: "You must sign in before completing this order.",
    signIn: "Sign in",
    name: "Name",
    email: "Email",
    phone: "Phone / WhatsApp",
    country: "Country",
    company: "Company (optional)",
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
    continuePayment: "Continue to secure payment",
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

function firstCountryCode(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim()) || "CA";
}

function createCheckoutAttemptId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `checkout_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export default function BookingCheckout() {
  const { locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const currentDraftOwner = authLoading ? undefined : user?.id ?? null;
  const [draft, setDraft] = useState<BookingCheckoutDraft | null>(() => getBookingCheckoutDraft(currentDraftOwner));
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<StripeConfigResponse | null>(null);
  const [availability, setAvailability] = useState<BookingAvailabilityResponse | null>(null);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const paymentRequestId = useRef(0);
  const checkoutAttemptId = useRef<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    phoneCountryCode: "",
    country: "",
    countryCode: "",
    company: "",
    problem: "",
  });

  const copy = useMemo(() => getCopy(locale), [locale]);
  const countryOptions = useMemo(() => getBookingCountryOptions(locale), [locale]);
  const phoneCountryOptions = useMemo(() => getPhoneCountryOptions(locale), [locale]);
  const bookingHref = locale === "en" ? "/book" : `/${locale}/book`;
  const cartHref = locale === "en" ? "/book/cart" : `/${locale}/book/cart`;
  const checkoutHref = locale === "en" ? "/book/checkout" : `/${locale}/book/checkout`;
  const dashboardHref = locale === "en" ? "/dashboard" : `/${locale}/dashboard`;
  const loginPath = locale === "en" ? "/login" : `/${locale}/login`;
  const loginHref = `${loginPath}?next=${encodeURIComponent(checkoutHref)}`;
  const pricingCountryCode = form.countryCode || draft?.countryCode || null;

  useEffect(() => {
    const sync = () => setDraft(getBookingCheckoutDraft(currentDraftOwner));
    sync();
    const eventName = getBookingCheckoutEventName();
    window.addEventListener(eventName, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener("storage", sync);
    };
  }, [currentDraftOwner]);

  useEffect(() => {
    let cancelled = false;
    setStripeConfig(null);
    getStripeBookingConfig(pricingCountryCode)
      .then((response) => {
        if (!cancelled) setStripeConfig(response);
      })
      .catch(() => {
        if (!cancelled) {
          setStripeConfig({ enabled: false, publishableKey: null, currency: "usd", cardPaymentFeeCents: 1500, prices: {} });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pricingCountryCode]);

  useEffect(() => {
    if (!user || !draft?.slots.length) {
      setAvailability(null);
      setAvailabilityError(false);
      return;
    }

    setAvailabilityError(false);
    getBookingAvailability(draft.priority)
      .then((response) => {
        setAvailability(response);
        setAvailabilityError(false);
      })
      .catch(() => {
        setAvailability(null);
        setAvailabilityError(true);
      });
  }, [draft?.priority, draft?.slots.length, user]);

  useEffect(() => {
    if (!user?.email) return;
    const draftCountryCode = draft?.countryCode || "";
    const draftRegionCode = draft?.regionCode || "";
    const draftLocation = draftCountryCode
      ? [
          getBookingCountryLabel(draftCountryCode, locale),
          draftRegionCode ? getBookingRegionLabel(draftCountryCode, draftRegionCode, locale) : "",
        ]
          .filter(Boolean)
          .join(" - ")
      : "";

    setForm((current) => ({
      ...current,
      email: user.email,
      countryCode: current.countryCode || draftCountryCode,
      country: current.country || draftLocation,
      phoneCountryCode: current.phoneCountryCode || getDefaultPhoneCountryCode(draftCountryCode),
    }));
  }, [draft?.countryCode, draft?.regionCode, locale, user?.email]);

  useEffect(() => {
    if (!user) return;
    getCustomerDashboard()
      .then((response) => {
        const latestBooking = [...response.bookings]
          .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0];

        const profileCountryCode = firstCountryCode(response.profile.countryCode, latestBooking?.countryCode, draft?.countryCode);

        setForm((current) => ({
          ...current,
          name: current.name || response.profile.name || latestBooking?.name || "",
          email: user.email,
          phone: current.phone || splitInternationalPhone(response.profile.phone || latestBooking?.phone, current.countryCode || profileCountryCode).localPhone,
          phoneCountryCode:
            current.phoneCountryCode ||
            splitInternationalPhone(response.profile.phone || latestBooking?.phone, current.countryCode || profileCountryCode).phoneCountryCode,
          countryCode: current.countryCode || profileCountryCode,
          country: current.country || getBookingCountryLabel(current.countryCode || profileCountryCode, locale) || response.profile.country || latestBooking?.country || "",
          company: current.company || response.profile.company || latestBooking?.company || "",
        }));

        setStatus((current) => current ?? { tone: "success", text: copy.profileAutoFill });
      })
      .catch(() => {});
  }, [copy.profileAutoFill, user]);

  const unitAmount = draft ? stripeConfig?.prices?.[`${draft.priority}:${draft.serviceType}`] ?? 0 : 0;
  const subtotalAmount = unitAmount * (draft?.slots.length || 0);
  const cardPaymentFeeCents = subtotalAmount > 0 ? stripeConfig?.cardPaymentFeeCents ?? 0 : 0;
  const totalAmount = subtotalAmount + cardPaymentFeeCents;
  const currency = stripeConfig?.currency || "usd";
  const totalLabel = moneyLabel(totalAmount, locale, currency);
  const stripeEnabled = Boolean(stripeConfig?.enabled && stripeConfig.publishableKey && totalAmount > 0);
  const serviceLabel = draft ? (draft.serviceType === "support" ? copy.support : copy.consultation) : "";
  const priorityLabel = draft ? (draft.priority === "express" ? copy.express : copy.standard) : "";
  const packageLabel = draft ? getPackageLabel(draft.packageKey, locale) : null;
  const bookingAnalyticsItems = draft
    ? [
        {
          item_id: `booking_${draft.serviceType}_${draft.priority}`,
          item_name: `${serviceLabel} - ${priorityLabel}`,
          item_category: "booking",
          item_variant: draft.priority,
          price: unitAmount / 100,
          quantity: draft.slots.length,
        },
        ...(cardPaymentFeeCents > 0
          ? [
              {
                item_id: "card_payment_fee",
                item_name: copy.cardFee,
                item_category: "fee",
                item_variant: "card",
                price: cardPaymentFeeCents / 100,
                quantity: 1,
              },
            ]
          : []),
      ]
    : [];
  const unavailableLabel =
    "unavailable" in copy ? copy.unavailable : locale === "ar" ? "غير متاح الآن" : locale === "fr" ? "Plus disponible" : "No longer available";
  const replaceLabel =
    "replace" in copy ? copy.replace : locale === "ar" ? "استبدال الموعد" : locale === "fr" ? "Remplacer l'horaire" : "Replace slot";
  const availableSlotIds = useMemo(() => {
    if (!availability) return new Set<string>();
    return new Set(
      availability.days.flatMap((day) => day.slots).filter((slot) => slot.status === "available").map((slot) => slot.id)
    );
  }, [availability]);
  const availabilityReady = Boolean(
    availability && draft && availability.priority === draft.priority,
  );
  const availabilityChecked = availabilityReady || availabilityError;
  const unavailableSlotIds = useMemo(
    () =>
      availabilityReady
        ? draft?.slots
            .filter((slot) => !availableSlotIds.has(slot.id))
            .map((slot) => slot.id) ?? []
        : [],
    [availabilityReady, availableSlotIds, draft?.slots]
  );
  const availabilityErrorText =
    locale === "ar"
      ? "تعذر تحديث حالة المواعيد الآن. سيتحقق الخادم منها مرة أخرى قبل إنشاء الدفع."
      : locale === "fr"
        ? "Impossible d'actualiser les disponibilités. Le serveur les vérifiera à nouveau avant de créer le paiement."
        : "We could not refresh availability. The server will verify it again before creating the payment.";
  const normalizedPhone = buildInternationalPhone(
    form.phoneCountryCode || pricingCountryCode,
    form.phone,
  );
  const billingReady = Boolean(
    form.name.trim().length >= 2 &&
      form.name.trim().length <= 120 &&
      form.email.trim() &&
      normalizedPhone.replace(/\D/g, "").length >= 6 &&
      normalizedPhone.length <= 40 &&
      pricingCountryCode &&
      form.company.trim().length <= 160 &&
      form.problem.trim().length >= 10 &&
      form.problem.trim().length <= 500,
  );
  const replaceHref = draft
    ? `${bookingHref}?priority=${encodeURIComponent(draft.priority)}&service=${encodeURIComponent(draft.serviceType)}${draft.packageKey ? `&package=${encodeURIComponent(draft.packageKey)}` : ""}`
    : bookingHref;

  useEffect(() => {
    paymentRequestId.current += 1;
    checkoutAttemptId.current = null;
    setPaymentClientSecret(null);
    setPaymentLoading(false);
  }, [
    availabilityChecked,
    billingReady,
    draft,
    form.company,
    form.name,
    form.problem,
    locale,
    normalizedPhone,
    pricingCountryCode,
    stripeEnabled,
    unavailableSlotIds.length,
    user,
  ]);

  async function handlePreparePayment() {
    if (
      !user ||
      !draft ||
      !draft.slots.length ||
      !stripeEnabled ||
      !billingReady ||
      !availabilityChecked ||
      unavailableSlotIds.length > 0 ||
      paymentLoading ||
      paymentClientSecret
    ) {
      return;
    }

    const requestId = ++paymentRequestId.current;
    const attemptId = checkoutAttemptId.current || createCheckoutAttemptId();
    checkoutAttemptId.current = attemptId;
    setStatus(null);
    setPaymentLoading(true);
    trackFunnelEvent("begin_checkout", {
      currency: currency.toUpperCase(),
      value: totalAmount / 100,
      service_type: draft.serviceType,
      priority: draft.priority,
      slot_count: draft.slots.length,
      items: bookingAnalyticsItems,
    });
    try {
      const response = await createBookingPaymentIntent({
        serviceType: draft.serviceType,
        priority: draft.priority,
        countryCode: pricingCountryCode,
        slots: draft.slots.map((slot) => ({ date: slot.date, hour: slot.hour })),
        locale,
        checkoutAttemptId: attemptId,
        name: form.name.trim(),
        phone: normalizedPhone,
        company: form.company.trim() || null,
        notes: form.problem.trim(),
        packageKey: draft.packageKey || null,
      });
      if (requestId === paymentRequestId.current) {
        setPaymentClientSecret(response.clientSecret);
        trackFunnelEvent("payment_form_opened", {
          currency: currency.toUpperCase(),
          value: totalAmount / 100,
          service_type: draft.serviceType,
          priority: draft.priority,
          slot_count: draft.slots.length,
          items: bookingAnalyticsItems,
        });
      }
    } catch (error) {
      if (requestId === paymentRequestId.current) {
        trackFunnelEvent("checkout_error", {
          checkout_stage: "payment_intent_creation",
          error_type: error instanceof Error ? error.name : "unknown",
          service_type: draft.serviceType,
          priority: draft.priority,
          slot_count: draft.slots.length,
        });
        setStatus({
          tone: "error",
          text: error instanceof Error ? error.message : copy.paymentUnavailable,
        });
      }
    } finally {
      if (requestId === paymentRequestId.current) {
        setPaymentLoading(false);
      }
    }
  }

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
        phone: buildInternationalPhone(form.phoneCountryCode || pricingCountryCode, form.phone),
        country: pricingCountryCode ? getBookingCountryLabel(pricingCountryCode, locale) : form.country,
        countryCode: pricingCountryCode || undefined,
        company: form.company,
        notes: form.problem,
        paymentIntentId,
        locale,
      });

      trackFunnelEvent("purchase", {
        transaction_id: paymentIntentId,
        currency: currency.toUpperCase(),
        value: totalAmount / 100,
        service_type: draft.serviceType,
        priority: draft.priority,
        slot_count: draft.slots.length,
        items: bookingAnalyticsItems,
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
      <Seo title={copy.seoTitle} description={copy.subtitle} type="website" robots="noindex, nofollow" />
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
                  cardPaymentFeeCents={cardPaymentFeeCents}
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
                    cardFee: copy.cardFee,
                    taxes: copy.taxes,
                    total: copy.total,
                    selectedCount: copy.selectedCount,
                    digitalNote: copy.digitalNote,
                    remove: copy.remove,
                    unavailable: unavailableLabel,
                    replace: replaceLabel,
                  }}
                  onRemoveSlot={(slotId) => {
                    const nextDraft = removeBookingCheckoutSlot(slotId, user?.id ?? null);
                    setDraft(nextDraft);
                  }}
                  unavailableSlotIds={unavailableSlotIds}
                  replaceSlotHref={replaceHref}
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
                        <a href={loginHref} rel="nofollow">
                          {copy.signIn}
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
                      <div className="space-y-2">
                        <Label htmlFor="booking-name">{copy.name}</Label>
                        <Input id="booking-name" value={form.name} minLength={2} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="booking-email">{copy.email}</Label>
                        <Input id="booking-email" type="email" value={form.email} readOnly disabled className="opacity-80" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="booking-phone">{copy.phone}</Label>
                        <div className="grid grid-cols-[minmax(120px,150px)_1fr] gap-2">
                          <Select
                            value={form.phoneCountryCode || getDefaultPhoneCountryCode(pricingCountryCode)}
                            onValueChange={(phoneCountryCode) => setForm((current) => ({ ...current, phoneCountryCode }))}
                          >
                            <SelectTrigger id="booking-phone-code" className="w-full bg-white">
                              <SelectValue placeholder="+1" />
                            </SelectTrigger>
                            <SelectContent>
                              {phoneCountryOptions.map((option) => (
                                <SelectItem key={option.code} value={option.code}>
                                  +{option.callingCode} {option.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input id="booking-phone" value={form.phone} maxLength={40} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="booking-country">{copy.country}</Label>
                        <Select
                          value={pricingCountryCode || ""}
                          onValueChange={(countryCode) =>
                            setForm((current) => ({
                              ...current,
                              countryCode,
                              country: getBookingCountryLabel(countryCode, locale),
                              phoneCountryCode: getDefaultPhoneCountryCode(countryCode),
                            }))
                          }
                        >
                          <SelectTrigger id="booking-country" className="w-full bg-white">
                            <SelectValue placeholder={copy.country} />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((option) => (
                              <SelectItem key={option.code} value={option.code}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="booking-company">{copy.company}</Label>
                        <Input id="booking-company" value={form.company} maxLength={160} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="booking-problem">{copy.problem}</Label>
                        <Textarea
                          id="booking-problem"
                          className="min-h-36"
                          value={form.problem}
                          minLength={10}
                          maxLength={500}
                          onChange={(event) => setForm((current) => ({ ...current, problem: event.target.value }))}
                          required
                        />
                        <p className={`text-xs ${form.problem.trim().length > 0 && form.problem.trim().length < 10 ? "text-rose-600" : "text-slate-500"}`}>
                          {locale === "ar"
                            ? "اكتب 10 أحرف على الأقل."
                            : locale === "fr"
                              ? "Saisissez au moins 10 caracteres."
                              : "Enter at least 10 characters."}
                        </p>
                      </div>
                    </form>
                  )}
                </GlassCard>

                {user && availabilityError ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
                    {availabilityErrorText}
                  </div>
                ) : null}

                {!user ? null : !availabilityChecked ? (
                  <GlassCard className="card-static rounded-[32px] p-7">
                    <div className="text-sm text-slate-500">{copy.preparing}</div>
                  </GlassCard>
                ) : unavailableSlotIds.length > 0 ? (
                  <GlassCard className="card-static rounded-[32px] p-7">
                    <div className="text-sm text-slate-500">
                      {locale === "ar"
                        ? `${unavailableLabel}. احذفه أو قم باستبداله قبل الدفع.`
                        : locale === "fr"
                          ? `${unavailableLabel}. Retirez-le ou utilisez "${String(replaceLabel).toLowerCase()}" avant le paiement.`
                          : `${unavailableLabel}. Remove it or use ${String(replaceLabel).toLowerCase()} before payment.`}
                    </div>
                  </GlassCard>
                ) : stripeEnabled ? (
                  !billingReady ? (
                    <GlassCard className="card-static rounded-[32px] p-7">
                      <div className="text-sm text-slate-500">{copy.missingCustomer}</div>
                    </GlassCard>
                  ) : paymentLoading ? (
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
                        phone: buildInternationalPhone(form.phoneCountryCode || pricingCountryCode, form.phone),
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
                      analyticsParams={{
                        currency: currency.toUpperCase(),
                        value: totalAmount / 100,
                        service_type: draft.serviceType,
                        priority: draft.priority,
                        slot_count: draft.slots.length,
                        items: bookingAnalyticsItems,
                      }}
                      allowManualCapture
                      onSuccess={finalizeBooking}
                    />
                  ) : (
                    <Button
                      type="button"
                      onClick={handlePreparePayment}
                      data-track="cta"
                      className="h-12 w-full rounded-full bg-primary text-white hover:bg-primary/90"
                    >
                      {copy.continuePayment}
                    </Button>
                  )
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
