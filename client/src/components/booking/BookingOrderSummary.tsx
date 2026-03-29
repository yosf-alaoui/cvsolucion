import { CalendarDays, Clock3, ReceiptText, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import type { BookingCheckoutDraft, BookingCheckoutSlot } from "@/lib/bookingCheckout";

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
  };
  onRemoveSlot?: (slotId: string) => void;
};

function SlotRow({
  slot,
  locale,
  amount,
  currency,
  serviceLabel,
  removeText,
  onRemoveSlot,
}: {
  slot: BookingCheckoutSlot;
  locale: string;
  amount: number;
  currency: string;
  serviceLabel: string;
  removeText: string;
  onRemoveSlot?: (slotId: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/85 p-5 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-slate-900">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-semibold">{dateLabel(slot.date, locale)}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <Clock3 className="h-5 w-5 text-primary" />
            <span>{timeLabel(slot.hour, locale)}</span>
          </div>
          <div className="text-sm text-slate-500">{serviceLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-950">{moneyLabel(amount, locale, currency)}</div>
          {onRemoveSlot ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-3 rounded-full px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onRemoveSlot(slot.id)}
            >
              <Trash2 className="h-4 w-4" />
              {removeText}
            </Button>
          ) : null}
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
}: BookingOrderSummaryProps) {
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
              removeText={labels.remove}
              onRemoveSlot={onRemoveSlot}
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
          <span>{labels.digitalNote}</span>
        </div>
      </div>
    </GlassCard>
  );
}
