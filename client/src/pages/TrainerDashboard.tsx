import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, GraduationCap, Loader2, LogOut, Mail, UserRound } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import {
  getTrainerDashboard,
  updateTrainerTrainingSession,
  type TrainerDashboardResponse,
  type TrainingEnrollmentSessionView,
  type TrainingEnrollmentView,
  type TrainingSessionProgressStatus,
} from "@/lib/trainingProgress";
import { TRAINING_BLUEPRINT } from "@shared/trainingBlueprint";

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: TrainingSessionProgressStatus | TrainingEnrollmentView["status"], locale: string) {
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

function getStatusBadgeClass(status: TrainingSessionProgressStatus | TrainingEnrollmentView["status"]) {
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "repeat_required" || status === "cancelled") return "bg-rose-100 text-rose-700";
  if (status === "active") return "bg-blue-100 text-blue-700";
  if (status === "paused") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function resolveCurrentLevelLabel(enrollment: TrainingEnrollmentView, locale: string) {
  const firstIncompleteLevel = enrollment.levels.find((level) => level.completedSessions < level.totalSessions);
  if (firstIncompleteLevel) {
    return getLevelLabel(firstIncompleteLevel.key, locale);
  }
  if (enrollment.progress.finalValidationCompleted) {
    return locale === "ar" ? "مكتمل بالكامل" : locale === "fr" ? "Parcours termine" : "Program completed";
  }
  return getLevelLabel("final", locale);
}

function buildInitialSessionForm(session: TrainingEnrollmentSessionView | null) {
  return {
    status: session?.status || "pending",
    score: session?.score === null || typeof session?.score === "undefined" ? "" : String(session.score),
    trainerNotes: session?.trainerNotes || "",
    traineeNotes: session?.traineeNotes || "",
    evidence: session?.evidence || "",
  };
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <GlassCard className="card-static rounded-[28px] p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
    </GlassCard>
  );
}

