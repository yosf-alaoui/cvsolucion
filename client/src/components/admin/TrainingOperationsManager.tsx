import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import {
  createAdminTrainingEnrollment,
  createAdminTrainer,
  getAdminTraining,
  updateAdminTrainingEnrollment,
  updateAdminTrainingSession,
  updateAdminTrainer,
  type AdminTrainingResponse,
  type TrainingEnrollmentSessionView,
  type TrainingEnrollmentStatus,
  type TrainingEnrollmentView,
  type TrainingSessionProgressStatus,
} from "@/lib/trainingProgress";
import { updateAdminUser } from "@/lib/admin";
import TrainingPricingManager from "@/components/admin/TrainingPricingManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: TrainingEnrollmentStatus | TrainingSessionProgressStatus, locale: string) {
  const labels =
    locale === "ar"
      ? {
          pending: "قيد الانتظار",
          active: "نشط",
          completed: "مكتمل",
          paused: "متوقف",
          cancelled: "ملغي",
          repeat_required: "إعادة",
        }
      : locale === "fr"
        ? {
            pending: "En attente",
            active: "Actif",
            completed: "Complete",
            paused: "Pause",
            cancelled: "Annule",
            repeat_required: "A refaire",
          }
        : {
            pending: "Pending",
            active: "Active",
            completed: "Completed",
            paused: "Paused",
            cancelled: "Cancelled",
            repeat_required: "Repeat",
          };

  return labels[status] || status;
}

function getStatusBadgeClass(status: TrainingEnrollmentStatus | TrainingSessionProgressStatus) {
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "repeat_required" || status === "cancelled") return "bg-rose-100 text-rose-700";
  if (status === "active") return "bg-blue-100 text-blue-700";
  if (status === "paused") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function getLevelLabel(levelKey: string, locale: string) {
  if (locale === "ar") {
    if (levelKey === "beginner") return "مبتدئ";
    if (levelKey === "intermediate") return "متوسط";
    if (levelKey === "advanced") return "متقدم";
    return "التحقق النهائي";
  }
  if (locale === "fr") {
    if (levelKey === "beginner") return "Debutant";
    if (levelKey === "intermediate") return "Intermediaire";
    if (levelKey === "advanced") return "Avance";
    return "Validation finale";
  }
  if (levelKey === "beginner") return "Beginner";
  if (levelKey === "intermediate") return "Intermediate";
  if (levelKey === "advanced") return "Advanced";
  return "Final validation";
}

function getProgramTitle(
  program: AdminTrainingResponse["programs"][number],
  locale: "en" | "fr" | "ar"
) {
  return program.translations[locale]?.title || program.translations.en.title || program.key;
}

function currentLevelLabel(enrollment: TrainingEnrollmentView, locale: string) {
  const level = enrollment.levels.find((item) => item.completedSessions < item.totalSessions);
  if (level) return getLevelLabel(level.key, locale);
  if (enrollment.progress.finalValidationCompleted) {
    return locale === "ar" ? "المسار مكتمل" : locale === "fr" ? "Parcours termine" : "Program completed";
  }
  return getLevelLabel("final", locale);
}

function buildSessionForm(session: TrainingEnrollmentSessionView | null) {
  return {
    status: session?.status || "pending",
    score: session?.score === null || typeof session?.score === "undefined" ? "" : String(session.score),
    trainerNotes: session?.trainerNotes || "",
    traineeNotes: session?.traineeNotes || "",
    evidence: session?.evidence || "",
  };
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-bold text-slate-900">{value}</CardContent>
    </Card>
  );
}

