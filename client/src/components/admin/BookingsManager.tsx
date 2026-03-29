import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CreditCard, Receipt, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BookingRecord } from "@/lib/bookings";

function formatDateTime(date: string, hour: number, locale: string) {
  const dt = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dt);
}

function moneyLabel(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount / 100);
}

function getCopy(locale: string) {
  if (locale === "ar") {
    return {
      title: "المواعيد والمدفوعات",
      subtitle: "راجع كل المواعيد، ألغها، أو اطلب استرجاعها من مكان واحد.",
      noResults: "لا توجد مواعيد حالياً.",
      customer: "العميل",
      when: "الموعد",
      service: "الخدمة",
      payment: "الدفع",
      amount: "القيمة",
      actions: "الإجراءات",
      details: "تفاصيل الموعد",
      consultation: "استشارة",
      support: "دعم",
      standard: "عادي",
      express: "إكسبريس",
      confirmed: "مؤكد",
      cancelled: "ملغى",
      paid: "مدفوع",
      unpaid: "غير مدفوع",
      pending: "قيد الانتظار",
      refunded: "مسترجع",
      partiallyRefunded: "استرجاع جزئي",
      cancel: "إلغاء الموعد",
      refund: "عمل refund",
      refundPending: "الاسترجاع قيد المعالجة",
      refundReference: "مرجع الاسترجاع",
      paymentReference: "مرجع الدفع",
      notes: "وصف المشكلة",
      company: "الشركة",
      country: "الدولة",
      phone: "الهاتف",
      cancelSuccess: "تم إلغاء الموعد.",
      refundSuccess: "تم إنشاء طلب الاسترجاع.",
      cannotRefund: "لا يمكن استرجاع هذا الموعد.",
    };
  }

  if (locale === "fr") {
    return {
      title: "Bookings et paiements",
      subtitle: "Revoyez tous les bookings, annulez-les ou lancez un remboursement depuis un seul endroit.",
      noResults: "Aucun booking pour le moment.",
      customer: "Client",
      when: "Horaire",
      service: "Service",
      payment: "Paiement",
      amount: "Montant",
      actions: "Actions",
      details: "Detail du booking",
      consultation: "Consultation",
      support: "Support",
      standard: "Standard",
      express: "Express",
      confirmed: "Confirme",
      cancelled: "Annule",
      paid: "Paye",
      unpaid: "Non paye",
      pending: "En attente",
      refunded: "Rembourse",
      partiallyRefunded: "Remboursement partiel",
      cancel: "Annuler",
      refund: "Lancer un remboursement",
      refundPending: "Remboursement en cours",
      refundReference: "Reference remboursement",
      paymentReference: "Reference paiement",
      notes: "Description du besoin",
      company: "Societe",
      country: "Pays",
      phone: "Telephone",
      cancelSuccess: "Booking annule.",
      refundSuccess: "Remboursement demande.",
      cannotRefund: "Ce booking ne peut pas etre rembourse.",
    };
  }

  return {
    title: "Bookings and payments",
    subtitle: "Review all bookings, cancel them, or trigger refunds from one operational view.",
    noResults: "No bookings yet.",
    customer: "Customer",
    when: "When",
    service: "Service",
    payment: "Payment",
    amount: "Amount",
    actions: "Actions",
    details: "Booking detail",
    consultation: "Consultation",
    support: "Support",
    standard: "Standard",
    express: "Express",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    paid: "Paid",
    unpaid: "Unpaid",
    pending: "Pending",
    refunded: "Refunded",
    partiallyRefunded: "Partially refunded",
    cancel: "Cancel booking",
    refund: "Create refund",
    refundPending: "Refund in progress",
    refundReference: "Refund reference",
    paymentReference: "Payment reference",
    notes: "Issue description",
    company: "Company",
    country: "Country",
    phone: "Phone",
    cancelSuccess: "Booking cancelled.",
    refundSuccess: "Refund request created.",
    cannotRefund: "This booking cannot be refunded.",
  };
}

function serviceLabel(booking: BookingRecord, copy: ReturnType<typeof getCopy>) {
  const typeLabel = booking.serviceType === "support" ? copy.support : copy.consultation;
  const priorityLabel = booking.priority === "express" ? copy.express : copy.standard;
  return `${priorityLabel} • ${typeLabel}`;
}

