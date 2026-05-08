import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, LayoutList, LogOut, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import Seo from "@/components/Seo";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import { getDesignerDashboard, updateDesignerTaskStatus, type DesignerDashboardResponse } from "@/lib/designer";

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

export default function DesignerDashboard() {
  const { locale } = useI18n();
  const { user, role, loading, logout } = useAuth();
  const [data, setData] = useState<DesignerDashboardResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [taskBusyId, setTaskBusyId] = useState<string | null>(null);

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "لوحة المصمم",
        subtitle: "راجع المواعيد المسندة إليك والمهام المفتوحة من مكان واحد.",
        signInRequired: "يجب تسجيل الدخول بحساب مصمم.",
        accessDenied: "هذا القسم مخصص لحسابات المصممين فقط.",
        upcoming: "المواعيد القادمة",
        history: "السجل",
        tasks: "المهام",
        noBookings: "لا توجد مواعيد مسندة حاليا.",
        noTasks: "لا توجد مهام حاليا.",
        assignedBookings: "المواعيد المسندة",
        openTasks: "المهام المفتوحة",
        completedTasks: "المهام المكتملة",
        dueAt: "موعد التنفيذ",
        notes: "ملاحظات العميل",
        company: "الشركة",
        country: "الدولة",
        markTodo: "إرجاع إلى جديد",
        markProgress: "قيد التنفيذ",
        markDone: "تم",
        signOut: "تسجيل الخروج",
        login: "تسجيل الدخول",
        todo: "جديدة",
        inProgress: "قيد التنفيذ",
        done: "مكتملة",
        low: "منخفضة",
        normal: "عادية",
        high: "مرتفعة",
      };
    }
    if (locale === "fr") {
      return {
        title: "Espace designer",
        subtitle: "Consultez vos bookings assignes et vos taches depuis un seul poste.",
        signInRequired: "Connexion requise avec un compte designer.",
        accessDenied: "Cette zone est reservee aux designers.",
        upcoming: "A venir",
        history: "Historique",
        tasks: "Taches",
        noBookings: "Aucun booking assigne pour le moment.",
        noTasks: "Aucune tache pour le moment.",
        assignedBookings: "Bookings assignes",
        openTasks: "Taches ouvertes",
        completedTasks: "Taches terminees",
        dueAt: "Echeance",
        notes: "Notes client",
        company: "Societe",
        country: "Pays",
        markTodo: "Remettre en attente",
        markProgress: "En cours",
        markDone: "Terminee",
        signOut: "Se deconnecter",
        login: "Connexion",
        todo: "A faire",
        inProgress: "En cours",
        done: "Terminee",
        low: "Basse",
        normal: "Normale",
        high: "Haute",
      };
    }
    return {
      title: "Designer desk",
      subtitle: "Review your assigned appointments and active tasks in one operational view.",
      signInRequired: "Sign in with a designer account.",
      accessDenied: "This area is reserved for designer accounts.",
      upcoming: "Upcoming",
      history: "History",
      tasks: "Tasks",
      noBookings: "No assigned bookings yet.",
      noTasks: "No tasks yet.",
      assignedBookings: "Assigned bookings",
      openTasks: "Open tasks",
      completedTasks: "Completed tasks",
      dueAt: "Due",
      notes: "Client notes",
      company: "Company",
      country: "Country",
      markTodo: "Move to todo",
      markProgress: "In progress",
      markDone: "Mark done",
      signOut: "Sign out",
      login: "Login",
      todo: "Todo",
      inProgress: "In progress",
      done: "Done",
      low: "Low",
      normal: "Normal",
      high: "High",
    };
  }, [locale]);

  useEffect(() => {
    if (loading) return;
    if (!user || role !== "designer") {
      setBusy(false);
      return;
    }

    setBusy(true);
    getDesignerDashboard()
      .then(setData)
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setBusy(false));
  }, [loading, role, user]);

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
  const openTasks = useMemo(() => (data?.tasks || []).filter((task) => task.status !== "done"), [data?.tasks]);
  const doneTasks = useMemo(() => (data?.tasks || []).filter((task) => task.status === "done"), [data?.tasks]);

  async function handleTaskStatus(taskId: string, status: "todo" | "in_progress" | "done") {
    try {
      setTaskBusyId(taskId);
      const response = await updateDesignerTaskStatus(taskId, status);
      setData((current) =>
        current
          ? {
              ...current,
              tasks: current.tasks.map((task) => (task.id === taskId ? response.task : task)),
            }
          : current
      );
    } catch (error: any) {
      toast.error(error?.message || "Task update failed.");
    } finally {
      setTaskBusyId(null);
    }
  }

  if (loading || busy) {
    return (
      <div className="site-page min-h-screen bg-transparent px-4 py-24">
        <div className="mx-auto max-w-5xl text-center text-slate-600">Loading designer workspace...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="site-page min-h-screen bg-transparent px-4 py-24">
        <div className="mx-auto max-w-xl">
          <GlassCard strong className="card-static rounded-[34px] p-8 text-center">
            <h1 className="text-3xl font-bold text-slate-950">{copy.title}</h1>
            <p className="mt-4 text-slate-600">{copy.signInRequired}</p>
            <Button asChild className="mt-6 rounded-full">
              <Link href={locale === "en" ? "/login" : `/${locale}/login`}>{copy.login}</Link>
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (role !== "designer") {
    return (
      <div className="site-page min-h-screen bg-transparent px-4 py-24">
        <div className="mx-auto max-w-xl">
          <GlassCard strong className="card-static rounded-[34px] p-8 text-center">
            <h1 className="text-3xl font-bold text-slate-950">{copy.title}</h1>
            <p className="mt-4 text-slate-600">{copy.accessDenied}</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="site-page min-h-screen bg-transparent">
      <Seo title={`${copy.title} | CVsolucion`} description={copy.subtitle} type="website" />
      <main className="px-4 pb-16 pt-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[30px] border border-white/35 bg-white/85 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <a href="/" className="flex items-center">
                  <picture>
                    <source srcSet="/logo.webp" type="image/webp" />
                    <img src="/logo.png" alt="CVsolucion" className="h-10 w-auto" />
                  </picture>
                </a>
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.28em] text-primary/70">Designer</div>
                  <div className="text-lg font-bold text-slate-950">{data?.profile.displayName || data?.user.email}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full px-4 py-1.5 text-sm">{data?.profile.title || copy.title}</Badge>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    void logout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {copy.signOut}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h1 className="text-4xl font-bold text-slate-950 sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 text-lg text-slate-600">{copy.subtitle}</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <GlassCard className="card-static rounded-[30px] p-5">
              <div className="text-sm text-slate-500">{copy.assignedBookings}</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{data?.bookings.length || 0}</div>
            </GlassCard>
            <GlassCard className="card-static rounded-[30px] p-5">
              <div className="text-sm text-slate-500">{copy.upcoming}</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{upcomingBookings.length}</div>
            </GlassCard>
            <GlassCard className="card-static rounded-[30px] p-5">
              <div className="text-sm text-slate-500">{copy.openTasks}</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{openTasks.length}</div>
            </GlassCard>
            <GlassCard className="card-static rounded-[30px] p-5">
              <div className="text-sm text-slate-500">{copy.completedTasks}</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{doneTasks.length}</div>
            </GlassCard>
          </div>

          <Tabs defaultValue="bookings" className="mt-10">
            <TabsList className="h-auto rounded-full p-1">
              <TabsTrigger value="bookings" className="rounded-full px-5 py-2">
                {copy.upcoming}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-full px-5 py-2">
                {copy.tasks}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="mt-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <GlassCard className="card-static rounded-[32px] p-7">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold text-slate-950">{copy.upcoming}</h2>
                  </div>
                  <div className="mt-5 space-y-4">
                    {upcomingBookings.length ? (
                      upcomingBookings.map((booking) => (
                        <div key={booking.id} className="rounded-[24px] border border-slate-200 bg-white/75 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-950">{formatDateTime(booking.date, booking.hour, locale)}</div>
                              <div className="mt-2 text-sm text-slate-600">
                                {booking.serviceType} • {booking.priority}
                              </div>
                            </div>
                            <Badge variant="outline" className="rounded-full">
                              {booking.currency.toUpperCase()} {(booking.unitAmount / 100).toFixed(2)}
                            </Badge>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                                <UserRound className="h-4 w-4" />
                                Client
                              </div>
                              <div className="mt-2 font-semibold text-slate-900">{booking.name}</div>
                              <div className="mt-1 text-sm text-slate-500">{booking.email}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                                <Phone className="h-4 w-4" />
                                {copy.company}
                              </div>
                              <div className="mt-2 font-semibold text-slate-900">{booking.company || "-"}</div>
                              <div className="mt-1 text-sm text-slate-500">{booking.phone || "-"}</div>
                            </div>
                          </div>
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                              <Mail className="h-4 w-4" />
                              {copy.notes}
                            </div>
                            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{booking.notes || "-"}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500">{copy.noBookings}</div>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="card-static rounded-[32px] p-7">
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold text-slate-950">{copy.history}</h2>
                  </div>
                  <div className="mt-5 space-y-4">
                    {pastBookings.length ? (
                      pastBookings.map((booking) => (
                        <div key={booking.id} className="rounded-[24px] border border-slate-200 bg-white/75 p-5">
                          <div className="font-semibold text-slate-950">{formatDateTime(booking.date, booking.hour, locale)}</div>
                          <div className="mt-2 text-sm text-slate-600">{booking.name}</div>
                          <div className="mt-2 text-xs text-slate-500">{copy.country}: {booking.country || "-"}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500">{copy.noBookings}</div>
                    )}
                  </div>
                </GlassCard>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <GlassCard className="card-static rounded-[32px] p-7">
                  <div className="flex items-center gap-3">
                    <LayoutList className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold text-slate-950">{copy.tasks}</h2>
                  </div>
                  <ScrollArea className="mt-5 max-h-[36rem] pr-2">
                    <div className="space-y-4">
                      {openTasks.length ? (
                        openTasks.map((task) => (
                          <div key={task.id} className="rounded-[24px] border border-slate-200 bg-white/75 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-950">{task.title}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Badge variant="outline" className="rounded-full">{task.priority}</Badge>
                                  <Badge className="rounded-full bg-slate-900 text-white">{task.status}</Badge>
                                </div>
                              </div>
                              <div className="text-sm text-slate-500">{copy.dueAt}: {formatDate(task.dueAt, locale)}</div>
                            </div>
                            {task.description ? (
                              <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{task.description}</div>
                            ) : null}
                            {task.booking ? (
                              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                {task.booking.name} • {formatDateTime(task.booking.date, task.booking.hour, locale)}
                              </div>
                            ) : null}
                            <div className="mt-4 flex flex-wrap gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-full"
                                disabled={taskBusyId === task.id}
                                onClick={() => void handleTaskStatus(task.id, "todo")}
                              >
                                {copy.markTodo}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-full"
                                disabled={taskBusyId === task.id}
                                onClick={() => void handleTaskStatus(task.id, "in_progress")}
                              >
                                {copy.markProgress}
                              </Button>
                              <Button
                                type="button"
                                className="rounded-full"
                                disabled={taskBusyId === task.id}
                                onClick={() => void handleTaskStatus(task.id, "done")}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                {copy.markDone}
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500">{copy.noTasks}</div>
                      )}
                    </div>
                  </ScrollArea>
                </GlassCard>

                <GlassCard className="card-static rounded-[32px] p-7">
                  <h2 className="text-2xl font-bold text-slate-950">{copy.completedTasks}</h2>
                  <div className="mt-5 space-y-4">
                    {doneTasks.length ? (
                      doneTasks.map((task) => (
                        <div key={task.id} className="rounded-[24px] border border-slate-200 bg-white/75 p-5">
                          <div className="font-semibold text-slate-950">{task.title}</div>
                          <div className="mt-2 text-sm text-slate-500">{formatDate(task.completedAt || task.updatedAt, locale)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500">{copy.noTasks}</div>
                    )}
                  </div>
                </GlassCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
