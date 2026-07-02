import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Mail, ReceiptText, RefreshCcw, UserRound } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import GlassCard from "@/components/GlassCard";
import TrainingProgressPanel from "@/components/customer/TrainingProgressPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import {
  getCustomerDashboard,
  requestCustomerInvoice,
  updateCustomerProfile,
  type CustomerDashboardResponse,
  type CustomerInvoice,
} from "@/lib/customer";
import { getBookingAvailability, rescheduleBooking, type BookingAvailabilitySlot, type BookingRecord } from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getBookingCountryLabel, getBookingCountryOptions } from "@/lib/bookingTime";
import { buildInternationalPhone, getDefaultPhoneCountryCode, getPhoneCountryOptions, splitInternationalPhone } from "@/lib/phone";
import { toast } from "sonner";

function formatDateTime(date: string, hour: number, locale: string) {
  const dt = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dt);
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function slotSummary(slot: BookingAvailabilitySlot, locale: string) {
  return formatDateTime(slot.date, slot.hour, locale);
}

function formatInvoiceAmount(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default function CustomerDashboard() {
  const { locale } = useI18n();
  const { user, loading } = useAuth();
  const [data, setData] = useState<CustomerDashboardResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<BookingAvailabilitySlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [requestingInvoice, setRequestingInvoice] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    country: "",
    countryCode: "",
    phone: "",
    phoneCountryCode: "CA",
    company: "",
  });
  const [invoiceForm, setInvoiceForm] = useState({
    bookingId: "none",
    customerType: "individual" as "individual" | "company",
    customerName: "",
    company: "",
    phone: "",
    country: "",
    countryCode: "CA",
    billingAddress: "",
    city: "",
    region: "",
    postalCode: "",
    taxId: "",
    serviceDescription: "",
    notes: "",
  });

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "لوحة حساب العميل",
        subtitle: "تابع ملفك الشخصي، حجوزاتك القادمة، وسجل مواعيدك من مكان واحد.",
        profile: "الملف الشخصي",
        bookings: "الحجوزات",
        upcoming: "القادمة",
        history: "السابقة",
        name: "الاسم",
        email: "البريد الإلكتروني",
        phone: "رقم الهاتف",
        country: "الدولة",
        company: "الشركة",
        save: "حفظ الملف",
        loading: "جارٍ تحميل حسابك...",
        signInRequired: "يجب تسجيل الدخول أولاً.",
        noBookings: "لا توجد حجوزات بعد.",
        created: "تم الإنشاء",
        status: "الحالة",
        priority: "الأولوية",
        service: "الخدمة",
        reschedule: "تغيير الموعد",
        rescheduleBlocked: "التعديل يغلق قبل 12 ساعة من الموعد.",
        chooseNewSlot: "اختر موعداً جديداً",
        confirmReschedule: "تأكيد التغيير",
        cancel: "إلغاء",
        profileSaved: "تم تحديث الملف الشخصي.",
        bookingChanged: "تم تغيير الموعد بنجاح.",
        consultation: "استشارة",
        support: "دعم",
        standard: "عادي",
        express: "إكسبريس",
        cancelled: "ملغى",
        refunded: "مسترجع",
        partiallyRefunded: "استرجاع جزئي",
      };
    }
    if (locale === "fr") {
      return {
        title: "Espace client",
        subtitle: "Suivez votre profil, vos bookings a venir et votre historique depuis un seul espace.",
        profile: "Profil",
        bookings: "Bookings",
        upcoming: "A venir",
        history: "Historique",
        name: "Nom",
        email: "Email",
        phone: "Telephone",
        country: "Pays",
        company: "Societe",
        save: "Enregistrer le profil",
        loading: "Chargement de votre compte...",
        signInRequired: "Connexion obligatoire.",
        noBookings: "Aucun booking pour le moment.",
        created: "Cree le",
        status: "Statut",
        priority: "Priorite",
        service: "Service",
        reschedule: "Changer l'horaire",
        rescheduleBlocked: "Le changement se ferme 12 heures avant le rendez-vous.",
        chooseNewSlot: "Choisissez un nouvel horaire",
        confirmReschedule: "Confirmer le changement",
        cancel: "Annuler",
        profileSaved: "Profil mis a jour.",
        bookingChanged: "Booking modifie avec succes.",
        consultation: "Consultation",
        support: "Support",
        standard: "Standard",
        express: "Express",
        cancelled: "Annule",
        refunded: "Rembourse",
        partiallyRefunded: "Remboursement partiel",
      };
    }
    return {
      title: "Client dashboard",
      subtitle: "Manage your profile, upcoming bookings, and booking history from one place.",
      profile: "Profile",
      bookings: "Bookings",
      upcoming: "Upcoming",
      history: "History",
      name: "Name",
      email: "Email",
      phone: "Phone",
      country: "Country",
      company: "Company",
      save: "Save profile",
      loading: "Loading your account...",
      signInRequired: "Sign in required.",
      noBookings: "No bookings yet.",
      created: "Created",
      status: "Status",
      priority: "Priority",
      service: "Service",
      reschedule: "Change time",
      rescheduleBlocked: "Changes close 12 hours before the appointment.",
      chooseNewSlot: "Choose a new time",
      confirmReschedule: "Confirm change",
      cancel: "Cancel",
      profileSaved: "Profile updated.",
      bookingChanged: "Booking time changed successfully.",
      consultation: "Consultation",
      support: "Support",
      standard: "Standard",
      express: "Express",
      cancelled: "Cancelled",
      refunded: "Refunded",
      partiallyRefunded: "Partially refunded",
    };
  }, [locale]);

  const invoiceCopy = useMemo<any>(() => {
    if (locale === "ar") {
      return {
        title: "الفواتير",
        subtitle: "سيتم إنتاج الفاتورة وتصديرها بعد مرور الموعد.",
        pending: "الفاتورة غير مفعلة حالياً",
        action: "ستتوفر بعد الموعد",
      };
    }
    if (locale === "fr") {
      return {
        title: "Factures",
        subtitle: "Demandez une facture, suivez son statut, puis telechargez le PDF apres emission.",
        pending: "Demande en attente",
        action: "Demande en attente",
        download: "Telecharger la facture",
        issued: "Emise le",
        requested: "Demandee",
        pendingReview: "En revue admin",
        requestInvoice: "Demander une facture",
        requestTitle: "Demander une facture",
        requestDescription: "Ajoutez les details de facturation a afficher sur la facture.",
        submitRequest: "Envoyer la demande",
        requestSuccess: "Demande de facture envoyee. Vous serez notifie quand le PDF sera pret.",
        requiredMessage: "Nom, pays et adresse de facturation sont obligatoires.",
        empty: "Aucune facture pour le moment.",
      };
    }
    return {
      title: "Invoices",
      subtitle: "Request an invoice, track its review status, and download the PDF after it is issued.",
      pending: "Invoice request pending",
      action: "Request pending",
      download: "Download invoice",
      issued: "Issued",
      requested: "Requested",
      pendingReview: "Waiting for admin review",
      requestInvoice: "Request invoice",
      requestTitle: "Request an invoice",
      requestDescription: "Add the billing details that should appear on the invoice.",
      submitRequest: "Submit request",
      requestSuccess: "Invoice request sent. We will notify you when the PDF is ready.",
      requiredMessage: "Name, country, and billing address are required.",
      empty: "No invoices yet.",
    };
  }, [locale]);

  const countryOptions = useMemo(() => getBookingCountryOptions(locale), [locale]);
  const phoneCountryOptions = useMemo(() => getPhoneCountryOptions(locale), [locale]);
  const trainingTabLabel = locale === "ar" ? "التدريب" : locale === "fr" ? "Formation" : "Training";

  async function loadDashboard() {
    const response = await getCustomerDashboard();
    const resolvedCountryCode = response.profile.countryCode || "CA";
    const resolvedPhone = splitInternationalPhone(response.profile.phone, resolvedCountryCode);
    setData(response);
    setProfileForm({
      name: response.profile.name || "",
      country: response.profile.country || getBookingCountryLabel(resolvedCountryCode, locale),
      countryCode: resolvedCountryCode,
      phone: resolvedPhone.localPhone,
      phoneCountryCode: resolvedPhone.phoneCountryCode,
      company: response.profile.company || "",
    });
    setInvoiceForm((current) => ({
      ...current,
      customerName: current.customerName || response.profile.name || response.user.email.split("@")[0],
      company: current.company || response.profile.company || "",
      phone: current.phone || response.profile.phone || "",
      country: current.country || response.profile.country || getBookingCountryLabel(resolvedCountryCode, locale),
      countryCode: current.countryCode || resolvedCountryCode,
    }));
  }

  useEffect(() => {
    if (loading || !user) {
      setBusy(loading);
      return;
    }
    setBusy(true);
    loadDashboard()
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setBusy(false));
  }, [loading, user]);

  const now = Date.now();
  const upcomingBookings = useMemo(
    () =>
      (data?.bookings || []).filter(
        (booking) =>
          booking.status === "confirmed" &&
          new Date(`${booking.date}T${String(booking.hour).padStart(2, "0")}:00:00`).getTime() >= now
      ),
    [data?.bookings, now]
  );
  const pastBookings = useMemo(
    () =>
      (data?.bookings || []).filter(
        (booking) =>
          booking.status !== "confirmed" ||
          new Date(`${booking.date}T${String(booking.hour).padStart(2, "0")}:00:00`).getTime() < now
      ),
    [data?.bookings, now]
  );
  const sortedInvoices = useMemo(
    () =>
      [...(data?.invoices || [])].sort((a, b) =>
        (b.issuedAt || b.requestedAt).localeCompare(a.issuedAt || a.requestedAt),
      ),
    [data?.invoices],
  );
  const invoicesByBookingId = useMemo(() => {
    const map = new Map<string, CustomerInvoice>();
    for (const invoice of data?.invoices || []) {
      if (invoice.bookingId) {
        map.set(invoice.bookingId, invoice);
      }
    }
    return map;
  }, [data?.invoices]);
  const invoiceBookingOptions = useMemo(
    () =>
      [...(data?.bookings || [])].sort((a, b) =>
        `${b.date}-${String(b.hour).padStart(2, "0")}`.localeCompare(
          `${a.date}-${String(a.hour).padStart(2, "0")}`,
        ),
      ),
    [data?.bookings],
  );
  const invoiceDownloadLabel = invoiceCopy.download || invoiceCopy.action;
  const invoiceIssuedLabel = invoiceCopy.issued || copy.created;
  const invoiceEmptyLabel = invoiceCopy.empty || copy.noBookings;
  const invoiceRequestedLabel = invoiceCopy.requested || "Requested";
  const invoicePendingLabel = invoiceCopy.pendingReview || "Waiting for admin review";
  const invoiceRequestLabel = invoiceCopy.requestInvoice || "Request invoice";
  const invoiceRequestTitle = invoiceCopy.requestTitle || "Request an invoice";
  const invoiceSubtitle =
    locale === "ar"
      ? "Request an invoice, track its review status, and download the PDF after it is issued."
      : invoiceCopy.subtitle;
  const invoiceRequestDescription =
    invoiceCopy.requestDescription || "Add the billing details that should appear on the invoice.";
  const invoiceSubmitLabel = invoiceCopy.submitRequest || "Submit request";
  const invoiceRequestSuccess = invoiceCopy.requestSuccess || "Invoice request sent. We will notify you when the PDF is ready.";
  const invoiceRequiredMessage = invoiceCopy.requiredMessage || "Name, country, and billing address are required.";
  const invoiceStatusLabel = invoiceCopy.status || copy.status;

  async function handleProfileSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSavingProfile(true);
      const response = await updateCustomerProfile({
        name: profileForm.name,
        country: getBookingCountryLabel(profileForm.countryCode, locale),
        countryCode: profileForm.countryCode,
        phone: buildInternationalPhone(profileForm.phoneCountryCode, profileForm.phone),
        company: profileForm.company,
      });
      setData((current) => (current ? { ...current, profile: response.profile } : current));
      toast.success(copy.profileSaved);
    } catch (error: any) {
      toast.error(error?.message || "Profile update failed.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleInvoiceRequest(event: React.FormEvent) {
    event.preventDefault();
    const selectedBooking =
      invoiceForm.bookingId === "none"
        ? null
        : data?.bookings.find((booking) => booking.id === invoiceForm.bookingId) || null;
    const country =
      invoiceForm.country ||
      getBookingCountryLabel(invoiceForm.countryCode, locale);

    if (!invoiceForm.customerName.trim() || !country.trim() || !invoiceForm.billingAddress.trim()) {
      toast.error(invoiceRequiredMessage);
      return;
    }

    try {
      setRequestingInvoice(true);
      const response = await requestCustomerInvoice({
        bookingId: selectedBooking?.id || null,
        customerType: invoiceForm.customerType,
        customerName: invoiceForm.customerName,
        phone: invoiceForm.phone || null,
        country,
        countryCode: invoiceForm.countryCode,
        company: invoiceForm.customerType === "company" ? invoiceForm.company || null : null,
        billingAddress: invoiceForm.billingAddress,
        city: invoiceForm.city || null,
        region: invoiceForm.region || null,
        postalCode: invoiceForm.postalCode || null,
        taxId: invoiceForm.taxId || null,
        serviceDescription:
          invoiceForm.serviceDescription ||
          (selectedBooking
            ? `${selectedBooking.serviceType === "support" ? copy.support : copy.consultation} - ${
                selectedBooking.priority === "express" ? copy.express : copy.standard
              }`
            : null),
        notes: invoiceForm.notes || null,
      });

      setData((current) =>
        current
          ? {
              ...current,
              invoices: [
                response.invoice,
                ...current.invoices.filter((invoice) => invoice.id !== response.invoice.id),
              ],
            }
          : current,
      );
      setInvoiceDialogOpen(false);
      toast.success(invoiceRequestSuccess);
    } catch (error: any) {
      toast.error(error?.message || "Invoice request failed.");
    } finally {
      setRequestingInvoice(false);
    }
  }

  async function openReschedule(booking: BookingRecord) {
    try {
      setReschedulingId(booking.id);
      setSelectedSlotId(null);
      setAvailabilityLoading(true);
      const response = await getBookingAvailability(booking.priority);
      const slots = response.days.flatMap((day) =>
        day.slots.filter((slot) => slot.status === "available" && !(slot.date === booking.date && slot.hour === booking.hour))
      );
      setAvailabilitySlots(slots);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load availability.");
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function confirmReschedule(bookingId: string) {
    const slot = availabilitySlots.find((item) => item.id === selectedSlotId);
    if (!slot) {
      toast.error(copy.chooseNewSlot);
      return;
    }

    try {
      const response = await rescheduleBooking(bookingId, { date: slot.date, hour: slot.hour });
      setData((current) =>
        current
          ? {
              ...current,
              bookings: current.bookings.map((booking) => (booking.id === bookingId ? response.booking : booking)),
            }
          : current
      );
      setReschedulingId(null);
      setSelectedSlotId(null);
      setAvailabilitySlots([]);
      toast.success(copy.bookingChanged);
    } catch (error: any) {
      toast.error(error?.message || "Reschedule failed.");
    }
  }

  if (loading || busy) {
    return (
      <div className="site-page min-h-screen bg-transparent">
        <Header />
        <main className="pt-32 pb-20">
          <section className="container">
            <div className="mx-auto max-w-4xl text-center text-slate-600">{copy.loading}</div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !data) {
    return (
      <div className="site-page min-h-screen bg-transparent">
        <Header />
        <main className="pt-32 pb-20">
          <section className="container">
            <div className="mx-auto max-w-4xl text-center text-slate-600">{copy.signInRequired}</div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-page min-h-screen bg-transparent">
      <Seo title={`${copy.title} | CVsolucion`} description={copy.subtitle} type="website" />
      <Header />
      <main className="pt-32 pb-20">
        <section className="container">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-950 sm:text-5xl">{copy.title}</h1>
              <p className="mt-4 text-lg text-slate-600">{copy.subtitle}</p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-4">
              <GlassCard className="card-static rounded-[28px] p-5">
                <div className="text-sm text-slate-500">{copy.email}</div>
                <div className="mt-2 break-all font-semibold text-slate-900">{data.user.email}</div>
              </GlassCard>
              <GlassCard className="card-static rounded-[28px] p-5">
                <div className="text-sm text-slate-500">{copy.upcoming}</div>
                <div className="mt-2 font-semibold text-slate-900">{upcomingBookings.length}</div>
              </GlassCard>
              <GlassCard className="card-static rounded-[28px] p-5">
                <div className="text-sm text-slate-500">{copy.history}</div>
                <div className="mt-2 font-semibold text-slate-900">{pastBookings.length}</div>
              </GlassCard>
              <GlassCard className="card-static rounded-[28px] p-5">
                <div className="text-sm text-slate-500">{copy.created}</div>
                <div className="mt-2 font-semibold text-slate-900">{formatDate(data.profile.createdAt, locale)}</div>
              </GlassCard>
            </div>

            <Tabs defaultValue="bookings" className="mt-10">
              <TabsList className="h-auto rounded-full p-1">
                <TabsTrigger value="bookings" className="rounded-full px-5 py-2">
                  {copy.bookings}
                </TabsTrigger>
                <TabsTrigger value="training" className="rounded-full px-5 py-2">
                  {trainingTabLabel}
                </TabsTrigger>
                <TabsTrigger value="invoices" className="rounded-full px-5 py-2">
                  {invoiceCopy.title}
                </TabsTrigger>
                <TabsTrigger value="profile" className="rounded-full px-5 py-2">
                  {copy.profile}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <GlassCard className="card-static rounded-[32px] p-7">
                    <h2 className="text-2xl font-bold text-slate-950">{copy.upcoming}</h2>
                    <div className="mt-5 space-y-4">
                      {upcomingBookings.length ? (
                        upcomingBookings.map((booking) => (
                          <div key={booking.id} className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-900">
                                  <CalendarDays className="h-4 w-4 text-primary" />
                                  <span className="font-semibold">{formatDateTime(booking.date, booking.hour, locale)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Clock3 className="h-4 w-4 text-primary" />
                                  <span>{booking.serviceType === "support" ? copy.support : copy.consultation}</span>
                                  <span>•</span>
                                  <span>{booking.priority === "express" ? copy.express : copy.standard}</span>
                                </div>
                              </div>
                              {booking.canReschedule ? (
                                <Button type="button" variant="outline" className="rounded-full" onClick={() => openReschedule(booking)}>
                                  <RefreshCcw className="h-4 w-4" />
                                  {copy.reschedule}
                                </Button>
                              ) : (
                                <div className="text-sm text-slate-500">{copy.rescheduleBlocked}</div>
                              )}
                            </div>

                            {reschedulingId === booking.id ? (
                              <div className="mt-5 rounded-[20px] border border-slate-200 bg-white/80 p-4">
                                <div className="text-sm font-semibold text-slate-700">{copy.chooseNewSlot}</div>
                                {availabilityLoading ? (
                                  <div className="mt-3 text-sm text-slate-500">{copy.loading}</div>
                                ) : (
                                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    {availabilitySlots.slice(0, 24).map((slot) => (
                                      <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => setSelectedSlotId(slot.id)}
                                        className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                                          selectedSlotId === slot.id
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-primary/35 hover:bg-primary/5"
                                        }`}
                                      >
                                        {slotSummary(slot, locale)}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-4 flex flex-wrap gap-3">
                                  <Button type="button" className="rounded-full" onClick={() => confirmReschedule(booking.id)}>
                                    {copy.confirmReschedule}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={() => {
                                      setReschedulingId(null);
                                      setSelectedSlotId(null);
                                      setAvailabilitySlots([]);
                                    }}
                                  >
                                    {copy.cancel}
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500">{copy.noBookings}</div>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard className="card-static rounded-[32px] p-7">
                    <h2 className="text-2xl font-bold text-slate-950">{copy.history}</h2>
                    <div className="mt-5 space-y-4">
                      {pastBookings.length ? (
                        pastBookings.map((booking) => (
                          <div key={booking.id} className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
                            <div className="font-semibold text-slate-900">{formatDateTime(booking.date, booking.hour, locale)}</div>
                            <div className="mt-2 text-sm text-slate-600">
                              {booking.serviceType === "support" ? copy.support : copy.consultation} •{" "}
                              {booking.priority === "express" ? copy.express : copy.standard}
                            </div>
                            {booking.status === "cancelled" || booking.paymentStatus === "refunded" || booking.paymentStatus === "partially_refunded" ? (
                              <div className="mt-2 text-sm font-medium text-slate-700">
                                {booking.status === "cancelled"
                                  ? copy.cancelled
                                  : booking.paymentStatus === "refunded"
                                    ? copy.refunded
                                    : copy.partiallyRefunded}
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500">{copy.noBookings}</div>
                      )}
                    </div>
                  </GlassCard>
                </div>
              </TabsContent>

              <TabsContent value="training" className="mt-6">
                <TrainingProgressPanel locale={locale as "en" | "fr" | "ar"} />
              </TabsContent>

              <TabsContent value="invoices" className="mt-6">
                <GlassCard className="card-static rounded-[32px] p-7">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <ReceiptText className="mt-1 h-6 w-6 text-primary" />
                      <div>
                        <h2 className="text-2xl font-bold text-slate-950">{invoiceCopy.title}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{invoiceSubtitle}</p>
                      </div>
                    </div>
                    <Button type="button" className="rounded-full" onClick={() => setInvoiceDialogOpen(true)}>
                      <ReceiptText className="h-4 w-4" />
                      {invoiceRequestLabel}
                    </Button>
                  </div>

                  <div className="mt-6 space-y-4">
                    {sortedInvoices.length ? (
                      sortedInvoices.map((invoice) => (
                        <div key={invoice.id} className="rounded-[24px] border border-slate-200 bg-white/75 p-5">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-semibold text-slate-950">
                                  {invoice.invoiceNumber || invoiceRequestTitle}
                                </div>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    invoice.status === "issued"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {invoice.status === "issued" ? invoiceIssuedLabel : invoiceRequestedLabel}
                                </span>
                              </div>
                              <div className="mt-2 text-sm text-slate-600">{invoice.serviceDescription}</div>
                              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                  <span className="text-slate-400">{invoiceStatusLabel}: </span>
                                  {invoice.status === "issued" ? invoiceIssuedLabel : invoicePendingLabel}
                                </div>
                                <div>
                                  <span className="text-slate-400">{copy.created}: </span>
                                  {formatDate(invoice.requestedAt, locale)}
                                </div>
                                {invoice.issuedAt ? (
                                  <div>
                                    <span className="text-slate-400">{invoiceIssuedLabel}: </span>
                                    {formatDate(invoice.issuedAt, locale)}
                                  </div>
                                ) : null}
                                <div className="font-semibold text-slate-900">
                                  {formatInvoiceAmount(invoice.totalAmount, invoice.currency, locale)}
                                </div>
                              </div>
                            </div>
                            {invoice.status === "issued" && invoice.downloadUrl ? (
                              <Button type="button" variant="outline" className="rounded-full" asChild>
                                <a href={invoice.downloadUrl} target="_blank" rel="noreferrer">
                                  {invoiceDownloadLabel}
                                </a>
                              </Button>
                            ) : (
                              <Button type="button" variant="outline" className="rounded-full" disabled>
                                {invoicePendingLabel}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/65 p-8 text-center">
                        <div className="font-semibold text-slate-900">{invoiceEmptyLabel}</div>
                        <p className="mt-2 text-sm text-slate-600">{invoiceRequestDescription}</p>
                        <Button type="button" className="mt-5 rounded-full" onClick={() => setInvoiceDialogOpen(true)}>
                          {invoiceRequestLabel}
                        </Button>
                      </div>
                    )}
                  </div>
                </GlassCard>

                <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{invoiceRequestTitle}</DialogTitle>
                      <DialogDescription>{invoiceRequestDescription}</DialogDescription>
                    </DialogHeader>
                    <form className="grid gap-5" onSubmit={handleInvoiceRequest}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="invoice-booking">{copy.bookings}</Label>
                          <Select
                            value={invoiceForm.bookingId}
                            onValueChange={(bookingId) => setInvoiceForm((current) => ({ ...current, bookingId }))}
                          >
                            <SelectTrigger id="invoice-booking" className="bg-white">
                              <SelectValue placeholder={copy.bookings} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">General service invoice</SelectItem>
                              {invoiceBookingOptions.map((booking) => (
                                <SelectItem key={booking.id} value={booking.id}>
                                  {formatDateTime(booking.date, booking.hour, locale)} -{" "}
                                  {booking.serviceType === "support" ? copy.support : copy.consultation}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoice-type">Customer type</Label>
                          <Select
                            value={invoiceForm.customerType}
                            onValueChange={(customerType) =>
                              setInvoiceForm((current) => ({
                                ...current,
                                customerType: customerType as "individual" | "company",
                              }))
                            }
                          >
                            <SelectTrigger id="invoice-type" className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="company">Company</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoice-name">{copy.name}</Label>
                          <Input
                            id="invoice-name"
                            value={invoiceForm.customerName}
                            onChange={(event) => setInvoiceForm((current) => ({ ...current, customerName: event.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoice-company">{copy.company}</Label>
                          <Input
                            id="invoice-company"
                            value={invoiceForm.company}
                            onChange={(event) => setInvoiceForm((current) => ({ ...current, company: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoice-phone">{copy.phone}</Label>
                          <Input
                            id="invoice-phone"
                            value={invoiceForm.phone}
                            onChange={(event) => setInvoiceForm((current) => ({ ...current, phone: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoice-country">{copy.country}</Label>
                          <Select
                            value={invoiceForm.countryCode}
                            onValueChange={(countryCode) =>
                              setInvoiceForm((current) => ({
                                ...current,
                                countryCode,
                                country: getBookingCountryLabel(countryCode, locale),
                              }))
                            }
                          >
                            <SelectTrigger id="invoice-country" className="bg-white">
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
                          <Label htmlFor="invoice-address">Billing address</Label>
                          <Input
                            id="invoice-address"
                            value={invoiceForm.billingAddress}
                            onChange={(event) => setInvoiceForm((current) => ({ ...current, billingAddress: event.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoice-city">City</Label>
                          <Input
                            id="invoice-city"
                            value={invoiceForm.city}
                            onChange={(event) => setInvoiceForm((current) => ({ ...current, city: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoice-region">State / Province</Label>
                          <Input
                            id="invoice-region"
                            value={invoiceForm.region}
                            onChange={(event) => setInvoiceForm((current) => ({ ...current, region: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoice-postal">Postal code</Label>
                          <Input
                            id="invoice-postal"
                            value={invoiceForm.postalCode}
                            onChange={(event) => setInvoiceForm((current) => ({ ...current, postalCode: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoice-tax">Tax / VAT ID</Label>
                          <Input
                            id="invoice-tax"
                            value={invoiceForm.taxId}
                            onChange={(event) => setInvoiceForm((current) => ({ ...current, taxId: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="invoice-service">{copy.service}</Label>
                          <Input
                            id="invoice-service"
                            value={invoiceForm.serviceDescription}
                            onChange={(event) => setInvoiceForm((current) => ({ ...current, serviceDescription: event.target.value }))}
                            placeholder="Cabinet Vision consulting, training, or support"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="invoice-notes">Notes</Label>
                          <Textarea
                            id="invoice-notes"
                            value={invoiceForm.notes}
                            onChange={(event) => setInvoiceForm((current) => ({ ...current, notes: event.target.value }))}
                            placeholder="Purchase order, company instructions, or accounting notes"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                          {copy.cancel}
                        </Button>
                        <Button type="submit" disabled={requestingInvoice}>
                          {invoiceSubmitLabel}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="profile" className="mt-6">
                <div className="max-w-4xl">
                  <GlassCard className="card-static rounded-[32px] p-7">
                    <form className="grid gap-5 md:grid-cols-2" onSubmit={handleProfileSave}>
                      <div className="space-y-2">
                        <Label htmlFor="customer-name">{copy.name}</Label>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="customer-name"
                            className="pl-9"
                            value={profileForm.name}
                            onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer-email">{copy.email}</Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input id="customer-email" className="pl-9" value={data.user.email} readOnly disabled />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer-phone">{copy.phone}</Label>
                        <div className="grid grid-cols-[minmax(120px,150px)_1fr] gap-2">
                          <Select
                            value={profileForm.phoneCountryCode}
                            onValueChange={(phoneCountryCode) => setProfileForm((current) => ({ ...current, phoneCountryCode }))}
                          >
                            <SelectTrigger id="customer-phone-code" className="w-full bg-white">
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
                          <Input
                            id="customer-phone"
                            className="bg-white"
                            value={profileForm.phone}
                            onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer-country">{copy.country}</Label>
                        <Select
                          value={profileForm.countryCode}
                          onValueChange={(countryCode) =>
                            setProfileForm((current) => ({
                              ...current,
                              countryCode,
                              country: getBookingCountryLabel(countryCode, locale),
                              phoneCountryCode: getDefaultPhoneCountryCode(countryCode),
                            }))
                          }
                        >
                          <SelectTrigger id="customer-country" className="w-full bg-white">
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
                        <Label htmlFor="customer-company">{copy.company}</Label>
                        <Input
                          id="customer-company"
                          value={profileForm.company}
                          onChange={(event) => setProfileForm((current) => ({ ...current, company: event.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button type="submit" className="rounded-full" disabled={savingProfile}>
                          {copy.save}
                        </Button>
                      </div>
                    </form>
                  </GlassCard>

                  <GlassCard className="card-static rounded-[32px] p-7">
                    <div className="flex items-center gap-3">
                      <ReceiptText className="h-6 w-6 text-primary" />
                      <div>
                        <h2 className="text-2xl font-bold text-slate-950">{invoiceCopy.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{invoiceSubtitle}</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {(data.bookings.length ? data.bookings : [null]).map((booking, index) => {
                        const invoice = booking ? invoicesByBookingId.get(booking.id) : null;
                        return (
                          <div key={booking ? booking.id : `placeholder-${index}`} className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {booking ? formatDateTime(booking.date, booking.hour, locale) : invoiceEmptyLabel}
                                </div>
                                <div className="mt-2 text-sm text-slate-600">
                                  {booking
                                    ? `${booking.serviceType === "support" ? copy.support : copy.consultation} • ${
                                        booking.priority === "express" ? copy.express : copy.standard
                                      }`
                    : invoiceSubtitle}
                                </div>
                                {invoice ? (
                                  <div className="mt-4 space-y-1 text-sm text-slate-600">
                                    <div className="font-medium text-slate-900">{invoice.invoiceNumber}</div>
                                    <div>
                                      {invoiceIssuedLabel}: {formatDate(invoice.issuedAt, locale)}
                                    </div>
                                    <div>{formatInvoiceAmount(invoice.totalAmount, invoice.currency, locale)}</div>
                                  </div>
                                ) : booking ? (
                                  <div className="mt-4 text-sm text-slate-500">{invoiceCopy.pending}</div>
                                ) : null}
                              </div>
                              {invoice?.downloadUrl ? (
                                <Button type="button" variant="outline" className="rounded-full" asChild>
                                  <a href={invoice.downloadUrl} target="_blank" rel="noreferrer">
                                    {invoiceDownloadLabel}
                                  </a>
                                </Button>
                              ) : (
                                <Button type="button" variant="outline" className="rounded-full" disabled>
                                  {invoiceCopy.action}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
