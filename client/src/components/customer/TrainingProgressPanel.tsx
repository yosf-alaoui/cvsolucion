import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, GraduationCap, LayoutList, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCustomerTrainingProgress, type CustomerTrainingResponse, type TrainingEnrollmentView } from "@/lib/trainingProgress";

function getStatusLabel(status: TrainingEnrollmentView["status"] | TrainingEnrollmentView["sessions"][number]["status"], locale: string) {
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

function getStatusBadgeClass(status: TrainingEnrollmentView["status"] | TrainingEnrollmentView["sessions"][number]["status"]) {
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

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function resolveCurrentLevelLabel(enrollment: TrainingEnrollmentView, locale: string) {
  const level = enrollment.levels.find((item) => item.completedSessions < item.totalSessions);
  if (level) return getLevelLabel(level.key, locale);
  if (enrollment.progress.finalValidationCompleted) {
    return locale === "ar" ? "المسار مكتمل" : locale === "fr" ? "Parcours termine" : "Program completed";
  }
  return getLevelLabel("final", locale);
}

export default function TrainingProgressPanel({ locale }: { locale: "en" | "fr" | "ar" }) {
  const [data, setData] = useState<CustomerTrainingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "التدريب",
        subtitle: "تابع أين وصلت في البرنامج، من هي الجلسة التالية، وما الذي تم تأكيده من طرف المدرب.",
        noEnrollments: "لا توجد مسارات تدريب مفعلة على هذا الحساب.",
        activeTracks: "المسارات النشطة",
        completedTracks: "المسارات المكتملة",
        completedSessions: "الجلسات المؤكدة",
        currentLevel: "المستوى الحالي",
        trainer: "المدرب",
        nextSession: "الجلسة التالية",
        sessionRoadmap: "خريطة الجلسات",
        rubric: "سلم التقييم",
        lastConfirmed: "آخر تأكيد",
        evidence: "الدليل",
      };
    }
    if (locale === "fr") {
      return {
        title: "Formation",
        subtitle: "Suivez votre progression, la prochaine session, et ce que le formateur a deja valide.",
        noEnrollments: "Aucun parcours de formation actif sur ce compte.",
        activeTracks: "Parcours actifs",
        completedTracks: "Parcours termines",
        completedSessions: "Sessions validees",
        currentLevel: "Niveau actuel",
        trainer: "Formateur",
        nextSession: "Prochaine session",
        sessionRoadmap: "Plan des sessions",
        rubric: "Grille d'evaluation",
        lastConfirmed: "Derniere validation",
        evidence: "Preuve",
      };
    }
    return {
      title: "Training",
      subtitle: "Track how far you have progressed, what comes next, and what your trainer has already confirmed.",
      noEnrollments: "No active training enrollments on this account.",
      activeTracks: "Active tracks",
      completedTracks: "Completed tracks",
      completedSessions: "Confirmed sessions",
      currentLevel: "Current level",
      trainer: "Trainer",
      nextSession: "Next session",
      sessionRoadmap: "Session roadmap",
      rubric: "Evaluation rubric",
      lastConfirmed: "Last confirmed",
      evidence: "Evidence",
    };
  }, [locale]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCustomerTrainingProgress(locale)
      .then((response) => {
        if (!active) return;
        setData(response);
        setSelectedEnrollmentId((current) =>
          current && response.enrollments.some((enrollment) => enrollment.id === current)
            ? current
            : response.enrollments[0]?.id || ""
        );
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [locale]);

  const selectedEnrollment = useMemo(
    () => data?.enrollments.find((enrollment) => enrollment.id === selectedEnrollmentId) || null,
    [data?.enrollments, selectedEnrollmentId]
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
      activeTracks: enrollments.filter((enrollment) => enrollment.status === "active").length,
      completedTracks: enrollments.filter((enrollment) => enrollment.status === "completed").length,
      completedSessions: enrollments.reduce((total, enrollment) => total + enrollment.progress.completedSessions, 0),
    };
  }, [data?.enrollments]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading training progress...</div>;
  }

  if (!data?.enrollments.length) {
    return (
      <GlassCard className="card-static rounded-[32px] p-7">
        <h2 className="text-2xl font-bold text-slate-950">{copy.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{copy.noEnrollments}</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <GlassCard className="card-static rounded-[28px] p-5">
          <div className="text-sm text-slate-500">{copy.title}</div>
          <div className="mt-2 text-3xl font-bold text-slate-950">{data.enrollments.length}</div>
        </GlassCard>
        <GlassCard className="card-static rounded-[28px] p-5">
          <div className="text-sm text-slate-500">{copy.activeTracks}</div>
          <div className="mt-2 text-3xl font-bold text-slate-950">{metrics.activeTracks}</div>
        </GlassCard>
        <GlassCard className="card-static rounded-[28px] p-5">
          <div className="text-sm text-slate-500">{copy.completedTracks}</div>
          <div className="mt-2 text-3xl font-bold text-slate-950">{metrics.completedTracks}</div>
        </GlassCard>
        <GlassCard className="card-static rounded-[28px] p-5">
          <div className="text-sm text-slate-500">{copy.completedSessions}</div>
          <div className="mt-2 text-3xl font-bold text-slate-950">{metrics.completedSessions}</div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <GlassCard className="card-static rounded-[32px] p-7">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-slate-950">{copy.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{copy.subtitle}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {data.enrollments.map((enrollment) => (
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
                    <div className="font-semibold text-slate-950">{enrollment.program.title}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {copy.currentLevel}: {resolveCurrentLevelLabel(enrollment, locale)}
                    </div>
                  </div>
                  <Badge className={`rounded-full ${getStatusBadgeClass(enrollment.status)}`}>
                    {getStatusLabel(enrollment.status, locale)}
                  </Badge>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${enrollment.progress.percent}%` }} />
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  {enrollment.progress.completedSessions}/{enrollment.progress.totalSessions} · {enrollment.progress.percent}%
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="card-static rounded-[32px] p-7">
          {selectedEnrollment ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">{selectedEnrollment.program.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{selectedEnrollment.program.badge}</p>
                </div>
                <Badge className={`rounded-full ${getStatusBadgeClass(selectedEnrollment.status)}`}>
                  {getStatusLabel(selectedEnrollment.status, locale)}
                </Badge>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
                  <div className="text-sm text-slate-500">{copy.trainer}</div>
                  <div className="mt-2 font-semibold text-slate-950">
                    {selectedEnrollment.trainer?.displayName || selectedEnrollment.trainer?.email || "-"}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{selectedEnrollment.trainer?.title || "-"}</div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
                  <div className="text-sm text-slate-500">{copy.nextSession}</div>
                  <div className="mt-2 font-semibold text-slate-950">{selectedEnrollment.progress.nextSessionCode || "-"}</div>
                  <div className="mt-2 text-sm text-slate-600">{selectedEnrollment.progress.nextSessionTopic || "-"}</div>
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
          ) : null}
        </GlassCard>
      </div>

      {selectedEnrollment ? (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <GlassCard className="card-static rounded-[32px] p-7">
            <div className="flex items-center gap-3">
              <LayoutList className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-950">{copy.sessionRoadmap}</h2>
            </div>
            <div className="mt-5 space-y-5">
              {groupedSessions.map((group) => (
                <div key={group.levelKey}>
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-primary/70">{group.label}</div>
                  <div className="mt-3 space-y-3">
                    {group.sessions.map((session) => (
                      <div key={session.id} className="rounded-[22px] border border-slate-200 bg-white/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-950">
                              {session.sessionCode} · {session.template?.topic || session.sessionCode}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">{session.template?.competency || "-"}</div>
                          </div>
                          <Badge className={`rounded-full ${getStatusBadgeClass(session.status)}`}>
                            {getStatusLabel(session.status, locale)}
                          </Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                          <span>{copy.lastConfirmed}: {formatDate(session.confirmedAt, locale)}</span>
                          <span>Score: {session.score ?? "-"}</span>
                        </div>
                        {session.trainerNotes ? (
                          <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
                            {session.trainerNotes}
                          </div>
                        ) : null}
                        {session.evidence ? (
                          <div className="mt-3 text-sm text-slate-600">
                            <span className="font-semibold text-slate-900">{copy.evidence}:</span> {session.evidence}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="card-static rounded-[32px] p-7">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-950">{copy.rubric}</h2>
            </div>
            <div className="mt-5 space-y-3">
              <ScrollArea className="max-h-[420px]">
                <div className="space-y-3 pr-3">
                  {data.blueprint.rubric.map((item) => (
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
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
