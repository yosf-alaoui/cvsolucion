import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CreditCard, Receipt, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminBookingSlotsResponse } from "@/lib/admin";
import type { BookingPriority, BookingRecord } from "@/lib/bookings";

function formatDateTime(date: string, hour: number, locale: string) {
  const dt = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dt);
}

function moneyLabel(amount: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatHour(hour: number, locale: string) {
  const dt = new Date(`2000-01-01T${String(hour).padStart(2, "0")}:00:00`);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    timeStyle: "short",
  }).format(dt);
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
      slotControl: "التحكم بالساعات",
      slotControlSubtitle: "اختر يوما وساعة لإغلاقها يدويا أو فتحها من جديد.",
      slotDate: "التاريخ",
      slotPriority: "الأولوية",
      slotReason: "سبب الإغلاق (اختياري)",
      slotReasonPlaceholder: "صيانة، اجتماع داخلي، عطلة...",
      slotReload: "تحديث الساعات",
      slotHour: "الساعة",
      slotState: "الحالة",
      slotSource: "المصدر",
      slotActions: "الإجراء",
      slotAvailable: "متاحة",
      slotBooked: "محجوزة",
      slotSourceCustomer: "حجز عميل",
      slotSourceAdmin: "مغلقة من الإدارة",
      slotSourceOpen: "مفتوحة",
      slotBlock: "إغلاق الساعة",
      slotUnblock: "فتح الساعة",
      slotBlockSuccess: "تم إغلاق الساعة.",
      slotUnblockSuccess: "تم فتح الساعة.",
      slotLoadError: "تعذر تحميل ساعات اليوم.",
      slotBlockError: "تعذر إغلاق الساعة.",
      slotUnblockError: "تعذر فتح الساعة.",
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
      slotControl: "Controle horaire",
      slotControlSubtitle: "Choisissez un jour et gelez/ouvrez chaque heure manuellement.",
      slotDate: "Date",
      slotPriority: "Priorite",
      slotReason: "Raison du blocage (optionnel)",
      slotReasonPlaceholder: "Maintenance, reunion interne, conge...",
      slotReload: "Rafraichir les heures",
      slotHour: "Heure",
      slotState: "Statut",
      slotSource: "Source",
      slotActions: "Action",
      slotAvailable: "Disponible",
      slotBooked: "Occupe",
      slotSourceCustomer: "Booking client",
      slotSourceAdmin: "Bloque par admin",
      slotSourceOpen: "Ouvert",
      slotBlock: "Bloquer l'heure",
      slotUnblock: "Ouvrir l'heure",
      slotBlockSuccess: "Heure bloquee.",
      slotUnblockSuccess: "Heure ouverte.",
      slotLoadError: "Impossible de charger les heures.",
      slotBlockError: "Impossible de bloquer l'heure.",
      slotUnblockError: "Impossible d'ouvrir l'heure.",
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
    slotControl: "Hourly slot control",
    slotControlSubtitle: "Pick a day and lock or reopen each hour manually.",
    slotDate: "Date",
    slotPriority: "Priority",
    slotReason: "Block reason (optional)",
    slotReasonPlaceholder: "Maintenance, internal meeting, holiday...",
    slotReload: "Refresh hours",
    slotHour: "Hour",
    slotState: "Status",
    slotSource: "Source",
    slotActions: "Action",
    slotAvailable: "Available",
    slotBooked: "Booked",
    slotSourceCustomer: "Customer booking",
    slotSourceAdmin: "Admin blocked",
    slotSourceOpen: "Open",
    slotBlock: "Block hour",
    slotUnblock: "Open hour",
    slotBlockSuccess: "Hour blocked.",
    slotUnblockSuccess: "Hour reopened.",
    slotLoadError: "Failed to load day slots.",
    slotBlockError: "Failed to block this hour.",
    slotUnblockError: "Failed to open this hour.",
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
  schedule,
  onCancelBooking,
  onRefundBooking,
  onUpdateSchedule,
  onLoadSlots,
  onBlockSlot,
  onUnblockSlot,
}: {
  locale: string;
  bookings: BookingRecord[];
  schedule: {
    standardOpen: boolean;
    expressOpen: boolean;
    updatedAt: string;
  };
  onCancelBooking: (bookingId: string) => Promise<void>;
  onRefundBooking: (bookingId: string) => Promise<void>;
  onUpdateSchedule: (payload: { standardOpen?: boolean; expressOpen?: boolean }) => Promise<void>;
  onLoadSlots: (payload: { date: string; priority: BookingPriority }) => Promise<AdminBookingSlotsResponse>;
  onBlockSlot: (payload: {
    date: string;
    hour: number;
    priority: BookingPriority;
    reason?: string | null;
  }) => Promise<AdminBookingSlotsResponse>;
  onUnblockSlot: (payload: { date: string; hour: number; priority: BookingPriority }) => Promise<AdminBookingSlotsResponse>;
}) {
  const copy = useMemo(() => getCopy(locale), [locale]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [updatingSchedule, setUpdatingSchedule] = useState<"standard" | "express" | null>(null);
  const [slotDate, setSlotDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotPriority, setSlotPriority] = useState<BookingPriority>("standard");
  const [slotReason, setSlotReason] = useState("");
  const [slotData, setSlotData] = useState<AdminBookingSlotsResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotActionBusy, setSlotActionBusy] = useState<string | null>(null);

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

  async function loadSlotData(date = slotDate, priority = slotPriority) {
    if (!date) return;
    try {
      setLoadingSlots(true);
      const response = await onLoadSlots({ date, priority });
      setSlotData(response);
    } catch (error: any) {
      toast.error(error?.message || copy.slotLoadError);
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    if (!slotDate) return;
    void loadSlotData(slotDate, slotPriority);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotDate, slotPriority]);

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

  async function handleScheduleToggle(priority: "standard" | "express", nextValue: boolean) {
    try {
      setUpdatingSchedule(priority);
      await onUpdateSchedule(priority === "standard" ? { standardOpen: nextValue } : { expressOpen: nextValue });
    } finally {
      setUpdatingSchedule(null);
    }
  }

  async function handleBlockSlot(hour: number) {
    try {
      setSlotActionBusy(`block:${slotDate}:${hour}:${slotPriority}`);
      const response = await onBlockSlot({
        date: slotDate,
        hour,
        priority: slotPriority,
        reason: slotReason,
      });
      setSlotData(response);
      toast.success(copy.slotBlockSuccess);
    } catch (error: any) {
      toast.error(error?.message || copy.slotBlockError);
    } finally {
      setSlotActionBusy(null);
    }
  }

  async function handleUnblockSlot(hour: number) {
    try {
      setSlotActionBusy(`unblock:${slotDate}:${hour}:${slotPriority}`);
      const response = await onUnblockSlot({
        date: slotDate,
        hour,
        priority: slotPriority,
      });
      setSlotData(response);
      toast.success(copy.slotUnblockSuccess);
    } catch (error: any) {
      toast.error(error?.message || copy.slotUnblockError);
    } finally {
      setSlotActionBusy(null);
    }
  }

  async function handleCancelFromSlot(bookingId: string) {
    await handleCancel(bookingId);
    await loadSlotData();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <p className="text-sm text-slate-500">{copy.subtitle}</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {locale === "ar" ? "الجدول العادي" : locale === "fr" ? "Planning standard" : "Standard calendar"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {schedule.standardOpen
                    ? locale === "ar"
                      ? "مفتوح الآن"
                      : locale === "fr"
                        ? "Ouvert maintenant"
                        : "Open now"
                    : locale === "ar"
                      ? "مغلق حالياً"
                      : locale === "fr"
                        ? "Ferme actuellement"
                        : "Closed now"}
                </div>
              </div>
              <Button
                type="button"
                variant={schedule.standardOpen ? "outline" : "default"}
                disabled={updatingSchedule === "standard"}
                onClick={() => handleScheduleToggle("standard", !schedule.standardOpen)}
              >
                {schedule.standardOpen
                  ? locale === "ar"
                    ? "اغلق"
                    : locale === "fr"
                      ? "Fermer"
                      : "Close"
                  : locale === "ar"
                    ? "افتح"
                    : locale === "fr"
                      ? "Ouvrir"
                      : "Open"}
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {locale === "ar" ? "الجدول السريع" : locale === "fr" ? "Planning express" : "Express calendar"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {schedule.expressOpen
                    ? locale === "ar"
                      ? "مفتوح الآن"
                      : locale === "fr"
                        ? "Ouvert maintenant"
                        : "Open now"
                    : locale === "ar"
                      ? "مغلق حالياً"
                      : locale === "fr"
                        ? "Ferme actuellement"
                        : "Closed now"}
                </div>
              </div>
              <Button
                type="button"
                variant={schedule.expressOpen ? "outline" : "default"}
                disabled={updatingSchedule === "express"}
                onClick={() => handleScheduleToggle("express", !schedule.expressOpen)}
              >
                {schedule.expressOpen
                  ? locale === "ar"
                    ? "اغلق"
                    : locale === "fr"
                      ? "Fermer"
                      : "Close"
                  : locale === "ar"
                    ? "افتح"
                    : locale === "fr"
                      ? "Ouvrir"
                      : "Open"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.slotControl}</CardTitle>
          <p className="text-sm text-slate-500">{copy.slotControlSubtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[200px_220px_minmax(240px,1fr)_auto] lg:items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.slotDate}</label>
              <Input type="date" value={slotDate} onChange={(event) => setSlotDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.slotPriority}</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={slotPriority === "standard" ? "default" : "outline"}
                  onClick={() => setSlotPriority("standard")}
                >
                  {copy.standard}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={slotPriority === "express" ? "default" : "outline"}
                  onClick={() => setSlotPriority("express")}
                >
                  {copy.express}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.slotReason}</label>
              <Input
                value={slotReason}
                onChange={(event) => setSlotReason(event.target.value)}
                placeholder={copy.slotReasonPlaceholder}
              />
            </div>
            <Button type="button" variant="outline" onClick={() => void loadSlotData()} disabled={loadingSlots}>
              {copy.slotReload}
            </Button>
          </div>

          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.slotHour}</TableHead>
                  <TableHead>{copy.slotState}</TableHead>
                  <TableHead>{copy.slotSource}</TableHead>
                  <TableHead>{copy.slotActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slotData?.slots?.length ? (
                  slotData.slots.map((slot) => {
                    const actionKey = `${slotDate}:${slot.hour}:${slotPriority}`;
                    const sourceLabel =
                      slot.source === "real"
                        ? copy.slotSourceCustomer
                        : slot.source === "blocked"
                          ? copy.slotSourceAdmin
                          : copy.slotSourceOpen;
                    return (
                      <TableRow key={slot.id}>
                        <TableCell className="font-medium">{formatHour(slot.hour, locale)}</TableCell>
                        <TableCell>{slot.status === "booked" ? copy.slotBooked : copy.slotAvailable}</TableCell>
                        <TableCell>
                          <div>{sourceLabel}</div>
                          {slot.booking ? (
                            <div className="mt-1 text-xs text-slate-500">
                              {slot.booking.name} · {slot.booking.email}
                            </div>
                          ) : null}
                          {slot.block?.reason ? <div className="mt-1 text-xs text-slate-500">{slot.block.reason}</div> : null}
                        </TableCell>
                        <TableCell>
                          {slot.source === "available" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={slotActionBusy === `block:${actionKey}`}
                              onClick={() => void handleBlockSlot(slot.hour)}
                            >
                              {copy.slotBlock}
                            </Button>
                          ) : slot.source === "blocked" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={slotActionBusy === `unblock:${actionKey}`}
                              onClick={() => void handleUnblockSlot(slot.hour)}
                            >
                              {copy.slotUnblock}
                            </Button>
                          ) : slot.booking ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busyAction === `cancel:${slot.booking.id}`}
                              onClick={() => {
                                if (!slot.booking) return;
                                void handleCancelFromSlot(slot.booking.id);
                              }}
                            >
                              {copy.cancel}
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500">
                      {loadingSlots ? "..." : copy.noResults}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
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
                        <TableCell>{moneyLabel(booking.unitAmount, locale, booking.currency || "cad")}</TableCell>
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
                    <div className="mt-1 font-semibold text-slate-900">{moneyLabel(selectedBooking.unitAmount, locale, selectedBooking.currency || "cad")}</div>
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