function paymentLabel(booking: BookingRecord, copy: ReturnType<typeof getCopy>) {
  if (booking.paymentStatus === "refunded") return copy.refunded;
  if (booking.paymentStatus === "partially_refunded") return copy.partiallyRefunded;
  if (booking.refundStatus === "pending") return copy.refundPending;
  if (booking.paymentStatus === "paid") return copy.paid;
  if (booking.paymentStatus === "pending") return copy.pending;
  return copy.unpaid;
}

export default function BookingsManager({
  locale,
  bookings,
  onCancelBooking,
  onRefundBooking,
}: {
  locale: string;
  bookings: BookingRecord[];
  onCancelBooking: (bookingId: string) => Promise<void>;
  onRefundBooking: (bookingId: string) => Promise<void>;
}) {
  const copy = useMemo(() => getCopy(locale), [locale]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    if (!bookings.length) {
      setSelectedBookingId(null);
      return;
    }
    if (!selectedBookingId || !bookings.some((booking) => booking.id === selectedBookingId)) {
      setSelectedBookingId(bookings[0].id);
    }
  }, [bookings, selectedBookingId]);

  const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId) ?? null;

  async function handleCancel(bookingId: string) {
    try {
      setBusyAction(`cancel:${bookingId}`);
      await onCancelBooking(bookingId);
      toast.success(copy.cancelSuccess);
    } catch (error: any) {
      toast.error(error?.message || copy.cancel);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRefund(bookingId: string) {
    try {
      setBusyAction(`refund:${bookingId}`);
      await onRefundBooking(bookingId);
      toast.success(copy.refundSuccess);
    } catch (error: any) {
      toast.error(error?.message || copy.cannotRefund);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <p className="text-sm text-slate-500">{copy.subtitle}</p>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{copy.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.customer}</TableHead>
                    <TableHead>{copy.when}</TableHead>
                    <TableHead>{copy.service}</TableHead>
                    <TableHead>{copy.payment}</TableHead>
                    <TableHead>{copy.amount}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length ? (
                    bookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className={`cursor-pointer ${selectedBookingId === booking.id ? "bg-primary/5" : "hover:bg-slate-50"}`}
                        onClick={() => setSelectedBookingId(booking.id)}
                      >
                        <TableCell className="font-medium">
                          <div>{booking.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{booking.email}</div>
                        </TableCell>
                        <TableCell>{formatDateTime(booking.date, booking.hour, locale)}</TableCell>
                        <TableCell>{serviceLabel(booking, copy)}</TableCell>
                        <TableCell>
                          <Badge variant={booking.paymentStatus === "paid" ? "default" : "secondary"}>
                            {paymentLabel(booking, copy)}
                          </Badge>
                        </TableCell>
                        <TableCell>{moneyLabel(booking.unitAmount, locale)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500">
                        {copy.noResults}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedBooking ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{copy.customer}</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedBooking.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{selectedBooking.email}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                      <CalendarDays className="h-4 w-4" />
                      {copy.when}
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {formatDateTime(selectedBooking.date, selectedBooking.hour, locale)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{copy.phone}</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedBooking.phone}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{copy.country}</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedBooking.country || "-"}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{copy.company}</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedBooking.company || "-"}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{copy.amount}</div>
                    <div className="mt-1 font-semibold text-slate-900">{moneyLabel(selectedBooking.unitAmount, locale)}</div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                      <CreditCard className="h-4 w-4" />
                      {copy.payment}
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">{paymentLabel(selectedBooking, copy)}</div>
                    <div className="mt-2 break-all text-xs text-slate-500">
                      {copy.paymentReference}: {selectedBooking.paymentReference || "-"}
                    </div>
                    <div className="mt-1 break-all text-xs text-slate-500">
                      {copy.refundReference}: {selectedBooking.refundReference || "-"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                      <Receipt className="h-4 w-4" />
                      {copy.service}
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">{serviceLabel(selectedBooking, copy)}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {selectedBooking.status === "cancelled" ? copy.cancelled : copy.confirmed}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                    <ShieldAlert className="h-4 w-4" />
                    {copy.notes}
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {selectedBooking.notes || "-"}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={selectedBooking.status === "cancelled" || busyAction === `cancel:${selectedBooking.id}`}
                    onClick={() => handleCancel(selectedBooking.id)}
                  >
                    {copy.cancel}
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      !selectedBooking.paymentReference ||
                      selectedBooking.paymentStatus === "refunded" ||
                      busyAction === `refund:${selectedBooking.id}`
                    }
                    onClick={() => handleRefund(selectedBooking.id)}
                  >
                    {copy.refund}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">{copy.noResults}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
