import { useEffect, useMemo, useState } from "react";
import BookingFlowSteps from "@/components/booking/BookingFlowSteps";
import BookingOrderSummary from "@/components/booking/BookingOrderSummary";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import {
  getBookingCheckoutDraft,
  getBookingCheckoutEventName,
  removeBookingCheckoutSlot,
  type BookingCheckoutDraft,
} from "@/lib/bookingCheckout";
import { getBookingCountryLabel, getBookingRegionLabel } from "@/lib/bookingTime";
import { getBookingAvailability, type BookingAvailabilityResponse } from "@/lib/bookings";
import { getStripeBookingConfig, type StripeConfigResponse } from "@/lib/stripeBooking";

function getCopy(locale: string) {
  if (locale === "ar") {
    return {
      title: "سلة الحجز",
      subtitle: "راجع الجلسات المختارة، احذف ما لا تريده، ثم انتقل إلى الدفع.",
      empty: "لا توجد جلسات داخل السلة حالياً.",
      orderSummary: "سلة الحجز",
      lineItems: "الجلسات المختارة",
      invoice: "تفاصيل الفاتورة",
      service: "الخدمة",
      priority: "الأولوية",
      package: "الباقة",
      subtotal: "المجموع الفرعي",
      cardFee: "رسوم الدفع بالبطاقة",
      taxes: "الضرائب",
      total: "الإجمالي المستحق",
      selectedCount: "عدد الجلسات",
      digitalNote: "كل موعد مختار يُحاسب كجلسة مستقلة ويمكنك حذفه قبل الانتقال إلى الدفع.",
      remove: "إزالة",
      consultation: "استشارة",
      support: "دعم",
      standard: "عادي",
      express: "إكسبريس",
      checkout: "الانتقال إلى الدفع",
      back: "متابعة اختيار المواعيد",
      signIn: "سجل الدخول لإتمام الدفع",
      seoTitle: "سلة الحجز | CVsolucion",
    };
  }

  if (locale === "fr") {
    return {
      title: "Panier du booking",
      subtitle: "Revisez les sessions choisies, retirez ce que vous ne voulez pas, puis passez au paiement.",
      empty: "Aucune session n'est dans le panier pour le moment.",
      orderSummary: "Panier du booking",
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
      digitalNote: "Chaque horaire choisi est facture comme une session distincte et peut etre retire avant le paiement.",
      remove: "Retirer",
      consultation: "Consultation",
      support: "Support",
      standard: "Standard",
      express: "Express",
      checkout: "Continuer vers le paiement",
      back: "Continuer le choix des horaires",
      signIn: "Connectez-vous pour payer",
      seoTitle: "Panier du booking | CVsolucion",
    };
  }

  return {
    title: "Booking cart",
    subtitle: "Review the sessions you selected, remove what you do not want, then continue to payment.",
    empty: "There are no sessions in your cart right now.",
    orderSummary: "Booking cart",
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
    digitalNote: "Every selected appointment is billed as a separate session and can be removed before payment.",
    remove: "Remove",
    unavailable: "No longer available",
    replace: "Replace slot",
    consultation: "Consultation",
    support: "Support",
    standard: "Standard",
    express: "Express",
    checkout: "Continue to checkout",
    back: "Keep selecting times",
    signIn: "Sign in to pay",
    seoTitle: "Booking cart | CVsolucion",
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

export default function BookingCart() {
  const { locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const currentDraftOwner = authLoading ? undefined : user?.id ?? null;
  const [draft, setDraft] = useState<BookingCheckoutDraft | null>(() => getBookingCheckoutDraft(currentDraftOwner));
  const [stripeConfig, setStripeConfig] = useState<StripeConfigResponse | null>(null);
  const [availability, setAvailability] = useState<BookingAvailabilityResponse | null>(null);

  const copy = useMemo(() => getCopy(locale), [locale]);
  const bookingHref = locale === "en" ? "/book" : `/${locale}/book`;
  const checkoutHref = locale === "en" ? "/book/checkout" : `/${locale}/book/checkout`;
  const loginHref = `${locale === "en" ? "/login" : `/${locale}/login`}?next=${encodeURIComponent(checkoutHref)}`;

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
    getStripeBookingConfig()
      .then((response) => setStripeConfig(response))
      .catch(() => setStripeConfig({ enabled: false, publishableKey: null, currency: "usd", cardPaymentFeeCents: 1500, prices: {} }));
  }, []);

  useEffect(() => {
    if (!user || !draft?.slots.length) {
      setAvailability(null);
      return;
    }

    getBookingAvailability(draft.priority)
      .then((response) => setAvailability(response))
      .catch(() => setAvailability(null));
  }, [draft?.priority, draft?.slots.length, user]);

  const unitAmount = draft ? stripeConfig?.prices?.[`${draft.priority}:${draft.serviceType}`] ?? 0 : 0;
  const serviceLabel = draft ? (draft.serviceType === "support" ? copy.support : copy.consultation) : "";
  const priorityLabel = draft ? (draft.priority === "express" ? copy.express : copy.standard) : "";
  const packageLabel = draft ? getPackageLabel(draft.packageKey, locale) : null;
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
  const unavailableSlotIds = useMemo(
    () => draft?.slots.filter((slot) => !availableSlotIds.has(slot.id)).map((slot) => slot.id) ?? [],
    [availableSlotIds, draft?.slots]
  );
  const localizedArea = draft?.countryCode
    ? [
        getBookingCountryLabel(draft.countryCode, locale),
        draft.regionCode ? getBookingRegionLabel(draft.countryCode, draft.regionCode, locale) : "",
      ]
        .filter(Boolean)
        .join(" - ")
    : "";

  const timeZoneNote = draft?.countryCode
    ? locale === "ar"
      ? `المواعيد المعروضة الآن حسب توقيت ${localizedArea} بينما يبقى المرجع الداخلي على توقيت كيبيك.`
      : locale === "fr"
        ? `Les horaires sont affiches en heure de ${localizedArea} tout en gardant le planning interne sur l'heure du Quebec.`
        : `Times are shown in ${localizedArea} local time while internal scheduling stays on Quebec time.`
    : undefined;
  const replaceHref = draft
    ? `${bookingHref}?priority=${encodeURIComponent(draft.priority)}&service=${encodeURIComponent(draft.serviceType)}${draft.packageKey ? `&package=${encodeURIComponent(draft.packageKey)}` : ""}`
    : bookingHref;

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

          <BookingFlowSteps locale={locale} current="cart" />

          <div className="mx-auto mt-12 max-w-6xl">
            {!draft || !draft.slots.length ? (
              <GlassCard className="card-static rounded-[32px] p-8 text-center">
                <p className="text-base leading-7 text-slate-600">{copy.empty}</p>
                <Button asChild className="mt-6 rounded-full bg-primary text-white hover:bg-primary/90">
                  <a href={bookingHref}>{copy.back}</a>
                </Button>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                <BookingOrderSummary
                  locale={locale}
                  currency={stripeConfig?.currency || "usd"}
                  draft={draft}
                  unitAmount={unitAmount}
                  cardPaymentFeeCents={stripeConfig?.cardPaymentFeeCents ?? 0}
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
                    timeZoneNote,
                  }}
                  onRemoveSlot={(slotId) => {
                    const nextDraft = removeBookingCheckoutSlot(slotId, user?.id ?? null);
                    setDraft(nextDraft);
                  }}
                  unavailableSlotIds={unavailableSlotIds}
                  replaceSlotHref={replaceHref}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white/80">
                    <a href={bookingHref}>{copy.back}</a>
                  </Button>
                  <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90" disabled={unavailableSlotIds.length > 0}>
                    <a href={user ? checkoutHref : loginHref}>{user ? copy.checkout : copy.signIn}</a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
