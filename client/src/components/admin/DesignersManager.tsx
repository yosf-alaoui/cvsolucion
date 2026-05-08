import { useEffect, useMemo, useState } from "react";
import { CalendarDays, LayoutList, Save, Trash2, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import {
  assignAdminBookingDesigner,
  createAdminDesignerTask,
  deleteAdminDesignerTask,
  getAdminDesigners,
  updateAdminDesignerTask,
  updateAdminUser,
  type AdminDesignerTask,
  type AdminDesignerTaskPriority,
  type AdminDesignerTaskStatus,
  type AdminDesignersResponse,
} from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

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

function fallbackName(email: string) {
  const localPart = email.split("@")[0] || email;
  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getCopy(locale: string) {
  if (locale === "ar") {
    return {
      title: "إدارة المصممين",
      subtitle: "عيّن المواعيد للمصممين، وتابع مهامهم، واضبط ملفاتهم من مكان واحد.",
      addDesigner: "إضافة مصمم من حساب موجود",
      selectUser: "اختر المستخدم",
      displayName: "الاسم الظاهر",
      titleField: "المسمى",
      active: "نشط",
      notes: "ملاحظات",
      save: "حفظ",
      removeRole: "إزالة دور المصمم",
      assignedBookings: "المواعيد المسندة",
      tasks: "المهام",
      openTasks: "المهام المفتوحة",
      completedTasks: "المهام المكتملة",
      noDesigners: "لا يوجد مصممون حاليا.",
      noTasks: "لا توجد مهام.",
      noBookings: "لا توجد مواعيد.",
      assignBooking: "تعيين الموعد",
      taskTitle: "عنوان المهمة",
      taskDescription: "وصف المهمة",
      taskPriority: "الأولوية",
      taskStatus: "الحالة",
      taskDueAt: "موعد التنفيذ",
      taskBooking: "ربط بموعد",
      createTask: "إنشاء مهمة",
      upcomingBookings: "المواعيد القادمة",
      unassigned: "غير مسند",
      none: "بدون",
      todo: "جديدة",
      inProgress: "قيد التنفيذ",
      done: "مكتملة",
      low: "منخفضة",
      normal: "عادية",
      high: "مرتفعة",
      profileSaved: "تم تحديث ملف المصمم.",
      designerAdded: "تم تفعيل الحساب كمصمم.",
      designerRemoved: "تمت إزالة دور المصمم.",
      taskCreated: "تم إنشاء المهمة.",
      taskDeleted: "تم حذف المهمة.",
      bookingAssigned: "تم تحديث تعيين الموعد.",
    };
  }

  if (locale === "fr") {
    return {
      title: "Gestion designers",
      subtitle: "Assignez les bookings, suivez les taches et gerez les profils designers depuis un seul espace.",
      addDesigner: "Promouvoir un compte existant",
      selectUser: "Choisir l'utilisateur",
      displayName: "Nom affiche",
      titleField: "Titre",
      active: "Actif",
      notes: "Notes",
      save: "Enregistrer",
      removeRole: "Retirer le role designer",
      assignedBookings: "Bookings assignes",
      tasks: "Taches",
      openTasks: "Taches ouvertes",
      completedTasks: "Taches terminees",
      noDesigners: "Aucun designer pour le moment.",
      noTasks: "Aucune tache.",
      noBookings: "Aucun booking.",
      assignBooking: "Assigner le booking",
      taskTitle: "Titre de la tache",
      taskDescription: "Description",
      taskPriority: "Priorite",
      taskStatus: "Statut",
      taskDueAt: "Echeance",
      taskBooking: "Booking lie",
      createTask: "Creer la tache",
      upcomingBookings: "Bookings a venir",
      unassigned: "Non assigne",
      none: "Aucun",
      todo: "A faire",
      inProgress: "En cours",
      done: "Terminee",
      low: "Basse",
      normal: "Normale",
      high: "Haute",
      profileSaved: "Profil designer mis a jour.",
      designerAdded: "Compte converti en designer.",
      designerRemoved: "Role designer retire.",
      taskCreated: "Tache creee.",
      taskDeleted: "Tache supprimee.",
      bookingAssigned: "Assignation mise a jour.",
    };
  }

  return {
    title: "Designer management",
    subtitle: "Assign bookings, track tasks, and manage designer profiles from one workspace.",
    addDesigner: "Promote an existing account",
    selectUser: "Select user",
    displayName: "Display name",
    titleField: "Title",
    active: "Active",
    notes: "Notes",
    save: "Save",
    removeRole: "Remove designer role",
    assignedBookings: "Assigned bookings",
    tasks: "Tasks",
    openTasks: "Open tasks",
    completedTasks: "Completed tasks",
    noDesigners: "No designers yet.",
    noTasks: "No tasks yet.",
    noBookings: "No bookings yet.",
    assignBooking: "Assign booking",
    taskTitle: "Task title",
    taskDescription: "Task description",
    taskPriority: "Priority",
    taskStatus: "Status",
    taskDueAt: "Due at",
    taskBooking: "Linked booking",
    createTask: "Create task",
    upcomingBookings: "Upcoming bookings",
    unassigned: "Unassigned",
    none: "None",
    todo: "Todo",
    inProgress: "In progress",
    done: "Done",
    low: "Low",
    normal: "Normal",
    high: "High",
    profileSaved: "Designer profile updated.",
    designerAdded: "Account promoted to designer.",
    designerRemoved: "Designer role removed.",
    taskCreated: "Task created.",
    taskDeleted: "Task deleted.",
    bookingAssigned: "Booking assignment updated.",
  };
}

export default function DesignersManager({ locale }: { locale: string }) {
  const copy = useMemo(() => getCopy(locale), [locale]);
  const [data, setData] = useState<AdminDesignersResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>("");
  const [candidateUserId, setCandidateUserId] = useState<string>("");
  const [candidateDisplayName, setCandidateDisplayName] = useState("");
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    title: "",
    notes: "",
    active: true,
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "normal" as AdminDesignerTaskPriority,
    status: "todo" as AdminDesignerTaskStatus,
    dueAt: "",
    bookingId: "none",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingDesigner, setCreatingDesigner] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskBusyId, setTaskBusyId] = useState<string | null>(null);
  const [bookingBusyId, setBookingBusyId] = useState<string | null>(null);

  const load = async (preserveSelectedId?: string | null) => {
    setBusy(true);
    try {
      const response = await getAdminDesigners();
      setData(response);
      const selectedCandidate = preserveSelectedId || selectedDesignerId;
      const hasSelected = selectedCandidate && response.designers.some((designer) => designer.user.id === selectedCandidate);
      setSelectedDesignerId(hasSelected ? selectedCandidate : response.designers[0]?.user.id || "");
    } catch (error: any) {
      toast.error(error?.message || "Failed to load designers.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDesigner = useMemo(
    () => data?.designers.find((designer) => designer.user.id === selectedDesignerId) || null,
    [data, selectedDesignerId]
  );

  const selectedDesignerTasks = useMemo(
    () => (data?.tasks || []).filter((task) => task.designerUserId === selectedDesignerId),
    [data?.tasks, selectedDesignerId]
  );

  const designerBookingIds = useMemo(() => new Set(selectedDesignerTasks.map((task) => task.bookingId).filter(Boolean)), [selectedDesignerTasks]);

  useEffect(() => {
    if (!selectedDesigner) return;
    setProfileForm({
      displayName: selectedDesigner.profile.displayName || selectedDesigner.user.displayName,
      title: selectedDesigner.profile.title || "",
      notes: selectedDesigner.profile.notes || "",
      active: selectedDesigner.profile.active,
    });
  }, [selectedDesigner]);

  const promoteCandidates = useMemo(
    () => (data?.candidateUsers || []).filter((user) => user.role !== "designer"),
    [data?.candidateUsers]
  );

  async function handlePromoteDesigner() {
    const candidate = promoteCandidates.find((user) => user.id === candidateUserId);
    if (!candidate) return;
    try {
      setCreatingDesigner(true);
      await updateAdminUser(candidate.id, {
        email: candidate.email,
        emailVerified: Boolean(candidate.emailVerifiedAt),
        role: "designer",
        displayName: candidateDisplayName.trim() || fallbackName(candidate.email),
        title: "Designer",
        notes: "",
        active: true,
      });
      setCandidateUserId("");
      setCandidateDisplayName("");
      await load(candidate.id);
      toast.success(copy.designerAdded);
    } catch (error: any) {
      toast.error(error?.message || copy.designerAdded);
    } finally {
      setCreatingDesigner(false);
    }
  }

  async function handleSaveProfile() {
    if (!selectedDesigner) return;
    try {
      setSavingProfile(true);
      await updateAdminUser(selectedDesigner.user.id, {
        email: selectedDesigner.user.email,
        emailVerified: Boolean(selectedDesigner.user.emailVerifiedAt),
        role: "designer",
        displayName: profileForm.displayName,
        title: profileForm.title,
        notes: profileForm.notes,
        active: profileForm.active,
      });
      await load(selectedDesigner.user.id);
      toast.success(copy.profileSaved);
    } catch (error: any) {
      toast.error(error?.message || copy.profileSaved);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleRemoveDesignerRole() {
    if (!selectedDesigner) return;
    try {
      setSavingProfile(true);
      await updateAdminUser(selectedDesigner.user.id, {
        email: selectedDesigner.user.email,
        emailVerified: Boolean(selectedDesigner.user.emailVerifiedAt),
        role: "customer",
      });
      await load();
      toast.success(copy.designerRemoved);
    } catch (error: any) {
      toast.error(error?.message || copy.designerRemoved);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAssignBooking(bookingId: string, designerUserId: string | null) {
    try {
      setBookingBusyId(bookingId);
      await assignAdminBookingDesigner(bookingId, designerUserId);
      await load(selectedDesignerId);
      toast.success(copy.bookingAssigned);
    } catch (error: any) {
      toast.error(error?.message || copy.bookingAssigned);
    } finally {
      setBookingBusyId(null);
    }
  }

  async function handleCreateTask() {
    if (!selectedDesignerId || taskForm.title.trim().length < 3) return;
    try {
      setCreatingTask(true);
      await createAdminDesignerTask({
        designerUserId: selectedDesignerId,
        title: taskForm.title,
        description: taskForm.description || null,
        priority: taskForm.priority,
        status: taskForm.status,
        dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null,
        bookingId: taskForm.bookingId === "none" ? null : taskForm.bookingId,
      });
      setTaskForm({
        title: "",
        description: "",
        priority: "normal",
        status: "todo",
        dueAt: "",
        bookingId: "none",
      });
      await load(selectedDesignerId);
      toast.success(copy.taskCreated);
    } catch (error: any) {
      toast.error(error?.message || copy.taskCreated);
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleTaskStatus(task: AdminDesignerTask, status: AdminDesignerTaskStatus) {
    try {
      setTaskBusyId(task.id);
      await updateAdminDesignerTask(task.id, { status });
      await load(selectedDesignerId);
    } catch (error: any) {
      toast.error(error?.message || "Task update failed.");
    } finally {
      setTaskBusyId(null);
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      setTaskBusyId(taskId);
      await deleteAdminDesignerTask(taskId);
      await load(selectedDesignerId);
      toast.success(copy.taskDeleted);
    } catch (error: any) {
      toast.error(error?.message || copy.taskDeleted);
    } finally {
      setTaskBusyId(null);
    }
  }

  if (busy && !data) {
    return <div className="text-sm text-slate-500">...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <p className="text-sm text-slate-500">{copy.subtitle}</p>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <UserPlus className="h-4 w-4 text-primary" />
              {copy.addDesigner}
            </div>
            <div className="mt-4 grid gap-3">
              <div className="space-y-2">
                <Label>{copy.selectUser}</Label>
                <Select value={candidateUserId} onValueChange={setCandidateUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder={copy.selectUser} />
                  </SelectTrigger>
                  <SelectContent>
                    {promoteCandidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{copy.displayName}</Label>
                <Input value={candidateDisplayName} onChange={(event) => setCandidateDisplayName(event.target.value)} />
              </div>
              <Button type="button" onClick={() => void handlePromoteDesigner()} disabled={creatingDesigner || !candidateUserId}>
                {copy.addDesigner}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(data?.designers || []).length ? (
              data?.designers.map((designer) => (
                <button
                  key={designer.user.id}
                  type="button"
                  onClick={() => setSelectedDesignerId(designer.user.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    selectedDesignerId === designer.user.id
                      ? "border-primary bg-primary/8 shadow-sm"
                      : "border-slate-200 bg-white hover:border-primary/35 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <UsersRound className="h-4 w-4 text-primary" />
                    {designer.profile.displayName || designer.user.displayName}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{designer.user.email}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{copy.assignedBookings}: {designer.stats.assignedBookings}</span>
                    <span>{copy.openTasks}: {designer.stats.openTasks}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-full text-sm text-slate-500">{copy.noDesigners}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedDesigner ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedDesigner.profile.displayName || selectedDesigner.user.displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{copy.assignedBookings}</div>
                    <div className="mt-2 text-2xl font-bold text-slate-950">{selectedDesigner.stats.assignedBookings}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{copy.openTasks}</div>
                    <div className="mt-2 text-2xl font-bold text-slate-950">{selectedDesigner.stats.openTasks}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{copy.completedTasks}</div>
                    <div className="mt-2 text-2xl font-bold text-slate-950">{selectedDesigner.stats.completedTasks}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{copy.displayName}</Label>
                  <Input
                    value={profileForm.displayName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{copy.titleField}</Label>
                  <Input value={profileForm.title} onChange={(event) => setProfileForm((current) => ({ ...current, title: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{copy.notes}</Label>
                  <Textarea
                    value={profileForm.notes}
                    onChange={(event) => setProfileForm((current) => ({ ...current, notes: event.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">{copy.active}</div>
                  <Switch
                    checked={profileForm.active}
                    onCheckedChange={(active) => setProfileForm((current) => ({ ...current, active }))}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => void handleSaveProfile()} disabled={savingProfile}>
                    <Save className="h-4 w-4" />
                    {copy.save}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => void handleRemoveDesignerRole()} disabled={savingProfile}>
                    {copy.removeRole}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{copy.tasks}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label>{copy.taskTitle}</Label>
                    <Input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.taskDescription}</Label>
                    <Textarea
                      rows={4}
                      value={taskForm.description}
                      onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{copy.taskPriority}</Label>
                      <Select
                        value={taskForm.priority}
                        onValueChange={(priority: AdminDesignerTaskPriority) =>
                          setTaskForm((current) => ({ ...current, priority }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{copy.low}</SelectItem>
                          <SelectItem value="normal">{copy.normal}</SelectItem>
                          <SelectItem value="high">{copy.high}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{copy.taskStatus}</Label>
                      <Select
                        value={taskForm.status}
                        onValueChange={(status: AdminDesignerTaskStatus) =>
                          setTaskForm((current) => ({ ...current, status }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">{copy.todo}</SelectItem>
                          <SelectItem value="in_progress">{copy.inProgress}</SelectItem>
                          <SelectItem value="done">{copy.done}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{copy.taskDueAt}</Label>
                      <Input
                        type="datetime-local"
                        value={taskForm.dueAt}
                        onChange={(event) => setTaskForm((current) => ({ ...current, dueAt: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{copy.taskBooking}</Label>
                      <Select value={taskForm.bookingId} onValueChange={(bookingId) => setTaskForm((current) => ({ ...current, bookingId }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{copy.none}</SelectItem>
                          {(data?.bookings || [])
                            .filter((booking) => booking.designerUserId === selectedDesignerId)
                            .map((booking) => (
                              <SelectItem key={booking.id} value={booking.id}>
                                {booking.name} • {booking.date} {String(booking.hour).padStart(2, "0")}:00
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="button" onClick={() => void handleCreateTask()} disabled={creatingTask || !selectedDesignerId}>
                    <LayoutList className="h-4 w-4" />
                    {copy.createTask}
                  </Button>
                </div>

                <ScrollArea className="max-h-[28rem] pr-2">
                  <div className="space-y-3">
                    {selectedDesignerTasks.length ? (
                      selectedDesignerTasks.map((task) => (
                        <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900">{task.title}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="outline" className="rounded-full">{task.priority}</Badge>
                                <Badge className="rounded-full">{task.status}</Badge>
                              </div>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => void handleDeleteTask(task.id)} disabled={taskBusyId === task.id}>
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </Button>
                          </div>
                          {task.description ? <div className="mt-3 text-sm leading-6 text-slate-600">{task.description}</div> : null}
                          {task.booking ? (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                              {task.booking.name} • {formatDateTime(task.booking.date, task.booking.hour, locale)}
                            </div>
                          ) : null}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-slate-500">{formatDate(task.dueAt, locale)}</div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => void handleTaskStatus(task, "todo")} disabled={taskBusyId === task.id}>
                                {copy.todo}
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => void handleTaskStatus(task, "in_progress")} disabled={taskBusyId === task.id}>
                                {copy.inProgress}
                              </Button>
                              <Button type="button" size="sm" onClick={() => void handleTaskStatus(task, "done")} disabled={taskBusyId === task.id}>
                                {copy.done}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">{copy.noTasks}</div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{copy.upcomingBookings}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.assignBooking}</TableHead>
                      <TableHead>{copy.selectUser}</TableHead>
                      <TableHead>{copy.taskBooking}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.bookings || []).length ? (
                      data?.bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="font-medium text-slate-900">{booking.name}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                              {formatDateTime(booking.date, booking.hour, locale)}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[220px]">
                            <Select
                              value={booking.designerUserId || "none"}
                              onValueChange={(value) => void handleAssignBooking(booking.id, value === "none" ? null : value)}
                            >
                              <SelectTrigger disabled={bookingBusyId === booking.id}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">{copy.unassigned}</SelectItem>
                                {(data?.designers || []).map((designer) => (
                                  <SelectItem key={designer.user.id} value={designer.user.id}>
                                    {designer.profile.displayName || designer.user.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-600">
                              {booking.designerUserId && designerBookingIds.has(booking.id) ? copy.tasks : copy.none}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-slate-500">
                          {copy.noBookings}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
