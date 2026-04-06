import { CalendarDays, Clock3, ReceiptText, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import type { BookingCheckoutDraft, BookingCheckoutSlot } from "@/lib/bookingCheckout";
import { formatBookingDate, formatBookingTime } from "@/lib/bookingTime";

function moneyLabel(amount: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

type BookingOrderSummaryProps = {
  locale: string;
  currency: string;
  draft: BookingCheckoutDraft;
  unitAmount: number;
  serviceLabel: string;
  priorityLabel: string;
  packageLabel?: string | null;
  labels: {
    title: string;
    lineItems: string;
    invoice: string;
    service: string;
    priority: string;
    package: string;
    subtotal: string;
    taxes: string;
    total: string;
    selectedCount: string;
    digitalNote: string;
    remove: string;
    unavailable?: string;
    replace?: string;
    timeZoneNote?: string;
  };
  onRemoveSlot?: (slotId: string) => void;
  unavailableSlotIds?: string[];
  replaceSlotHref?: string;
};

function SlotRow({
  slot,
  locale,
  amount,
  currency,
  serviceLabel,
  timeZone,
  removeText,
  onRemoveSlot,
  isUnavailable,
  unavailableText,
  replaceText,
  replaceSlotHref,
}: {
  slot: BookingCheckoutSlot;
  locale: string;
  amount: number;
  currency: string;
  serviceLabel: string;
  timeZone: string;
  removeText: string;
  onRemoveSlot?: (slotId: string) => void;
  isUnavailable?: boolean;
  unavailableText?: string;
  replaceText?: string;
  replaceSlotHref?: string;
}) {
  return (
    <div className={`rounded-[24px] border p-5 shadow-[0_16px_35px_rgba(15,23,42,0.05)] ${isUnavailable ? "border-slate-300 bg-slate-100/90 opacity-80" : "border-slate-200 bg-white/85"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-slate-900">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              {formatBookingDate(slot.utcStart || `${slot.date}T${String(slot.hour).padStart(2, "0")}:00:00.000Z`, locale, timeZone)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <Clock3 className="h-5 w-5 text-primary" />
            <span>{formatBookingTime(slot.utcStart || `${slot.date}T${String(slot.hour).padStart(2, "0")}:00:00.000Z`, locale, timeZone)}</span>
          </div>
          <div className="text-sm text-slate-500">{serviceLabel}</div>
          {isUnavailable && unavailableText ? (
            <div className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {unavailableText}
            </div>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-950">{moneyLabel(amount, locale, currency)}</div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {isUnavailable && replaceSlotHref && replaceText ? (
              <Button asChild type="button" variant="outline" className="rounded-full border-slate-300 bg-white/80">
                <a href={replaceSlotHref}>{replaceText}</a>
              </Button>
            ) : null}
            {onRemoveSlot ? (
              <Button
                type="button"
                variant="ghost"
                className="rounded-full px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => onRemoveSlot(slot.id)}
              >
                <Trash2 className="h-4 w-4" />
                {removeText}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingOrderSummary({
  locale,
  currency,
  draft,
  unitAmount,
  serviceLabel,
  priorityLabel,
  packageLabel,
  labels,
  onRemoveSlot,
  unavailableSlotIds = [],
  replaceSlotHref,
}: BookingOrderSummaryProps) {
  const timeZone = draft.timeZone || "America/Toronto";
  const subtotal = unitAmount * draft.slots.length;
  const taxes = 0;
  const total = subtotal + taxes;

  return (
    <GlassCard className="card-static rounded-[32px] p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{labels.title}</h2>
            <div className="mt-1 text-sm text-slate-500">
              {labels.selectedCount}: {draft.slots.length}
            </div>
          </div>
        </div>
        <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          {moneyLabel(total, locale, currency)}
        </div>
      </div>

      <div className="mt-7">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{labels.lineItems}</div>
        <div className="mt-4 space-y-4">
          {draft.slots.map((slot) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              locale={locale}
              amount={unitAmount}
              currency={currency}
              serviceLabel={serviceLabel}
              timeZone={timeZone}
              removeText={labels.remove}
              onRemoveSlot={onRemoveSlot}
              isUnavailable={unavailableSlotIds.includes(slot.id)}
              unavailableText={labels.unavailable}
              replaceText={labels.replace}
              replaceSlotHref={replaceSlotHref}
            />
          ))}
        </div>
      </div>

      <div className="mt-7 rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3">
          <ReceiptText className="h-5 w-5 text-primary" />
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{labels.invoice}</div>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">{labels.service}</span>
            <span className="font-semibold text-slate-900">{serviceLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">{labels.priority}</span>
            <span className="font-semibold text-slate-900">{priorityLabel}</span>
          </div>
          {packageLabel ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">{labels.package}</span>
              <span className="font-semibold text-slate-900">{packageLabel}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">{labels.subtotal}</span>
            <span className="font-semibold text-slate-900">{moneyLabel(subtotal, locale, currency)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">{labels.taxes}</span>
            <span className="font-semibold text-slate-900">{moneyLabel(taxes, locale, currency)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <span className="text-base font-semibold text-slate-950">{labels.total}</span>
            <span className="text-3xl font-bold text-primary">{moneyLabel(total, locale, currency)}</span>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <span>{labels.digitalNote}{labels.timeZoneNote ? ` ${labels.timeZoneNote}` : ""}</span>
        </div>
      </div>
    </GlassCard>
  );
}
