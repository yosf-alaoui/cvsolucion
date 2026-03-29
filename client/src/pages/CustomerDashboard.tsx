import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Mail, MapPin, Phone, ReceiptText, RefreshCcw, UserRound } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import { getCustomerDashboard, updateCustomerProfile, type CustomerDashboardResponse } from "@/lib/customer";
import { getBookingAvailability, rescheduleBooking, type BookingAvailabilitySlot, type BookingRecord } from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function formatDateTime(date: string, hour: number, locale: string) {
  const dt = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dt);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function slotSummary(slot: BookingAvailabilitySlot, locale: string) {
  return formatDateTime(slot.date, slot.hour, locale);
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
  const [profileForm, setProfileForm] = useState({
    name: "",
    country: "",
    phone: "",
    company: "",
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

  const invoiceCopy = useMemo(() => {
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
        subtitle: "La facture sera generee et exportee apres le rendez-vous.",
        pending: "Facture non active pour le moment",
        action: "Disponible apres le rendez-vous",
      };
    }
    return {
      title: "Invoices",
      subtitle: "The invoice will be generated and exported after the appointment has passed.",
      pending: "Invoice not active yet",
      action: "Available after the appointment",
    };
  }, [locale]);

  async function loadDashboard() {
    const response = await getCustomerDashboard();
    setData(response);
    setProfileForm({
      name: response.profile.name || "",
      country: response.profile.country || "",
      phone: response.profile.phone || "",
      company: response.profile.company || "",
    });
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

  async function handleProfileSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSavingProfile(true);
      const response = await updateCustomerProfile(profileForm);
      setData((current) => (current ? { ...current, profile: response.profile } : current));
      toast.success(copy.profileSaved);
    } catch (error: any) {
      toast.error(error?.message || "Profile update failed.");
    } finally {
      setSavingProfile(false);
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

              <TabsContent value="profile" className="mt-6">
                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
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
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="customer-phone"
                            className="pl-9"
                            value={profileForm.phone}
                            onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer-country">{copy.country}</Label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="customer-country"
                            className="pl-9"
                            value={profileForm.country}
                            onChange={(event) => setProfileForm((current) => ({ ...current, country: event.target.value }))}
                            required
                          />
                        </div>
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
                        <p className="mt-2 text-sm leading-6 text-slate-600">{invoiceCopy.subtitle}</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {(data.bookings.length ? data.bookings : [null]).map((booking, index) => (
                        <div key={booking ? booking.id : `placeholder-${index}`} className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {booking ? formatDateTime(booking.date, booking.hour, locale) : invoiceCopy.pending}
                              </div>
                              <div className="mt-2 text-sm text-slate-600">
                                {booking
                                  ? `${booking.serviceType === "support" ? copy.support : copy.consultation} • ${
                                      booking.priority === "express" ? copy.express : copy.standard
                                    }`
                                  : invoiceCopy.subtitle}
                              </div>
                            </div>
                            <Button type="button" variant="outline" className="rounded-full" disabled>
                              {invoiceCopy.action}
                            </Button>
                          </div>
                        </div>
                      ))}
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
