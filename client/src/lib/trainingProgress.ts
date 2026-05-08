import type { AuthUser } from "@/lib/auth";
import type { CatalogTrainingProgramRecord } from "@/lib/catalog";
import type {
  TrainingBlueprintCriterion,
  TrainingBlueprintLevel,
  TrainingBlueprintLevelKey,
  TrainingBlueprintSession,
} from "@shared/trainingBlueprint";

export type TrainingEnrollmentStatus = "pending" | "active" | "completed" | "paused" | "cancelled";
export type TrainingSessionProgressStatus = "pending" | "completed" | "repeat_required";

export type TrainingProgramSummary = {
  id: string | null;
  key: string;
  title: string;
  badge: string;
  hours: string | null;
  duration: string | null;
};

export type TrainingBlueprintSummary = {
  key: string;
  title: string;
  totalHours: number;
  totalSessions: number;
  passThreshold: number;
  levels: TrainingBlueprintLevel[];
  rubric: TrainingBlueprintCriterion[];
};

export type TrainingEnrollmentLevelSummary = {
  key: Exclude<TrainingBlueprintLevelKey, "final">;
  label: string;
  hours: number;
  totalSessions: number;
  completedSessions: number;
  repeatRequiredSessions: number;
  percent: number;
};

export type TrainingEnrollmentSessionView = {
  id: string;
  sessionCode: string;
  levelKey: TrainingBlueprintLevelKey;
  order: number;
  status: TrainingSessionProgressStatus;
  score: number | null;
  passed: boolean | null;
  trainerNotes: string | null;
  traineeNotes: string | null;
  evidence: string | null;
  confirmedByUserId: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template: TrainingBlueprintSession | null;
};

export type TrainingEnrollmentView = {
  id: string;
  userId: string;
  userEmail: string;
  customerName: string | null;
  company: string | null;
  country: string | null;
  countryCode: string | null;
  curriculumKey: string;
  programKey: string;
  programId: string | null;
  source: "payment" | "admin";
  paymentIntentId: string | null;
  purchaseAmount: number | null;
  currency: string | null;
  trainerUserId: string | null;
  trainerAssignedAt: string | null;
  trainerAssignedByUserId: string | null;
  status: TrainingEnrollmentStatus;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  progress: {
    totalSessions: number;
    completedSessions: number;
    repeatRequiredSessions: number;
    percent: number;
    nextSessionCode: string | null;
    nextSessionTopic: string | null;
    finalValidationCompleted: boolean;
  };
  levels: TrainingEnrollmentLevelSummary[];
  program: TrainingProgramSummary;
  trainer: {
    userId: string;
    email: string;
    displayName: string;
    title: string | null;
    active: boolean;
  } | null;
  customer: {
    userId: string;
    email: string;
    name: string | null;
    company: string | null;
    country: string | null;
    countryCode: string | null;
  };
  sessions: TrainingEnrollmentSessionView[];
};

export type TrainerProfile = {
  userId: string;
  email: string;
  displayName: string | null;
  title: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerTrainingResponse = {
  blueprint: TrainingBlueprintSummary;
  enrollments: TrainingEnrollmentView[];
};

export type TrainerDashboardResponse = {
  user: AuthUser;
  profile: TrainerProfile;
  enrollments: TrainingEnrollmentView[];
  stats: {
    activeEnrollments: number;
    completedEnrollments: number;
    pendingReviewSessions: number;
  };
};

export type AdminTrainingCandidateUser = {
  id: string;
  email: string;
  role: "customer" | "designer" | "trainer" | "admin";
  emailVerifiedAt: string | null;
};

export type AdminTrainerSummary = {
  user: AdminTrainingCandidateUser;
  profile: TrainerProfile;
  stats: {
    assignedEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
  };
};

export type AdminTrainingResponse = {
  blueprint: TrainingBlueprintSummary;
  programs: CatalogTrainingProgramRecord[];
  trainers: AdminTrainerSummary[];
  candidateUsers: AdminTrainingCandidateUser[];
  enrollments: TrainingEnrollmentView[];
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || "Training request failed.");
  }
  return data;
}

function localeParams(locale: "en" | "fr" | "ar") {
  return new URLSearchParams({ locale }).toString();
}

export function getCustomerTrainingProgress(locale: "en" | "fr" | "ar") {
  return request<CustomerTrainingResponse>(`/api/customer/training?${localeParams(locale)}`, { method: "GET" });
}

export function getTrainerDashboard(locale: "en" | "fr" | "ar") {
  return request<TrainerDashboardResponse>(`/api/trainer/dashboard?${localeParams(locale)}`, { method: "GET" });
}

export function updateTrainerTrainingSession(
  enrollmentId: string,
  sessionCode: string,
  payload: {
    locale: "en" | "fr" | "ar";
    status: TrainingSessionProgressStatus;
    score?: number | null;
    trainerNotes?: string | null;
    traineeNotes?: string | null;
    evidence?: string | null;
  }
) {
  return request<{ ok: true; enrollment: TrainingEnrollmentView }>(
    `/api/trainer/enrollments/${encodeURIComponent(enrollmentId)}/sessions/${encodeURIComponent(sessionCode)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function getAdminTraining(locale: "en" | "fr" | "ar") {
  return request<AdminTrainingResponse>(`/api/admin/training?${localeParams(locale)}`, { method: "GET" });
}

export function createAdminTrainer(payload: {
  userId: string;
  displayName?: string;
  title?: string;
  notes?: string;
  active?: boolean;
}) {
  return request<{ ok: true; user: AdminTrainingCandidateUser; profile: TrainerProfile }>("/api/admin/trainers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminTrainer(
  userId: string,
  payload: {
    displayName?: string;
    title?: string;
    notes?: string;
    active?: boolean;
  }
) {
  return request<{ ok: true; profile: TrainerProfile }>(`/api/admin/trainers/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createAdminTrainingEnrollment(payload: {
  locale: "en" | "fr" | "ar";
  userId: string;
  programKey: string;
  trainerUserId?: string | null;
  status?: TrainingEnrollmentStatus;
  notes?: string | null;
  internalNotes?: string | null;
}) {
  return request<{ ok: true; enrollment: TrainingEnrollmentView }>("/api/admin/training/enrollments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminTrainingEnrollment(
  enrollmentId: string,
  payload: {
    locale: "en" | "fr" | "ar";
    trainerUserId?: string | null;
    status?: TrainingEnrollmentStatus;
    notes?: string | null;
    internalNotes?: string | null;
  }
) {
  return request<{ ok: true; enrollment: TrainingEnrollmentView }>(
    `/api/admin/training/enrollments/${encodeURIComponent(enrollmentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function updateAdminTrainingSession(
  enrollmentId: string,
  sessionCode: string,
  payload: {
    locale: "en" | "fr" | "ar";
    status: TrainingSessionProgressStatus;
    score?: number | null;
    trainerNotes?: string | null;
    traineeNotes?: string | null;
    evidence?: string | null;
  }
) {
  return request<{ ok: true; enrollment: TrainingEnrollmentView }>(
    `/api/admin/training/enrollments/${encodeURIComponent(enrollmentId)}/sessions/${encodeURIComponent(sessionCode)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}
