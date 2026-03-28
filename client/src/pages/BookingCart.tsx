import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import BookingCartSummary from "@/components/booking/BookingCartSummary";
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
import { getStripeBookingConfig, type StripeConfigResponse } from "@/lib/stripeBooking";

function getCopy(locale: string) {
  if (locale === "ar") {
    return {
      title: "سلة الحجز",
      subtitle: "راجع الجلسات المختارة، احذف ما لا تريد، ثم انتقل إلى الدفع.",
      cart: "سلة الحجز",
      appointments: "الجلسات المختارة",
      invoice: "الفاتورة",
      empty: "لا توجد جلسات داخل السلة حالياً.",
      service: "الخدمة",
      priority: "الأولوية",
      subtotal: "المجموع الفرعي",
      tax: "الضرائب",
      total: "الإجمالي المستحق",
      remove: "إزالة",
      item: "جلسة",
      note: "خدمة رقمية بدون شحن. كل موعد مختار يُحاسب كجلسة مستقلة.",
      checkout: "الانتقال إلى الدفع",
      back: "متابعة اختيار المواعيد",
      signIn: "سجّل الدخول لإكمال الدفع",
      seoTitle: "سلة الحجز | CVsolucion",
    };
  }
  if (locale === "fr") {
    return {
      title: "Panier du booking",
      subtitle: "Revisez les sessions choisies, supprimez ce que vous ne voulez pas, puis passez au paiement.",
      cart: "Panier du booking",
      appointments: "Sessions choisies",
      invoice: "Facture",
      empty: "Aucune session n'est dans le panier pour le moment.",
      service: "Service",
      priority: "Priorite",
      subtotal: "Sous-total",
      tax: "Taxes",
      total: "Total a payer",
      remove: "Retirer",
      item: "Session",
      note: "Service numerique sans livraison. Chaque horaire choisi est facture comme une session separee.",
      checkout: "Passer au paiement",
      back: "Continuer le choix des horaires",
      signIn: "Connectez-vous pour finaliser le paiement",
      seoTitle: "Panier du booking | CVsolucion",
    };
  }
  return {
    title: "Booking cart",
    subtitle: "Review your selected sessions, remove what you do not want, then continue to payment.",
    cart: "Booking cart",
    appointments: "Selected sessions",
    invoice: "Invoice details",
    empty: "There are no sessions in your cart right now.",
    service: "Service",
    priority: "Priority",
    subtotal: "Subtotal",
    tax: "Taxes",
    total: "Total due now",
    remove: "Remove",
    item: "Session",
    note: "Digital service with no shipping. Each selected appointment is billed as a separate session.",
    checkout: "Continue to checkout",
    back: "Keep selecting times",
    signIn: "Sign in to complete payment",
    seoTitle: "Booking cart | CVsolucion",
  };
}

export default function BookingCart() {
  const { locale } = useI18n();
  const { user } = useAuth();
  const [draft, setDraft] = useState<BookingCheckoutDraft | null>(() => getBookingCheckoutDraft());
  const [stripeConfig, setStripeConfig] = useState<StripeConfigResponse | null>(null);

  const copy = useMemo(() => getCopy(locale), [locale]);
  const bookingHref = locale === "en" ? "/book" : `/${locale}/book`;
  const checkoutHref = locale === "en" ? "/book/checkout" : `/${locale}/book/checkout`;
  const loginHref = `${locale === "en" ? "/login" : `/${locale}/login`}?next=${encodeURIComponent(checkoutHref)}`;

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

  const unitAmount = draft ? stripeConfig?.prices?.[`${draft.priority}:${draft.serviceType}`] ?? 0 : 0;
  const serviceLabel =
    draft
      ? draft.serviceType === "support"
        ? locale === "ar"
          ? "دعم"
          : "Support"
        : locale === "ar"
          ? "استشارة"
          : "Consultation"
      : "";
  const priorityLabel =
    draft
      ? draft.priority === "express"
        ? locale === "ar"
          ? "إكسبريس"
          : locale === "fr"
            ? "Express"
            : "Express"
        : locale === "ar"
          ? "عادي"
          : locale === "fr"
            ? "Standard"
            : "Standard"
      : "";

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

          <div className="mx-auto mt-12 max-w-6xl">
            {!draft || !draft.slots.length ? (
              <GlassCard className="card-static rounded-[32px] p-8 text-center">
                <p className="text-base leading-7 text-slate-600">{copy.empty}</p>
                <Button asChild className="mt-6 rounded-full bg-primary text-white hover:bg-primary/90">
                  <a href={bookingHref}>{copy.back}</a>
                </Button>
              </GlassCard>
            ) : (
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
                actionLabel={user ? copy.checkout : copy.signIn}
                actionHref={user ? checkoutHref : loginHref}
                secondaryActionLabel={copy.back}
                secondaryActionHref={bookingHref}
                onRemoveSlot={(slotId) => {
                  const nextDraft = removeBookingCheckoutSlot(slotId);
                  setDraft(nextDraft);
                }}
              />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
