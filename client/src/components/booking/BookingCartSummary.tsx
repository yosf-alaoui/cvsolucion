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

type BookingCartSummaryProps = {
  draft: BookingCheckoutDraft;
  locale: string;
  currency: string;
  unitAmount: number;
  cardPaymentFeeCents?: number;
  serviceLabel: string;
  priorityLabel: string;
  packageLabel?: string | null;
  title: string;
  appointmentsLabel: string;
  invoiceLabel: string;
  emptyLabel: string;
  serviceText: string;
  priorityText: string;
  packageText: string;
  subtotalText: string;
  cardFeeText?: string;
  taxText: string;
  totalText: string;
  removeText: string;
  itemLabel: string;
  digitalNote: string;
  timeZoneNote?: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onRemoveSlot?: (slotId: string) => void;
};

function SlotCard({
  slot,
  index,
  locale,
  unitAmount,
  currency,
  itemLabel,
  priorityLabel,
  serviceLabel,
  timeZone,
  removeText,
  onRemoveSlot,
}: {
  slot: BookingCheckoutSlot;
  index: number;
  locale: string;
  unitAmount: number;
  currency: string;
  itemLabel: string;
  priorityLabel: string;
  serviceLabel: string;
  timeZone: string;
  removeText: string;
  onRemoveSlot?: (slotId: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {itemLabel} {index + 1}
          </div>
          <div className="mt-3 flex items-center gap-3 text-slate-900">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              {formatBookingDate(slot.utcStart || `${slot.date}T${String(slot.hour).padStart(2, "0")}:00:00.000Z`, locale, timeZone)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-slate-600">
            <Clock3 className="h-5 w-5 text-primary" />
            <span>{formatBookingTime(slot.utcStart || `${slot.date}T${String(slot.hour).padStart(2, "0")}:00:00.000Z`, locale, timeZone)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{priorityLabel}</div>
          <div className="mt-2 font-semibold text-slate-900">{moneyLabel(unitAmount, locale, currency)}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div className="text-sm text-slate-500">{serviceLabel}</div>
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
  );
}

export default function BookingCartSummary({
  draft,
  locale,
  currency,
  unitAmount,
  cardPaymentFeeCents = 0,
  serviceLabel,
  priorityLabel,
  packageLabel,
  title,
  appointmentsLabel,
  invoiceLabel,
  emptyLabel,
  serviceText,
  priorityText,
  packageText,
  subtotalText,
  cardFeeText,
  taxText,
  totalText,
  removeText,
  itemLabel,
  digitalNote,
  timeZoneNote,
  actionLabel,
  actionDisabled,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onRemoveSlot,
}: BookingCartSummaryProps) {
  const timeZone = draft.timeZone || "America/Toronto";
  const subtotal = unitAmount * draft.slots.length;
  const cardPaymentFee = subtotal > 0 ? cardPaymentFeeCents : 0;
  const taxes = 0;
  const total = subtotal + cardPaymentFee + taxes;

  return (
    <GlassCard className="card-static rounded-[32px] p-7">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
      </div>

      {!draft.slots.length ? (
        <p className="mt-6 text-base leading-7 text-slate-600">{emptyLabel}</p>
      ) : (
        <>
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{appointmentsLabel}</div>
            <div className="mt-4 space-y-4">
              {draft.slots.map((slot, index) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  index={index}
                  locale={locale}
                  unitAmount={unitAmount}
                  currency={currency}
                  itemLabel={itemLabel}
                  priorityLabel={priorityLabel}
                  serviceLabel={serviceLabel}
                  timeZone={timeZone}
                  removeText={removeText}
                  onRemoveSlot={onRemoveSlot}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-primary" />
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{invoiceLabel}</div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              {draft.slots.map((slot) => (
                <div key={`invoice-${slot.id}`} className="grid grid-cols-[1fr_auto] gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                  <div>
                      <div className="font-semibold text-slate-900">{serviceLabel}</div>
                      <div className="mt-1 text-slate-500">
                      {formatBookingDate(slot.utcStart || `${slot.date}T${String(slot.hour).padStart(2, "0")}:00:00.000Z`, locale, timeZone)} · {formatBookingTime(slot.utcStart || `${slot.date}T${String(slot.hour).padStart(2, "0")}:00:00.000Z`, locale, timeZone)}
                      </div>
                    </div>
                  <div className="text-right font-semibold text-slate-900">{moneyLabel(unitAmount, locale, currency)}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">{serviceText}</span>
                <span className="font-semibold text-slate-900">{serviceLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">{priorityText}</span>
                <span className="font-semibold text-slate-900">{priorityLabel}</span>
              </div>
              {packageLabel ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">{packageText}</span>
                  <span className="font-semibold text-slate-900">{packageLabel}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">{subtotalText}</span>
                <span className="font-semibold text-slate-900">{moneyLabel(subtotal, locale, currency)}</span>
              </div>
              {cardPaymentFee > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">{cardFeeText || "Card payment fee"}</span>
                  <span className="font-semibold text-slate-900">{moneyLabel(cardPaymentFee, locale, currency)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">{taxText}</span>
                <span className="font-semibold text-slate-900">{moneyLabel(taxes, locale, currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                <span className="text-base font-semibold text-slate-950">{totalText}</span>
                <span className="text-2xl font-bold text-primary">{moneyLabel(total, locale, currency)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>{digitalNote}{timeZoneNote ? ` ${timeZoneNote}` : ""}</span>
            </div>
          </div>

          {actionLabel || secondaryActionLabel ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {secondaryActionLabel && secondaryActionHref ? (
                <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white/75">
                  <a href={secondaryActionHref}>{secondaryActionLabel}</a>
                </Button>
              ) : null}
              {actionLabel ? (
                actionHref ? (
                  <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90" disabled={actionDisabled}>
                    <a href={actionHref}>{actionLabel}</a>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="rounded-full bg-primary text-white hover:bg-primary/90"
                    disabled={actionDisabled}
                    onClick={onAction}
                  >
                    {actionLabel}
                  </Button>
                )
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </GlassCard>
  );
}