export default function TrainerDashboard() {
  const { locale } = useI18n();
  const { user, role, loading, logout } = useAuth();
  const [data, setData] = useState<TrainerDashboardResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>("");
  const [selectedSessionCode, setSelectedSessionCode] = useState<string>("");
  const [savingSession, setSavingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState(buildInitialSessionForm(null));

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "لوحة المدرب",
        subtitle: "تابع تقدم كل عميل، أكد الجلسات التي مرت، وسجل الملاحظات والنتائج من نفس اللوحة.",
        signInRequired: "يجب تسجيل الدخول بحساب مدرب.",
        accessDenied: "هذه المنطقة مخصصة لحسابات المدربين فقط.",
        login: "تسجيل الدخول",
        signOut: "تسجيل الخروج",
        assignedLearners: "المتدربون المسندون",
        activeEnrollments: "المسارات النشطة",
        completedEnrollments: "المسارات المكتملة",
        pendingReviews: "جلسات تحتاج متابعة",
        noEnrollments: "لا توجد مسارات تدريب مسندة حاليا.",
        learner: "المتدرب",
        company: "الشركة",
        country: "الدولة",
        program: "البرنامج",
        trainerTitle: "المدرب",
        currentLevel: "المستوى الحالي",
        nextSession: "الجلسة التالية",
        sessionRoadmap: "خريطة الجلسات",
        sessionReview: "تأكيد الجلسة",
        sessionStatus: "حالة الجلسة",
        score: "النقطة /10",
        trainerNotes: "ملاحظات المدرب",
        traineeNotes: "ملاحظات المتدرب",
        evidence: "الدليل أو المخرج",
        saveSession: "حفظ التأكيد",
        lastConfirmed: "آخر تأكيد",
        rubric: "سلم التقييم",
        passThreshold: "حد النجاح",
        overview: "نظرة عامة",
        timeline: "التسلسل",
        sessionTopic: "الموضوع",
        sessionCompetency: "الهدف",
      };
    }
    if (locale === "fr") {
      return {
        title: "Espace formateur",
        subtitle: "Suivez chaque client, confirmez les sessions terminees, et consignez les notes et les scores depuis un seul poste.",
        signInRequired: "Connexion requise avec un compte formateur.",
        accessDenied: "Cette zone est reservee aux comptes formateurs.",
        login: "Connexion",
        signOut: "Se deconnecter",
        assignedLearners: "Apprenants assignes",
        activeEnrollments: "Parcours actifs",
        completedEnrollments: "Parcours termines",
        pendingReviews: "Sessions a revoir",
        noEnrollments: "Aucun parcours assigne pour le moment.",
        learner: "Apprenant",
        company: "Societe",
        country: "Pays",
        program: "Programme",
        trainerTitle: "Formateur",
        currentLevel: "Niveau actuel",
        nextSession: "Prochaine session",
        sessionRoadmap: "Plan des sessions",
        sessionReview: "Validation de session",
        sessionStatus: "Statut de session",
        score: "Score /10",
        trainerNotes: "Notes du formateur",
        traineeNotes: "Notes du stagiaire",
        evidence: "Preuve / livrable",
        saveSession: "Enregistrer la validation",
        lastConfirmed: "Derniere validation",
        rubric: "Grille d'evaluation",
        passThreshold: "Seuil de validation",
        overview: "Vue d'ensemble",
        timeline: "Sequencement",
        sessionTopic: "Sujet",
        sessionCompetency: "Competence",
      };
    }
    return {
      title: "Trainer dashboard",
      subtitle: "Track every learner, confirm completed sessions, and capture notes and scores from one operational workspace.",
      signInRequired: "Sign in with a trainer account.",
      accessDenied: "This area is reserved for trainer accounts.",
      login: "Login",
      signOut: "Sign out",
      assignedLearners: "Assigned learners",
      activeEnrollments: "Active tracks",
      completedEnrollments: "Completed tracks",
      pendingReviews: "Sessions needing review",
      noEnrollments: "No training enrollments assigned yet.",
      learner: "Learner",
      company: "Company",
      country: "Country",
      program: "Program",
      trainerTitle: "Trainer",
      currentLevel: "Current level",
      nextSession: "Next session",
      sessionRoadmap: "Session roadmap",
      sessionReview: "Session confirmation",
      sessionStatus: "Session status",
      score: "Score /10",
      trainerNotes: "Trainer notes",
      traineeNotes: "Trainee notes",
      evidence: "Evidence / output",
      saveSession: "Save confirmation",
      lastConfirmed: "Last confirmed",
      rubric: "Evaluation rubric",
      passThreshold: "Pass threshold",
      overview: "Overview",
      timeline: "Timeline",
      sessionTopic: "Topic",
      sessionCompetency: "Competency",
    };
  }, [locale]);

  useEffect(() => {
    if (loading) return;
    if (!user || role !== "trainer") {
      setBusy(false);
      return;
    }

    setBusy(true);
    getTrainerDashboard(locale)
      .then((response) => {
        setData(response);
        setSelectedEnrollmentId((current) =>
          current && response.enrollments.some((enrollment) => enrollment.id === current)
            ? current
            : response.enrollments[0]?.id || ""
        );
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setBusy(false));
  }, [loading, locale, role, user]);

  const selectedEnrollment = useMemo(
    () => data?.enrollments.find((enrollment) => enrollment.id === selectedEnrollmentId) || null,
    [data?.enrollments, selectedEnrollmentId]
  );

  useEffect(() => {
    if (!selectedEnrollment) {
      setSelectedSessionCode("");
      setSessionForm(buildInitialSessionForm(null));
      return;
    }

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
    setSessionForm(buildInitialSessionForm(selectedSession));
  }, [selectedSession]);

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

  async function handleSaveSession() {
    if (!selectedEnrollment || !selectedSession) return;

    try {
      setSavingSession(true);
      const response = await updateTrainerTrainingSession(selectedEnrollment.id, selectedSession.sessionCode, {
        locale,
        status: sessionForm.status,
        score: sessionForm.score === "" ? null : Number(sessionForm.score),
        trainerNotes: sessionForm.trainerNotes || null,
        traineeNotes: sessionForm.traineeNotes || null,
        evidence: sessionForm.evidence || null,
      });

      setData((current) =>
        current
          ? {
              ...current,
              enrollments: current.enrollments.map((enrollment) =>
                enrollment.id === response.enrollment.id ? response.enrollment : enrollment
              ),
              stats: {
                activeEnrollments: current.enrollments
                  .map((enrollment) => (enrollment.id === response.enrollment.id ? response.enrollment : enrollment))
                  .filter((enrollment) => enrollment.status === "active").length,
                completedEnrollments: current.enrollments
                  .map((enrollment) => (enrollment.id === response.enrollment.id ? response.enrollment : enrollment))
                  .filter((enrollment) => enrollment.status === "completed").length,
                pendingReviewSessions: current.enrollments
                  .map((enrollment) => (enrollment.id === response.enrollment.id ? response.enrollment : enrollment))
                  .reduce(
                    (total, enrollment) =>
                      total + enrollment.sessions.filter((session) => session.status !== "completed").length,
                    0
                  ),
              },
            }
          : current
      );
      toast.success(locale === "ar" ? "تم حفظ الجلسة." : locale === "fr" ? "Session enregistree." : "Session saved.");
    } catch (error: any) {
      toast.error(error?.message || "Session update failed.");
    } finally {
      setSavingSession(false);
    }
  }

  if (loading || busy) {
    return (
      <div className="site-page min-h-screen bg-transparent px-4 py-24">
        <div className="mx-auto max-w-5xl text-center text-slate-600">Loading trainer workspace...</div>
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

  if (role !== "trainer") {
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
      <Header />
      <main className="pb-20 pt-32">
        <section className="container">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[30px] border border-white/35 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.28em] text-primary/70">{copy.trainerTitle}</div>
                  <h1 className="mt-2 text-4xl font-bold text-slate-950">{copy.title}</h1>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{copy.subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="rounded-full px-4 py-1.5 text-sm">
                    {data?.profile.displayName || data?.user.email}
                  </Badge>
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

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <MetricCard label={copy.assignedLearners} value={data?.enrollments.length || 0} />
                <MetricCard label={copy.activeEnrollments} value={data?.stats.activeEnrollments || 0} />
                <MetricCard label={copy.completedEnrollments} value={data?.stats.completedEnrollments || 0} />
                <MetricCard label={copy.pendingReviews} value={data?.stats.pendingReviewSessions || 0} />
              </div>

              <Tabs defaultValue="overview" className="mt-10 space-y-6">
                <TabsList className="h-auto rounded-full p-1">
                  <TabsTrigger value="overview" className="rounded-full px-5 py-2">
                    {copy.overview}
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="rounded-full px-5 py-2">
                    {copy.timeline}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <GlassCard className="card-static rounded-[32px] p-6">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold text-slate-950">{copy.assignedLearners}</h2>
                      </div>
                      <div className="mt-5 space-y-4">
                        {data?.enrollments.length ? (
                          data.enrollments.map((enrollment) => (
                            <button
                              key={enrollment.id}
                              type="button"
                              onClick={() => setSelectedEnrollmentId(enrollment.id)}
                              className={`w-full rounded-[24px] border p-5 text-left transition ${
                                enrollment.id === selectedEnrollmentId
                                  ? "border-primary bg-primary/8 shadow-[0_18px_40px_rgba(37,64,143,0.12)]"
                                  : "border-slate-200 bg-white/70 hover:border-primary/30 hover:bg-primary/5"
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
                              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                                <span>{copy.currentLevel}: {resolveCurrentLevelLabel(enrollment, locale)}</span>
                                <span>{copy.company}: {enrollment.customer.company || "-"}</span>
                              </div>
                              <div className="mt-4 h-2 rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full bg-primary transition-all"
                                  style={{ width: `${enrollment.progress.percent}%` }}
                                />
                              </div>
                              <div className="mt-2 text-sm font-medium text-slate-700">
                                {enrollment.progress.completedSessions}/{enrollment.progress.totalSessions} · {enrollment.progress.percent}%
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                            {copy.noEnrollments}
                          </div>
                        )}
                      </div>
                    </GlassCard>

                    <GlassCard className="card-static rounded-[32px] p-6">
                      {selectedEnrollment ? (
                        <>
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h2 className="text-2xl font-bold text-slate-950">
                                {selectedEnrollment.customer.name || selectedEnrollment.customer.email}
                              </h2>
                              <p className="mt-2 text-sm text-slate-600">{selectedEnrollment.program.title}</p>
                            </div>
                            <Badge className={`rounded-full ${getStatusBadgeClass(selectedEnrollment.status)}`}>
                              {getStatusLabel(selectedEnrollment.status, locale)}
                            </Badge>
                          </div>

                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <UserRound className="h-4 w-4 text-primary" />
                                {copy.learner}
                              </div>
                              <div className="mt-3 font-semibold text-slate-950">
                                {selectedEnrollment.customer.name || selectedEnrollment.customer.email}
                              </div>
                              <div className="mt-2 space-y-1 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-primary" />
                                  {selectedEnrollment.customer.email}
                                </div>
                                <div>{copy.company}: {selectedEnrollment.customer.company || "-"}</div>
                                <div>{copy.country}: {selectedEnrollment.customer.country || "-"}</div>
                              </div>
                            </div>
                            <div className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
                              <div className="text-sm text-slate-500">{copy.nextSession}</div>
                              <div className="mt-3 font-semibold text-slate-950">
                                {selectedEnrollment.progress.nextSessionCode || "-"}
                              </div>
                              <div className="mt-2 text-sm text-slate-600">
                                {selectedEnrollment.progress.nextSessionTopic || "-"}
                              </div>
                              <div className="mt-4 text-sm text-slate-600">
                                {copy.currentLevel}: {resolveCurrentLevelLabel(selectedEnrollment, locale)}
                              </div>
                              <div className="mt-4 h-2 rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full bg-primary transition-all"
                                  style={{ width: `${selectedEnrollment.progress.percent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 grid gap-3 md:grid-cols-3">
                            {selectedEnrollment.levels.map((level) => (
                              <div key={level.key} className="rounded-[22px] border border-slate-200 bg-white/70 p-4">
                                <div className="text-sm font-semibold text-slate-900">{getLevelLabel(level.key, locale)}</div>
                                <div className="mt-2 text-sm text-slate-600">
                                  {level.completedSessions}/{level.totalSessions} · {level.percent}%
                                </div>
                                <div className="mt-3 h-2 rounded-full bg-slate-100">
                                  <div className="h-2 rounded-full bg-primary" style={{ width: `${level.percent}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                          {copy.noEnrollments}
                        </div>
                      )}
                    </GlassCard>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-6">
                  {selectedEnrollment ? (
                    <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
                      <GlassCard className="card-static rounded-[32px] p-6">
                        <div className="flex items-center gap-3">
                          <ClipboardList className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-bold text-slate-950">{copy.sessionRoadmap}</h2>
                        </div>
                        <div className="mt-5 space-y-5">
                          {groupedSessions.map((group) => (
                            <div key={group.levelKey}>
                              <div className="text-sm font-black uppercase tracking-[0.2em] text-primary/70">
                                {group.label}
                              </div>
                              <div className="mt-3 space-y-3">
                                {group.sessions.map((session) => (
                                  <button
                                    key={session.id}
                                    type="button"
                                    onClick={() => setSelectedSessionCode(session.sessionCode)}
                                    className={`w-full rounded-[22px] border p-4 text-left transition ${
                                      session.sessionCode === selectedSessionCode
                                        ? "border-primary bg-primary/8"
                                        : "border-slate-200 bg-white/70 hover:border-primary/30 hover:bg-primary/5"
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div>
                                        <div className="font-semibold text-slate-950">
                                          {session.sessionCode} · {session.template?.topic || session.sessionCode}
                                        </div>
                                        <div className="mt-1 text-sm text-slate-600">
                                          {session.template?.durationLabel || "-"} · {session.template?.competency || "-"}
                                        </div>
                                      </div>
                                      <Badge className={`rounded-full ${getStatusBadgeClass(session.status)}`}>
                                        {getStatusLabel(session.status, locale)}
                                      </Badge>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                                      <span>{copy.score}: {session.score ?? "-"}</span>
                                      <span>{copy.lastConfirmed}: {formatDate(session.confirmedAt, locale)}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      <div className="space-y-6">
                        <GlassCard className="card-static rounded-[32px] p-6">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-bold text-slate-950">{copy.sessionReview}</h2>
                          </div>

                          {selectedSession ? (
                            <div className="mt-5 space-y-5">
                              <div className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
                                <div className="font-semibold text-slate-950">
                                  {selectedSession.sessionCode} · {selectedSession.template?.topic || selectedSession.sessionCode}
                                </div>
                                <div className="mt-2 text-sm leading-6 text-slate-600">
                                  <span className="font-medium text-slate-800">{copy.sessionCompetency}:</span>{" "}
                                  {selectedSession.template?.competency || "-"}
                                </div>
                              </div>

                              <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>{copy.sessionStatus}</Label>
                                  <Select
                                    value={sessionForm.status}
                                    onValueChange={(value) =>
                                      setSessionForm((current) => ({
                                        ...current,
                                        status: value as TrainingSessionProgressStatus,
                                      }))
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
                                    onChange={(event) =>
                                      setSessionForm((current) => ({
                                        ...current,
                                        score: event.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>{copy.trainerNotes}</Label>
                                <Textarea
                                  value={sessionForm.trainerNotes}
                                  onChange={(event) =>
                                    setSessionForm((current) => ({
                                      ...current,
                                      trainerNotes: event.target.value,
                                    }))
                                  }
                                  rows={4}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>{copy.traineeNotes}</Label>
                                <Textarea
                                  value={sessionForm.traineeNotes}
                                  onChange={(event) =>
                                    setSessionForm((current) => ({
                                      ...current,
                                      traineeNotes: event.target.value,
                                    }))
                                  }
                                  rows={3}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>{copy.evidence}</Label>
                                <Textarea
                                  value={sessionForm.evidence}
                                  onChange={(event) =>
                                    setSessionForm((current) => ({
                                      ...current,
                                      evidence: event.target.value,
                                    }))
                                  }
                                  rows={3}
                                />
                              </div>

                              <Button type="button" className="rounded-full" disabled={savingSession} onClick={handleSaveSession}>
                                {savingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {copy.saveSession}
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                              {copy.noEnrollments}
                            </div>
                          )}
                        </GlassCard>

                        <GlassCard className="card-static rounded-[32px] p-6">
                          <h2 className="text-2xl font-bold text-slate-950">{copy.rubric}</h2>
                          <div className="mt-5 space-y-3">
                            <ScrollArea className="max-h-[320px]">
                              <div className="space-y-3 pr-3">
                                {TRAINING_BLUEPRINT.rubric.map((item) => (
                                  <div key={item.criterion} className="rounded-[22px] border border-slate-200 bg-white/70 px-4 py-4">
                                    <div className="font-semibold text-slate-950">{item.criterion}</div>
                                    <div className="mt-2 text-sm text-slate-600">{item.measurement}</div>
                                    <div className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                                      {item.points}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                              {copy.passThreshold}: {TRAINING_BLUEPRINT.passThreshold}/10
                            </div>
                          </div>
                        </GlassCard>
                      </div>
                    </div>
                  ) : (
                    <GlassCard className="card-static rounded-[32px] p-6 text-sm text-slate-500">{copy.noEnrollments}</GlassCard>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