export default function TrainingOperationsManager({ locale }: { locale: "en" | "fr" | "ar" }) {
  const [data, setData] = useState<AdminTrainingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [selectedSessionCode, setSelectedSessionCode] = useState("");
  const [creatingTrainer, setCreatingTrainer] = useState(false);
  const [savingTrainer, setSavingTrainer] = useState(false);
  const [creatingEnrollment, setCreatingEnrollment] = useState(false);
  const [savingEnrollment, setSavingEnrollment] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [removingTrainerRole, setRemovingTrainerRole] = useState(false);

  const [trainerCreateForm, setTrainerCreateForm] = useState({
    userId: "",
    displayName: "",
    title: "",
    notes: "",
    active: true,
  });
  const [trainerProfileForm, setTrainerProfileForm] = useState({
    displayName: "",
    title: "",
    notes: "",
    active: true,
  });
  const [enrollmentCreateForm, setEnrollmentCreateForm] = useState({
    userId: "",
    programKey: "",
    trainerUserId: "unassigned",
    status: "pending" as TrainingEnrollmentStatus,
    notes: "",
    internalNotes: "",
  });
  const [enrollmentForm, setEnrollmentForm] = useState({
    trainerUserId: "unassigned",
    status: "pending" as TrainingEnrollmentStatus,
    notes: "",
    internalNotes: "",
  });
  const [sessionForm, setSessionForm] = useState(buildSessionForm(null));

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "تشغيل التدريب",
        subtitle: "أدر المدربين، أنشئ المسارات، عين كل عميل، وتابع كل جلسة وتقييمها من نفس اللوحة.",
        delivery: "التشغيل",
        trainers: "المدربون",
        programs: "البرامج والأسعار",
        rubric: "سلم التقييم",
        createTrainer: "ترقية حساب إلى مدرب",
        existingUser: "الحساب الحالي",
        displayName: "الاسم الظاهر",
        titleField: "المسمى",
        active: "نشط",
        notes: "ملاحظات عامة",
        save: "حفظ",
        removeRole: "إزالة دور المدرب",
        createEnrollment: "إنشاء مسار تدريب",
        customer: "العميل",
        program: "البرنامج",
        assignTrainer: "تعيين المدرب",
        enrollmentStatus: "حالة المسار",
        internalNotes: "ملاحظات داخلية",
        create: "إنشاء",
        noEnrollments: "لا توجد مسارات تدريب بعد.",
        noTrainers: "لا يوجد مدربون بعد.",
        totalEnrollments: "إجمالي المسارات",
        activeTracks: "المسارات النشطة",
        completedTracks: "المسارات المكتملة",
        repeatSessions: "جلسات الإعادة",
        learner: "المتدرب",
        currentLevel: "المستوى الحالي",
        progress: "التقدم",
        sessionRoadmap: "خريطة الجلسات",
        sessionReview: "تأكيد الجلسة",
        sessionStatus: "حالة الجلسة",
        score: "النقطة /10",
        trainerNotes: "ملاحظات المدرب",
        traineeNotes: "ملاحظات المتدرب",
        evidence: "الدليل أو المخرج",
        lastConfirmed: "آخر تأكيد",
        company: "الشركة",
        country: "الدولة",
        passThreshold: "حد النجاح",
        unassigned: "غير مسند",
        activeLabel: "نشط",
        inactiveLabel: "متوقف",
        assignedEnrollments: "المسارات المسندة",
      };
    }
    if (locale === "fr") {
      return {
        title: "Operations formation",
        subtitle: "Gerez les formateurs, creez les parcours, assignez chaque client, et suivez chaque session avec son evaluation.",
        delivery: "Livraison",
        trainers: "Formateurs",
        programs: "Programmes et prix",
        rubric: "Grille d'evaluation",
        createTrainer: "Promouvoir un compte en formateur",
        existingUser: "Compte existant",
        displayName: "Nom affiche",
        titleField: "Titre",
        active: "Actif",
        notes: "Notes publiques",
        save: "Enregistrer",
        removeRole: "Retirer le role formateur",
        createEnrollment: "Creer un parcours",
        customer: "Client",
        program: "Programme",
        assignTrainer: "Assigner le formateur",
        enrollmentStatus: "Statut du parcours",
        internalNotes: "Notes internes",
        create: "Creer",
        noEnrollments: "Aucun parcours pour le moment.",
        noTrainers: "Aucun formateur pour le moment.",
        totalEnrollments: "Total parcours",
        activeTracks: "Parcours actifs",
        completedTracks: "Parcours termines",
        repeatSessions: "Sessions a refaire",
        learner: "Apprenant",
        currentLevel: "Niveau actuel",
        progress: "Progression",
        sessionRoadmap: "Plan des sessions",
        sessionReview: "Validation de session",
        sessionStatus: "Statut de session",
        score: "Score /10",
        trainerNotes: "Notes formateur",
        traineeNotes: "Notes stagiaire",
        evidence: "Preuve / livrable",
        lastConfirmed: "Derniere validation",
        company: "Societe",
        country: "Pays",
        passThreshold: "Seuil de validation",
        unassigned: "Non assigne",
        activeLabel: "Actif",
        inactiveLabel: "Inactif",
        assignedEnrollments: "Parcours assignes",
      };
    }
    return {
      title: "Training operations",
      subtitle: "Manage trainers, create enrollments, assign each learner, and track every session with its evaluation flow.",
      delivery: "Delivery",
      trainers: "Trainers",
      programs: "Programs and pricing",
      rubric: "Evaluation rubric",
      createTrainer: "Promote an account to trainer",
      existingUser: "Existing account",
      displayName: "Display name",
      titleField: "Title",
      active: "Active",
      notes: "Public notes",
      save: "Save",
      removeRole: "Remove trainer role",
      createEnrollment: "Create enrollment",
      customer: "Customer",
      program: "Program",
      assignTrainer: "Assign trainer",
      enrollmentStatus: "Enrollment status",
      internalNotes: "Internal notes",
      create: "Create",
      noEnrollments: "No training enrollments yet.",
      noTrainers: "No trainers yet.",
      totalEnrollments: "Total enrollments",
      activeTracks: "Active tracks",
      completedTracks: "Completed tracks",
      repeatSessions: "Repeat sessions",
      learner: "Learner",
      currentLevel: "Current level",
      progress: "Progress",
      sessionRoadmap: "Session roadmap",
      sessionReview: "Session confirmation",
      sessionStatus: "Session status",
      score: "Score /10",
      trainerNotes: "Trainer notes",
      traineeNotes: "Trainee notes",
      evidence: "Evidence / output",
      lastConfirmed: "Last confirmed",
      company: "Company",
      country: "Country",
      passThreshold: "Pass threshold",
      unassigned: "Unassigned",
      activeLabel: "Active",
      inactiveLabel: "Inactive",
      assignedEnrollments: "Assigned enrollments",
    };
  }, [locale]);

  const load = async (nextEnrollmentId?: string | null, nextTrainerId?: string | null) => {
    setLoading(true);
    try {
      const response = await getAdminTraining(locale);
      setData(response);
      setSelectedEnrollmentId((current) => {
        const candidate = nextEnrollmentId ?? current;
        return candidate && response.enrollments.some((item) => item.id === candidate)
          ? candidate
          : response.enrollments[0]?.id || "";
      });
      setSelectedTrainerId((current) => {
        const candidate = nextTrainerId ?? current;
        return candidate && response.trainers.some((item) => item.user.id === candidate)
          ? candidate
          : response.trainers[0]?.user.id || "";
      });
      setEnrollmentCreateForm((current) => ({
        ...current,
        programKey: current.programKey || response.programs[0]?.key || "",
      }));
    } catch (error: any) {
      toast.error(error?.message || "Failed to load training operations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const selectedEnrollment = useMemo(
    () => data?.enrollments.find((item) => item.id === selectedEnrollmentId) || null,
    [data?.enrollments, selectedEnrollmentId]
  );
  const selectedTrainer = useMemo(
    () => data?.trainers.find((item) => item.user.id === selectedTrainerId) || null,
    [data?.trainers, selectedTrainerId]
  );

  useEffect(() => {
    if (!selectedTrainer) return;
    setTrainerProfileForm({
      displayName: selectedTrainer.profile.displayName || "",
      title: selectedTrainer.profile.title || "",
      notes: selectedTrainer.profile.notes || "",
      active: selectedTrainer.profile.active,
    });
  }, [selectedTrainer]);

  useEffect(() => {
    if (!selectedEnrollment) return;
    setEnrollmentForm({
      trainerUserId: selectedEnrollment.trainerUserId || "unassigned",
      status: selectedEnrollment.status,
      notes: selectedEnrollment.notes || "",
      internalNotes: selectedEnrollment.internalNotes || "",
    });
    setSelectedSessionCode((current) => {
      if (current && selectedEnrollment.sessions.some((session) => session.sessionCode === current)) {
        return current;
      }
      return selectedEnrollment.sessions.find((session) => session.status !== "completed")?.sessionCode || selectedEnrollment.sessions[0]?.sessionCode || "";
    });
  }, [selectedEnrollment]);

  const selectedSession = useMemo(
    () => selectedEnrollment?.sessions.find((session) => session.sessionCode === selectedSessionCode) || null,
    [selectedEnrollment, selectedSessionCode]
  );

  useEffect(() => {
    setSessionForm(buildSessionForm(selectedSession));
  }, [selectedSession]);

  const customerCandidates = useMemo(
    () => (data?.candidateUsers || []).filter((user) => user.role !== "admin" && user.role !== "trainer"),
    [data?.candidateUsers]
  );
  const promoteTrainerCandidates = useMemo(
    () => (data?.candidateUsers || []).filter((user) => user.role !== "admin" && user.role !== "trainer"),
    [data?.candidateUsers]
  );

  const groupedSessions = useMemo(() => {
    if (!selectedEnrollment) return [];
    const order = ["beginner", "intermediate", "advanced", "final"] as const;
    return order
      .map((levelKey) => ({
        levelKey,
        label: getLevelLabel(levelKey, locale),
        sessions: selectedEnrollment.sessions.filter((session) => session.levelKey === levelKey),
      }))
      .filter((group) => group.sessions.length > 0);
  }, [locale, selectedEnrollment]);

  const metrics = useMemo(() => {
    const enrollments = data?.enrollments || [];
    return {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter((item) => item.status === "active").length,
      completedEnrollments: enrollments.filter((item) => item.status === "completed").length,
      repeatSessions: enrollments.reduce(
        (total, enrollment) => total + enrollment.sessions.filter((session) => session.status === "repeat_required").length,
        0
      ),
    };
  }, [data?.enrollments]);

  function mergeEnrollment(nextEnrollment: TrainingEnrollmentView) {
    setData((current) =>
      current
        ? {
            ...current,
            enrollments: current.enrollments.map((item) => (item.id === nextEnrollment.id ? nextEnrollment : item)),
          }
        : current
    );
  }

  async function handleCreateTrainer() {
    if (!trainerCreateForm.userId) return;
    try {
      setCreatingTrainer(true);
      await createAdminTrainer(trainerCreateForm);
      toast.success(locale === "ar" ? "تمت ترقية الحساب إلى مدرب." : locale === "fr" ? "Compte promu en formateur." : "Account promoted to trainer.");
      setTrainerCreateForm({
        userId: "",
        displayName: "",
        title: "",
        notes: "",
        active: true,
      });
      await load(undefined, trainerCreateForm.userId);
    } catch (error: any) {
      toast.error(error?.message || "Trainer creation failed.");
    } finally {
      setCreatingTrainer(false);
    }
  }

  async function handleSaveTrainer() {
    if (!selectedTrainer) return;
    try {
      setSavingTrainer(true);
      await updateAdminTrainer(selectedTrainer.user.id, trainerProfileForm);
      toast.success(locale === "ar" ? "تم تحديث ملف المدرب." : locale === "fr" ? "Profil formateur mis a jour." : "Trainer profile updated.");
      await load(undefined, selectedTrainer.user.id);
    } catch (error: any) {
      toast.error(error?.message || "Trainer update failed.");
    } finally {
      setSavingTrainer(false);
    }
  }

  async function handleRemoveTrainerRole() {
    if (!selectedTrainer) return;
    try {
      setRemovingTrainerRole(true);
      await updateAdminUser(selectedTrainer.user.id, {
        email: selectedTrainer.user.email,
        emailVerified: Boolean(selectedTrainer.user.emailVerifiedAt),
        role: "customer",
      });
      toast.success(locale === "ar" ? "تمت إزالة دور المدرب." : locale === "fr" ? "Role formateur retire." : "Trainer role removed.");
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Trainer role removal failed.");
    } finally {
      setRemovingTrainerRole(false);
    }
  }

  async function handleCreateEnrollment() {
    if (!enrollmentCreateForm.userId || !enrollmentCreateForm.programKey) return;
    try {
      setCreatingEnrollment(true);
      const response = await createAdminTrainingEnrollment({
        locale,
        userId: enrollmentCreateForm.userId,
        programKey: enrollmentCreateForm.programKey,
        trainerUserId: enrollmentCreateForm.trainerUserId === "unassigned" ? null : enrollmentCreateForm.trainerUserId,
        status: enrollmentCreateForm.status,
        notes: enrollmentCreateForm.notes || null,
        internalNotes: enrollmentCreateForm.internalNotes || null,
      });
      toast.success(locale === "ar" ? "تم إنشاء المسار." : locale === "fr" ? "Parcours cree." : "Training enrollment created.");
      setEnrollmentCreateForm((current) => ({
        ...current,
        userId: "",
        trainerUserId: "unassigned",
        status: "pending",
        notes: "",
        internalNotes: "",
      }));
      await load(response.enrollment.id);
    } catch (error: any) {
      toast.error(error?.message || "Enrollment creation failed.");
    } finally {
      setCreatingEnrollment(false);
    }
  }

  async function handleSaveEnrollment() {
    if (!selectedEnrollment) return;
    try {
      setSavingEnrollment(true);
      const response = await updateAdminTrainingEnrollment(selectedEnrollment.id, {
        locale,
        trainerUserId: enrollmentForm.trainerUserId === "unassigned" ? null : enrollmentForm.trainerUserId,
        status: enrollmentForm.status,
        notes: enrollmentForm.notes || null,
        internalNotes: enrollmentForm.internalNotes || null,
      });
      mergeEnrollment(response.enrollment);
      await load(response.enrollment.id, response.enrollment.trainerUserId);
      toast.success(locale === "ar" ? "تم تحديث المسار." : locale === "fr" ? "Parcours mis a jour." : "Enrollment updated.");
    } catch (error: any) {
      toast.error(error?.message || "Enrollment update failed.");
    } finally {
      setSavingEnrollment(false);
    }
  }

  async function handleSaveSession() {
    if (!selectedEnrollment || !selectedSession) return;
    try {
      setSavingSession(true);
      const response = await updateAdminTrainingSession(selectedEnrollment.id, selectedSession.sessionCode, {
        locale,
        status: sessionForm.status,
        score: sessionForm.score === "" ? null : Number(sessionForm.score),
        trainerNotes: sessionForm.trainerNotes || null,
        traineeNotes: sessionForm.traineeNotes || null,
        evidence: sessionForm.evidence || null,
      });
      mergeEnrollment(response.enrollment);
      toast.success(locale === "ar" ? "تم حفظ الجلسة." : locale === "fr" ? "Session enregistree." : "Session saved.");
    } catch (error: any) {
      toast.error(error?.message || "Session update failed.");
    } finally {
      setSavingSession(false);
    }
  }

  if (loading) {
    return <div className="py-6 text-sm text-slate-500">Loading training operations...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <p className="text-sm text-slate-600">{copy.subtitle}</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <StatCard title={copy.totalEnrollments} value={metrics.totalEnrollments} />
          <StatCard title={copy.activeTracks} value={metrics.activeEnrollments} />
          <StatCard title={copy.completedTracks} value={metrics.completedEnrollments} />
          <StatCard title={copy.repeatSessions} value={metrics.repeatSessions} />
        </CardContent>
      </Card>

      <Tabs defaultValue="delivery" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="delivery">{copy.delivery}</TabsTrigger>
          <TabsTrigger value="trainers">{copy.trainers}</TabsTrigger>
          <TabsTrigger value="programs">{copy.programs}</TabsTrigger>
          <TabsTrigger value="rubric">{copy.rubric}</TabsTrigger>
        </TabsList>

        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{copy.createEnrollment}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>{copy.customer}</Label>
                <Select
                  value={enrollmentCreateForm.userId}
                  onValueChange={(userId) => setEnrollmentCreateForm((current) => ({ ...current, userId }))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={copy.customer} />
                  </SelectTrigger>
                  <SelectContent>
                    {customerCandidates.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{copy.program}</Label>
                <Select
                  value={enrollmentCreateForm.programKey}
                  onValueChange={(programKey) => setEnrollmentCreateForm((current) => ({ ...current, programKey }))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={copy.program} />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.programs.map((program) => (
                      <SelectItem key={program.id} value={program.key}>
                        {getProgramTitle(program, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{copy.assignTrainer}</Label>
                <Select
                  value={enrollmentCreateForm.trainerUserId}
                  onValueChange={(trainerUserId) => setEnrollmentCreateForm((current) => ({ ...current, trainerUserId }))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={copy.assignTrainer} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">{copy.unassigned}</SelectItem>
                    {(data?.trainers || []).map((trainer) => (
                      <SelectItem key={trainer.user.id} value={trainer.user.id}>
                        {trainer.profile.displayName || trainer.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{copy.enrollmentStatus}</Label>
                <Select
                  value={enrollmentCreateForm.status}
                  onValueChange={(status) =>
                    setEnrollmentCreateForm((current) => ({ ...current, status: status as TrainingEnrollmentStatus }))
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{getStatusLabel("pending", locale)}</SelectItem>
                    <SelectItem value="active">{getStatusLabel("active", locale)}</SelectItem>
                    <SelectItem value="completed">{getStatusLabel("completed", locale)}</SelectItem>
                    <SelectItem value="paused">{getStatusLabel("paused", locale)}</SelectItem>
                    <SelectItem value="cancelled">{getStatusLabel("cancelled", locale)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{copy.notes}</Label>
                <Textarea
                  rows={3}
                  value={enrollmentCreateForm.notes}
                  onChange={(event) => setEnrollmentCreateForm((current) => ({ ...current, notes: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>{copy.internalNotes}</Label>
                <Textarea
                  rows={3}
                  value={enrollmentCreateForm.internalNotes}
                  onChange={(event) =>
                    setEnrollmentCreateForm((current) => ({ ...current, internalNotes: event.target.value }))
                  }
                />
              </div>

              <div className="lg:col-span-2">
                <Button type="button" onClick={handleCreateEnrollment} disabled={creatingEnrollment}>
                  {creatingEnrollment ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {copy.create}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>{copy.delivery}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.enrollments.length ? (
                    data.enrollments.map((enrollment) => (
                      <button
                        key={enrollment.id}
                        type="button"
                        onClick={() => setSelectedEnrollmentId(enrollment.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          enrollment.id === selectedEnrollmentId
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 bg-white hover:border-primary/25"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-950">
                              {enrollment.customer.name || enrollment.customer.email}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">{enrollment.program.title}</div>
                          </div>
                          <Badge className={`rounded-full ${getStatusBadgeClass(enrollment.status)}`}>
                            {getStatusLabel(enrollment.status, locale)}
                          </Badge>
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                          {copy.currentLevel}: {currentLevelLabel(enrollment, locale)}
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${enrollment.progress.percent}%` }} />
                        </div>
                        <div className="mt-2 text-sm text-slate-700">
                          {enrollment.progress.completedSessions}/{enrollment.progress.totalSessions} · {enrollment.progress.percent}%
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                      {copy.noEnrollments}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedEnrollment ? selectedEnrollment.customer.name || selectedEnrollment.customer.email : copy.learner}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {selectedEnrollment ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                          <div className="text-sm text-slate-500">{copy.program}</div>
                          <div className="mt-2 font-semibold text-slate-950">{selectedEnrollment.program.title}</div>
                          <div className="mt-2 text-sm text-slate-600">
                            {copy.company}: {selectedEnrollment.customer.company || "-"}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {copy.country}: {selectedEnrollment.customer.country || "-"}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                          <div className="text-sm text-slate-500">{copy.progress}</div>
                          <div className="mt-2 font-semibold text-slate-950">{selectedEnrollment.progress.percent}%</div>
                          <div className="mt-3 h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${selectedEnrollment.progress.percent}%` }} />
                          </div>
                          <div className="mt-2 text-sm text-slate-600">
                            {selectedEnrollment.progress.completedSessions}/{selectedEnrollment.progress.totalSessions}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{copy.assignTrainer}</Label>
                          <Select
                            value={enrollmentForm.trainerUserId}
                            onValueChange={(trainerUserId) => setEnrollmentForm((current) => ({ ...current, trainerUserId }))}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">{copy.unassigned}</SelectItem>
                              {(data?.trainers || []).map((trainer) => (
                                <SelectItem key={trainer.user.id} value={trainer.user.id}>
                                  {trainer.profile.displayName || trainer.user.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{copy.enrollmentStatus}</Label>
                          <Select
                            value={enrollmentForm.status}
                            onValueChange={(status) =>
                              setEnrollmentForm((current) => ({ ...current, status: status as TrainingEnrollmentStatus }))
                            }
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">{getStatusLabel("pending", locale)}</SelectItem>
                              <SelectItem value="active">{getStatusLabel("active", locale)}</SelectItem>
                              <SelectItem value="completed">{getStatusLabel("completed", locale)}</SelectItem>
                              <SelectItem value="paused">{getStatusLabel("paused", locale)}</SelectItem>
                              <SelectItem value="cancelled">{getStatusLabel("cancelled", locale)}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{copy.notes}</Label>
                        <Textarea
                          rows={3}
                          value={enrollmentForm.notes}
                          onChange={(event) => setEnrollmentForm((current) => ({ ...current, notes: event.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{copy.internalNotes}</Label>
                        <Textarea
                          rows={3}
                          value={enrollmentForm.internalNotes}
                          onChange={(event) =>
                            setEnrollmentForm((current) => ({ ...current, internalNotes: event.target.value }))
                          }
                        />
                      </div>

                      <Button type="button" onClick={handleSaveEnrollment} disabled={savingEnrollment}>
                        {savingEnrollment ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {copy.save}
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">{copy.noEnrollments}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{copy.sessionRoadmap}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedEnrollment ? (
                    groupedSessions.map((group) => (
                      <div key={group.levelKey}>
                        <div className="text-xs font-black uppercase tracking-[0.24em] text-primary/70">{group.label}</div>
                        <div className="mt-3 space-y-3">
                          {group.sessions.map((session) => (
                            <button
                              key={session.id}
                              type="button"
                              onClick={() => setSelectedSessionCode(session.sessionCode)}
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                selectedSessionCode === session.sessionCode
                                  ? "border-primary bg-primary/5"
                                  : "border-slate-200 bg-white hover:border-primary/25"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-slate-950">
                                    {session.sessionCode} · {session.template?.topic || session.sessionCode}
                                  </div>
                                  <div className="mt-1 text-sm text-slate-600">
                                    {session.template?.durationLabel || "-"}
                                  </div>
                                </div>
                                <Badge className={`rounded-full ${getStatusBadgeClass(session.status)}`}>
                                  {getStatusLabel(session.status, locale)}
                                </Badge>
                              </div>
                              <div className="mt-3 text-sm text-slate-600">
                                {copy.lastConfirmed}: {formatDate(session.confirmedAt, locale)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">{copy.noEnrollments}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{copy.sessionReview}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {selectedSession ? (
                    <>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <div className="font-semibold text-slate-950">
                          {selectedSession.sessionCode} · {selectedSession.template?.topic || selectedSession.sessionCode}
                        </div>
                        <div className="mt-2 text-sm text-slate-600">{selectedSession.template?.competency || "-"}</div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{copy.sessionStatus}</Label>
                          <Select
                            value={sessionForm.status}
                            onValueChange={(status) =>
                              setSessionForm((current) => ({ ...current, status: status as TrainingSessionProgressStatus }))
                            }
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">{getStatusLabel("pending", locale)}</SelectItem>
                              <SelectItem value="completed">{getStatusLabel("completed", locale)}</SelectItem>
                              <SelectItem value="repeat_required">{getStatusLabel("repeat_required", locale)}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>{copy.score}</Label>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step="0.1"
                            value={sessionForm.score}
                            onChange={(event) => setSessionForm((current) => ({ ...current, score: event.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{copy.trainerNotes}</Label>
                        <Textarea
                          rows={4}
                          value={sessionForm.trainerNotes}
                          onChange={(event) =>
                            setSessionForm((current) => ({ ...current, trainerNotes: event.target.value }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{copy.traineeNotes}</Label>
                        <Textarea
                          rows={3}
                          value={sessionForm.traineeNotes}
                          onChange={(event) =>
                            setSessionForm((current) => ({ ...current, traineeNotes: event.target.value }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{copy.evidence}</Label>
                        <Textarea
                          rows={3}
                          value={sessionForm.evidence}
                          onChange={(event) =>
                            setSessionForm((current) => ({ ...current, evidence: event.target.value }))
                          }
                        />
                      </div>

                      <Button type="button" onClick={handleSaveSession} disabled={savingSession}>
                        {savingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {copy.save}
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">{copy.noEnrollments}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trainers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{copy.createTrainer}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>{copy.existingUser}</Label>
                <Select
                  value={trainerCreateForm.userId}
                  onValueChange={(userId) => setTrainerCreateForm((current) => ({ ...current, userId }))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={copy.existingUser} />
                  </SelectTrigger>
                  <SelectContent>
                    {promoteTrainerCandidates.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{copy.displayName}</Label>
                <Input
                  value={trainerCreateForm.displayName}
                  onChange={(event) =>
                    setTrainerCreateForm((current) => ({ ...current, displayName: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{copy.titleField}</Label>
                <Input
                  value={trainerCreateForm.title}
                  onChange={(event) => setTrainerCreateForm((current) => ({ ...current, title: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{copy.notes}</Label>
                <Textarea
                  rows={3}
                  value={trainerCreateForm.notes}
                  onChange={(event) => setTrainerCreateForm((current) => ({ ...current, notes: event.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 lg:col-span-2">
                <Switch
                  checked={trainerCreateForm.active}
                  onCheckedChange={(active) => setTrainerCreateForm((current) => ({ ...current, active }))}
                />
                <span className="text-sm text-slate-700">{copy.active}</span>
              </div>
              <div className="lg:col-span-2">
                <Button type="button" onClick={handleCreateTrainer} disabled={creatingTrainer}>
                  {creatingTrainer ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {copy.createTrainer}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>{copy.trainers}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.trainers.length ? (
                    data.trainers.map((trainer) => (
                      <button
                        key={trainer.user.id}
                        type="button"
                        onClick={() => setSelectedTrainerId(trainer.user.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          trainer.user.id === selectedTrainerId
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 bg-white hover:border-primary/25"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-950">{trainer.profile.displayName || trainer.user.email}</div>
                            <div className="mt-1 text-sm text-slate-600">{trainer.user.email}</div>
                          </div>
                          <Badge className={`rounded-full ${trainer.profile.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                            {trainer.profile.active ? copy.activeLabel : copy.inactiveLabel}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                          <span>{copy.assignedEnrollments}: {trainer.stats.assignedEnrollments}</span>
                          <span>{copy.activeTracks}: {trainer.stats.activeEnrollments}</span>
                          <span>{copy.completedTracks}: {trainer.stats.completedEnrollments}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                      {copy.noTrainers}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{selectedTrainer ? selectedTrainer.profile.displayName || selectedTrainer.user.email : copy.trainers}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {selectedTrainer ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <StatCard title={copy.assignedEnrollments} value={selectedTrainer.stats.assignedEnrollments} />
                      <StatCard title={copy.activeTracks} value={selectedTrainer.stats.activeEnrollments} />
                      <StatCard title={copy.completedTracks} value={selectedTrainer.stats.completedEnrollments} />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{copy.displayName}</Label>
                        <Input
                          value={trainerProfileForm.displayName}
                          onChange={(event) =>
                            setTrainerProfileForm((current) => ({ ...current, displayName: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{copy.titleField}</Label>
                        <Input
                          value={trainerProfileForm.title}
                          onChange={(event) =>
                            setTrainerProfileForm((current) => ({ ...current, title: event.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{copy.notes}</Label>
                      <Textarea
                        rows={4}
                        value={trainerProfileForm.notes}
                        onChange={(event) => setTrainerProfileForm((current) => ({ ...current, notes: event.target.value }))}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={trainerProfileForm.active}
                        onCheckedChange={(active) => setTrainerProfileForm((current) => ({ ...current, active }))}
                      />
                      <span className="text-sm text-slate-700">{copy.active}</span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button type="button" onClick={handleSaveTrainer} disabled={savingTrainer}>
                        {savingTrainer ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        {copy.save}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleRemoveTrainerRole} disabled={removingTrainerRole}>
                        {removingTrainerRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <UsersRound className="h-4 w-4" />}
                        {copy.removeRole}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-500">{copy.noTrainers}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs">
          <TrainingPricingManager locale={locale} />
        </TabsContent>

        <TabsContent value="rubric">
          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle>{copy.rubric}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.blueprint.rubric.map((item) => (
                  <div key={item.criterion} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div className="font-semibold text-slate-950">{item.criterion}</div>
                    <div className="mt-2 text-sm text-slate-600">{item.measurement}</div>
                    <div className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                      {item.points}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{copy.sessionRoadmap}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.blueprint.levels.map((level) => (
                  <div key={level.key} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-950">{getLevelLabel(level.key, locale)}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {level.sessions} sessions · {level.labs} labs · {level.hours}h
                        </div>
                      </div>
                      <Badge className="rounded-full bg-slate-100 text-slate-700">{level.order}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
