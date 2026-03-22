import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import {
  deleteAdminUser,
  getAdminDashboard,
  resendAdminVerification,
  revokeAdminSession,
  revokeAdminUserSessions,
  updateAdminUser,
  type AdminDashboardConversation,
  type AdminDashboardEvent,
  type AdminDashboardResponse,
  type AdminDashboardSession,
  type AdminDashboardUser,
  type AdminDashboardVisitor,
} from "@/lib/admin";
import ConversationsPanel from "@/components/admin/ConversationsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(ms: number | null) {
  if (!ms || ms <= 0) return "-";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function exportCsv(filename: string, rows: Array<Record<string, string | number | null>>) {
  if (!rows.length || typeof window === "undefined") return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function localeBadge(locale: string | null) {
  if (locale === "fr") return "FR";
  if (locale === "ar") return "AR";
  return "EN";
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-bold text-slate-900">{value}</CardContent>
    </Card>
  );
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">
          {value} <span className="text-slate-400">({percentage}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { locale } = useI18n();
  const { loading, user, isAdmin } = useAuth();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editVerified, setEditVerified] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [query, setQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "pending">("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const copy = useMemo(() => {
    if (locale === "fr") {
      return {
        title: "Tableau de bord",
        subtitle:
          "Pilotez les inscriptions, la verification email, les sessions actives et les signaux de securite pour votre activite Cabinet Vision.",
        refresh: "Actualiser",
        exportUsers: "Exporter les utilisateurs",
        exportEvents: "Exporter les evenements",
        overview: "Vue generale",
        users: "Utilisateurs",
        visitors: "Visiteurs",
        sessions: "Sessions",
        events: "Activite",
        search: "Rechercher par email",
        email: "Email",
        created: "Creation",
        updated: "Mise a jour",
        verified: "Verification",
        actions: "Actions",
        select: "Ouvrir",
        editor: "Gestion du compte",
        newPassword: "Nouveau mot de passe",
        save: "Enregistrer",
        delete: "Supprimer le compte",
        resendVerification: "Renvoyer la verification",
        revokeUserSessions: "Fermer les sessions",
        deleteConfirm: "Supprimer ce compte definitivement ?",
        revokeConfirm: "Fermer toutes les sessions actives pour cet utilisateur ?",
        yes: "Verifie",
        no: "En attente",
        eventType: "Evenement",
        when: "Date",
        locale: "Langue",
        adminOnly: "Acces reserve a l'administrateur.",
        signInRequired: "Connectez-vous avec un compte administrateur.",
        passwordHint: "Laissez vide pour conserver le mot de passe actuel.",
        totalUsers: "Comptes",
        verifiedUsers: "Emails verifies",
        pendingUsers: "En attente",
        activeSessions: "Sessions actives",
        pendingLinks: "Liens en attente",
        users7d: "Nouveaux comptes 7j",
        logins7d: "Connexions 7j",
        resets30d: "Resets 30j",
        verificationRate: "Taux de verification",
        funnel: "Tunnel d'activation",
        localeDemand: "Demande par langue",
        stalePending: "Comptes non verifies a relancer",
        visitorDetail: "Profil visiteur",
        registeredState: "Inscription",
        registeredYes: "Compte cree",
        registeredNo: "Anonyme",
        deviceType: "Appareil",
        lastPage: "Derniere page",
        landingPage: "Page d'entree",
        browserLanguage: "Langue navigateur",
        timezone: "Fuseau",
        pageHistory: "Historique des pages",
        campaignData: "Acquisition",
        source: "Source",
        medium: "Medium",
        campaign: "Campaign",
        engagement: "Engagement",
        totalSessions: "Sessions totales",
        totalPageViews: "Pages vues",
        avgDuration: "Duree moyenne",
        lastSessionDuration: "Derniere session",
        whatsappClicks: "Clics WhatsApp",
        emailClicks: "Clics email",
        ctaClicks: "Clics CTA",
        interactionHistory: "Historique d'interaction",
        noResults: "Aucun resultat.",
        activeForUser: "Sessions actives utilisateur",
        recentUserEvents: "Derniere activite utilisateur",
        revokeSession: "Fermer",
        sessionExpiry: "Expiration",
        accountHealth: "Etat du compte",
        lastSeen: "Derniere activite",
        signupLocale: "Langue d'inscription",
        pendingTokens: "Liens actifs",
        eventCount: "Evenements",
        userSaved: "Compte mis a jour.",
        userDeleted: "Compte supprime.",
        verificationSent: "Email de verification renvoye.",
        sessionsRevoked: "Sessions fermees.",
        dashboardLoadError: "Impossible de charger le tableau de bord.",
        updateError: "Impossible de mettre a jour le compte.",
        deleteError: "Impossible de supprimer le compte.",
      };
    }

    if (locale === "ar") {
      return {
        title: "لوحة التحكم",
        subtitle:
          "تابع التسجيلات وتأكيد البريد والجلسات النشطة وإشارات الأمان الخاصة بخدمة Cabinet Vision من مكان واحد.",
        refresh: "تحديث",
        exportUsers: "تصدير المستخدمين",
        exportEvents: "تصدير الأحداث",
        overview: "نظرة عامة",
        users: "المستخدمون",
        visitors: "الزوار",
        sessions: "الجلسات",
        events: "النشاط",
        search: "ابحث بالبريد الإلكتروني",
        email: "البريد",
        created: "تاريخ الإنشاء",
        updated: "آخر تحديث",
        verified: "التحقق",
        actions: "الإجراءات",
        select: "فتح",
        editor: "إدارة الحساب",
        newPassword: "كلمة مرور جديدة",
        save: "حفظ",
        delete: "حذف الحساب",
        resendVerification: "إعادة إرسال التحقق",
        revokeUserSessions: "إغلاق الجلسات",
        deleteConfirm: "هل تريد حذف هذا الحساب نهائيًا؟",
        revokeConfirm: "هل تريد إغلاق جميع الجلسات النشطة لهذا المستخدم؟",
        yes: "مؤكد",
        no: "قيد الانتظار",
        eventType: "الحدث",
        when: "التاريخ",
        locale: "اللغة",
        adminOnly: "هذه الصفحة مخصصة للمشرف فقط.",
        signInRequired: "سجّل الدخول بحساب إداري أولًا.",
        passwordHint: "اترك الحقل فارغًا إذا كنت لا تريد تغيير كلمة المرور.",
        totalUsers: "إجمالي الحسابات",
        verifiedUsers: "الحسابات المؤكدة",
        pendingUsers: "حسابات معلقة",
        activeSessions: "الجلسات النشطة",
        pendingLinks: "الروابط المعلقة",
        users7d: "تسجيلات 7 أيام",
        logins7d: "عمليات دخول 7 أيام",
        resets30d: "طلبات استرجاع 30 يومًا",
        verificationRate: "معدل التحقق",
        funnel: "مسار التفعيل",
        localeDemand: "الاهتمام حسب اللغة",
        stalePending: "حسابات قديمة غير مؤكدة",
        visitorDetail: "ملف الزائر",
        registeredState: "حالة التسجيل",
        registeredYes: "لديه حساب",
        registeredNo: "زائر مجهول",
        deviceType: "نوع الجهاز",
        lastPage: "آخر صفحة",
        landingPage: "صفحة الدخول",
        browserLanguage: "لغة المتصفح",
        timezone: "المنطقة الزمنية",
        pageHistory: "سجل الصفحات",
        campaignData: "بيانات الاكتساب",
        source: "المصدر",
        medium: "الوسيط",
        campaign: "الحملة",
        engagement: "التفاعل",
        totalSessions: "إجمالي الجلسات",
        totalPageViews: "إجمالي الصفحات",
        avgDuration: "متوسط المدة",
        lastSessionDuration: "مدة آخر جلسة",
        whatsappClicks: "ضغطات واتساب",
        emailClicks: "ضغطات الإيميل",
        ctaClicks: "ضغطات الأزرار",
        interactionHistory: "سجل التفاعل",
        noResults: "لا توجد نتائج.",
        activeForUser: "جلسات المستخدم النشطة",
        recentUserEvents: "آخر نشاط للمستخدم",
        revokeSession: "إغلاق",
        sessionExpiry: "تنتهي في",
        accountHealth: "حالة الحساب",
        lastSeen: "آخر نشاط",
        signupLocale: "لغة التسجيل",
        pendingTokens: "روابط نشطة",
        eventCount: "عدد الأحداث",
        userSaved: "تم تحديث الحساب.",
        userDeleted: "تم حذف الحساب.",
        verificationSent: "تم إرسال رسالة التحقق من جديد.",
        sessionsRevoked: "تم إغلاق الجلسات.",
        dashboardLoadError: "تعذر تحميل لوحة التحكم.",
        updateError: "تعذر تحديث الحساب.",
        deleteError: "تعذر حذف الحساب.",
      };
    }

    return {
      title: "Dashboard",
      subtitle:
        "Monitor registrations, email verification, active sessions, and security signals for your Cabinet Vision service in one place.",
      refresh: "Refresh",
      exportUsers: "Export users",
      exportEvents: "Export events",
      overview: "Overview",
      users: "Users",
      visitors: "Visitors",
      sessions: "Sessions",
      events: "Activity",
      search: "Search by email",
      email: "Email",
      created: "Created",
      updated: "Updated",
      verified: "Verification",
      actions: "Actions",
      select: "Open",
      editor: "Account management",
      newPassword: "New password",
      save: "Save changes",
      delete: "Delete account",
      resendVerification: "Resend verification",
      revokeUserSessions: "Close sessions",
      deleteConfirm: "Delete this account permanently?",
      revokeConfirm: "Close all active sessions for this user?",
      yes: "Verified",
      no: "Pending",
      eventType: "Event",
      when: "Date",
      locale: "Locale",
      adminOnly: "This page is for admins only.",
      signInRequired: "Sign in with an admin account first.",
      passwordHint: "Leave empty to keep the current password.",
      totalUsers: "Accounts",
      verifiedUsers: "Verified emails",
      pendingUsers: "Pending users",
      activeSessions: "Active sessions",
      pendingLinks: "Pending links",
      users7d: "New users 7d",
      logins7d: "Logins 7d",
      resets30d: "Reset requests 30d",
      verificationRate: "Verification rate",
      funnel: "Activation funnel",
      localeDemand: "Demand by locale",
      stalePending: "Older unverified accounts",
      visitorDetail: "Visitor profile",
      registeredState: "Registration status",
      registeredYes: "Registered",
      registeredNo: "Anonymous",
      deviceType: "Device",
      lastPage: "Last page",
      landingPage: "Landing page",
      browserLanguage: "Browser language",
      timezone: "Timezone",
      pageHistory: "Page history",
      campaignData: "Acquisition data",
      source: "Source",
      medium: "Medium",
      campaign: "Campaign",
      engagement: "Engagement",
      totalSessions: "Total sessions",
      totalPageViews: "Total pageviews",
      avgDuration: "Average duration",
      lastSessionDuration: "Last session",
      whatsappClicks: "WhatsApp clicks",
      emailClicks: "Email clicks",
      ctaClicks: "CTA clicks",
      interactionHistory: "Interaction history",
      noResults: "No results.",
      activeForUser: "User active sessions",
      recentUserEvents: "Recent user activity",
      revokeSession: "Revoke",
      sessionExpiry: "Expires",
      accountHealth: "Account health",
      lastSeen: "Last activity",
      signupLocale: "Signup locale",
      pendingTokens: "Active links",
      eventCount: "Events",
      userSaved: "Account updated.",
      userDeleted: "Account deleted.",
      verificationSent: "Verification email sent again.",
      sessionsRevoked: "Sessions revoked.",
      dashboardLoadError: "Failed to load dashboard.",
      updateError: "Failed to update user.",
      deleteError: "Failed to delete user.",
    };
  }, [locale]);

  const ga4Copy = useMemo(() => {
    if (locale === "fr") {
      return {
        title: "Google Analytics",
        ready: "Connecte",
        missing: "Configuration requise",
        fetchedAt: "Derniere sync",
        activeUsersToday: "Utilisateurs actifs aujourd'hui",
        activeUsers7d: "Utilisateurs actifs 7j",
        sessions7d: "Sessions 7j",
        pageViews7d: "Pages vues 7j",
        avgSession: "Duree moyenne",
        topPages: "Top pages",
        sources: "Sources",
        countries: "Pays",
        devices: "Appareils",
      };
    }

    if (locale === "ar") {
      return {
        title: "Google Analytics",
        ready: "مربوط",
        missing: "يحتاج إعداد",
        fetchedAt: "آخر مزامنة",
        activeUsersToday: "المستخدمون النشطون اليوم",
        activeUsers7d: "المستخدمون النشطون 7 أيام",
        sessions7d: "الجلسات 7 أيام",
        pageViews7d: "مشاهدات الصفحات 7 أيام",
        avgSession: "متوسط الجلسة",
        topPages: "أكثر الصفحات",
        sources: "المصادر",
        countries: "الدول",
        devices: "الأجهزة",
      };
    }

    return {
      title: "Google Analytics",
      ready: "Connected",
      missing: "Setup required",
      fetchedAt: "Last sync",
      activeUsersToday: "Active users today",
      activeUsers7d: "Active users 7d",
      sessions7d: "Sessions 7d",
      pageViews7d: "Pageviews 7d",
      avgSession: "Average session",
      topPages: "Top pages",
      sources: "Sources",
      countries: "Countries",
      devices: "Devices",
    };
  }, [locale]);

  const conversationCopy = useMemo(() => {
    if (locale === "fr") {
      return {
        conversations: "Conversations",
        conversationDetail: "Detail de la conversation",
        status: "Statut",
        leadScore: "Lead score",
        messages: "Messages",
        clientProfile: "Profil client",
        assistant: "Assistant",
        client: "Client",
        supportDetails: "Details support",
        phone: "Telephone",
        cvVersion: "Version CV",
        country: "Pays",
        deviceCount: "Postes",
        submittedAt: "Recu le",
        open: "Ouverte",
        waiting_client: "En attente client",
        needs_human: "A reprendre manuellement",
      };
    }
    if (locale === "ar") {
      return {
        conversations: "المحادثات",
        conversationDetail: "تفاصيل المحادثة",
        status: "الحالة",
        leadScore: "قوة العميل",
        messages: "الرسائل",
        clientProfile: "ملف العميل",
        assistant: "المجيب",
        client: "العميل",
        supportDetails: "بيانات الدعم",
        phone: "الهاتف",
        cvVersion: "إصدار CV",
        country: "الدولة",
        deviceCount: "الأجهزة",
        submittedAt: "تاريخ الإرسال",
        open: "نشطة",
        waiting_client: "بانتظار العميل",
        needs_human: "تحتاج تدخل بشري",
      };
    }
    return {
      conversations: "Conversations",
      conversationDetail: "Conversation detail",
      status: "Status",
      leadScore: "Lead score",
      messages: "Messages",
      clientProfile: "Client profile",
      assistant: "Assistant",
      client: "Client",
      supportDetails: "Support details",
      phone: "Phone",
      cvVersion: "CV version",
      country: "Country",
      deviceCount: "Devices",
      submittedAt: "Submitted",
      open: "Open",
      waiting_client: "Waiting for client",
      needs_human: "Needs human follow-up",
    };
  }, [locale]);

  const loginHref = locale === "en" ? "/login" : `/${locale}/login`;

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setBusy(true);
    }
    setError(null);
    try {
      const response = await getAdminDashboard();
      setData(response);
    } catch (err: any) {
      setError(err?.message || copy.dashboardLoadError);
    } finally {
      if (!silent) {
        setBusy(false);
      }
    }
  }, [copy.dashboardLoadError]);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      load();
    } else if (!loading) {
      setBusy(false);
    }
  }, [loading, user, isAdmin, load]);

  useEffect(() => {
    if (loading || !user || !isAdmin) return;

    const refresh = () => {
      void load(true);
    };

    const intervalId = window.setInterval(refresh, 15000);
    const handleFocus = () => refresh();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loading, user, isAdmin, load]);

  useEffect(() => {
    if (!data?.users.length) {
      setSelectedUserId(null);
      return;
    }
    if (!selectedUserId || !data.users.some((item) => item.id === selectedUserId)) {
      const next = data?.users[0];
      if (next) {
        setSelectedUserId(next.id);
        setEditEmail(next.email);
        setEditPassword("");
        setEditVerified(Boolean(next.emailVerifiedAt));
      }
    }
  }, [data, selectedUserId]);

  useEffect(() => {
    if (!data?.visitors.length) {
      setSelectedVisitorId(null);
      return;
    }
    if (!selectedVisitorId || !data.visitors.some((item) => item.id === selectedVisitorId)) {
      setSelectedVisitorId(data.visitors[0].id);
    }
  }, [data, selectedVisitorId]);

  useEffect(() => {
    if (!data?.conversations.length) {
      setSelectedConversationId(null);
      return;
    }
    if (!selectedConversationId || !data.conversations.some((item) => item.id === selectedConversationId)) {
      setSelectedConversationId(data.conversations[0].id);
    }
  }, [data, selectedConversationId]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (data?.users ?? []).filter((item) => {
      const matchesQuery = !normalizedQuery || item.email.toLowerCase().includes(normalizedQuery);
      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" && Boolean(item.emailVerifiedAt)) ||
        (verificationFilter === "pending" && !item.emailVerifiedAt);
      return matchesQuery && matchesVerification;
    });
  }, [data?.users, query, verificationFilter]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (data?.events ?? []).filter((item) => {
      const matchesQuery = !normalizedQuery || (item.email || "").toLowerCase().includes(normalizedQuery);
      const matchesEvent = eventFilter === "all" || item.type === eventFilter;
      return matchesQuery && matchesEvent;
    });
  }, [data?.events, query, eventFilter]);

  const filteredSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (data?.sessions ?? []).filter((item) => !normalizedQuery || (item.email || "").toLowerCase().includes(normalizedQuery));
  }, [data?.sessions, query]);

  const filteredVisitors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (data?.visitors ?? []).filter((item) => {
      if (!normalizedQuery) return true;
      return [item.email, item.ip, item.lastPath, item.landingPath, item.userAgent]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [data?.visitors, query]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (data?.conversations ?? []).filter((item) => {
      if (!normalizedQuery) return true;
      return [
        item.email,
        item.title,
        item.visitor?.email,
        item.visitor?.ip,
        item.visitor?.utmSource,
        item.visitor?.utmCampaign,
        item.lastPath,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [data?.conversations, query]);

  const selectedUser = useMemo(
    () => (data?.users ?? []).find((item) => item.id === selectedUserId) ?? null,
    [data?.users, selectedUserId]
  );
  const selectedUserSessions = useMemo(
    () => filteredSessions.filter((session) => session.userId === selectedUserId),
    [filteredSessions, selectedUserId]
  );
  const selectedUserEvents = useMemo(
    () => filteredEvents.filter((event) => event.userId === selectedUserId).slice(0, 20),
    [filteredEvents, selectedUserId]
  );
  const selectedVisitor = useMemo(
    () => filteredVisitors.find((item) => item.id === selectedVisitorId) ?? null,
    [filteredVisitors, selectedVisitorId]
  );
  const eventTypes = useMemo(
    () => Array.from(new Set((data?.events ?? []).map((item) => item.type))),
    [data?.events]
  );

  const handleSelectUser = (next: AdminDashboardUser) => {
    setSelectedUserId(next.id);
    setEditEmail(next.email);
    setEditPassword("");
    setEditVerified(Boolean(next.emailVerifiedAt));
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSavingUser(true);
    setError(null);
    try {
      await updateAdminUser(selectedUser.id, {
        email: editEmail,
        password: editPassword || undefined,
        emailVerified: editVerified,
      });
      toast.success(copy.userSaved);
      await load();
    } catch (err: any) {
      const message = err?.message || copy.updateError;
      setError(message);
      toast.error(message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (typeof window !== "undefined" && !window.confirm(copy.deleteConfirm)) return;
    setSavingUser(true);
    setError(null);
    try {
      await deleteAdminUser(selectedUser.id);
      toast.success(copy.userDeleted);
      setSelectedUserId(null);
      await load();
    } catch (err: any) {
      const message = err?.message || copy.deleteError;
      setError(message);
      toast.error(message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleResendVerification = async () => {
    if (!selectedUser) return;
    setSavingUser(true);
    setError(null);
    try {
      await resendAdminVerification(selectedUser.id, locale);
      toast.success(copy.verificationSent);
      await load();
    } catch (err: any) {
      const message = err?.message || copy.updateError;
      setError(message);
      toast.error(message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleRevokeUserSessions = async () => {
    if (!selectedUser) return;
    if (typeof window !== "undefined" && !window.confirm(copy.revokeConfirm)) return;
    setSavingUser(true);
    setError(null);
    try {
      await revokeAdminUserSessions(selectedUser.id);
      toast.success(copy.sessionsRevoked);
      await load();
    } catch (err: any) {
      const message = err?.message || copy.updateError;
      setError(message);
      toast.error(message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleRevokeSession = async (session: AdminDashboardSession) => {
    setSavingUser(true);
    setError(null);
    try {
      await revokeAdminSession(session.id);
      toast.success(copy.sessionsRevoked);
      await load();
    } catch (err: any) {
      const message = err?.message || copy.updateError;
      setError(message);
      toast.error(message);
    } finally {
      setSavingUser(false);
    }
  };

  const eventLabels: Record<string, string> = {
    signup: locale === "ar" ? "تسجيل" : locale === "fr" ? "Inscription" : "Signup",
    login: locale === "ar" ? "دخول" : locale === "fr" ? "Connexion" : "Login",
    logout: locale === "ar" ? "خروج" : locale === "fr" ? "Deconnexion" : "Logout",
    magic_link_requested: locale === "ar" ? "طلب رابط دخول" : locale === "fr" ? "Lien magique demande" : "Magic link requested",
    password_reset_requested:
      locale === "ar" ? "طلب استرجاع كلمة المرور" : locale === "fr" ? "Reset mot de passe demande" : "Password reset requested",
    password_reset_completed:
      locale === "ar" ? "إكمال استرجاع كلمة المرور" : locale === "fr" ? "Reset mot de passe termine" : "Password reset completed",
    email_verified: locale === "ar" ? "تأكيد البريد" : locale === "fr" ? "Email verifie" : "Email verified",
    magic_login_completed:
      locale === "ar" ? "دخول عبر الرابط" : locale === "fr" ? "Connexion par lien terminee" : "Magic login completed",
    admin_user_updated: locale === "ar" ? "تعديل إداري" : locale === "fr" ? "Modification admin" : "Admin user updated",
    admin_user_deleted: locale === "ar" ? "حذف إداري" : locale === "fr" ? "Suppression admin" : "Admin user deleted",
    admin_verification_sent:
      locale === "ar" ? "إعادة إرسال التحقق" : locale === "fr" ? "Verification renvoyee" : "Admin verification sent",
    admin_session_revoked: locale === "ar" ? "إلغاء جلسة" : locale === "fr" ? "Session revoquee" : "Admin session revoked",
    admin_all_sessions_revoked:
      locale === "ar" ? "إلغاء كل الجلسات" : locale === "fr" ? "Toutes les sessions revoquees" : "All sessions revoked",
  };

  const usersCsv = filteredUsers.map((item) => ({
    email: item.email,
    verified: item.emailVerifiedAt ? "yes" : "no",
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    signup_locale: item.signupLocale,
    active_sessions: item.activeSessions,
    pending_links: item.pendingTokens,
    last_seen_at: item.lastSeenAt,
    last_event_type: item.lastEventType,
    event_count: item.eventCount,
  }));

  const eventsCsv = filteredEvents.map((item) => ({
    type: item.type,
    email: item.email,
    locale: item.locale,
    ip: item.ip,
    user_agent: item.userAgent,
    created_at: item.createdAt,
  }));

  const stats = data?.stats;

  return (
    <div className="site-page min-h-screen flex flex-col bg-transparent">
      <Header />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">{copy.title}</h1>
                <p className="mt-2 max-w-3xl text-muted-foreground">{copy.subtitle}</p>
                {data?.admin?.email ? <p className="mt-2 text-sm text-slate-500">{data.admin.email}</p> : null}
              </div>
              {user && isAdmin ? (
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={() => exportCsv("cvsolucion-users.csv", usersCsv)}>
                    {copy.exportUsers}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => exportCsv("cvsolucion-events.csv", eventsCsv)}>
                    {copy.exportEvents}
                  </Button>
                  <Button type="button" onClick={() => void load()} disabled={busy || savingUser}>
                    {copy.refresh}
                  </Button>
                </div>
              ) : null}
            </div>

            {!loading && !user ? (
              <Card>
                <CardContent className="p-6">
                  <p className="mb-4 text-slate-700">{copy.signInRequired}</p>
                  <a href={loginHref} className="text-primary font-semibold hover:underline">
                    {loginHref}
                  </a>
                </CardContent>
              </Card>
            ) : null}

            {!loading && user && !isAdmin ? (
              <Card>
                <CardContent className="p-6 text-slate-700">{copy.adminOnly}</CardContent>
              </Card>
            ) : null}

            {error ? (
              <Card>
                <CardContent className="p-6 text-red-600">{error}</CardContent>
              </Card>
            ) : null}

            {user && isAdmin ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
                  <MetricCard title={copy.totalUsers} value={stats?.totalUsers ?? 0} />
                  <MetricCard title={copy.verifiedUsers} value={stats?.verifiedUsers ?? 0} />
                  <MetricCard title={copy.pendingUsers} value={stats?.unverifiedUsers ?? 0} />
                  <MetricCard title={copy.activeSessions} value={stats?.activeSessions ?? 0} />
                  <MetricCard title={copy.pendingLinks} value={stats?.pendingTokens ?? 0} />
                  <MetricCard title={copy.users7d} value={stats?.usersLast7Days ?? 0} />
                  <MetricCard title={copy.logins7d} value={stats?.loginsLast7Days ?? 0} />
                  <MetricCard title={copy.verificationRate} value={`${stats?.verificationRate ?? 0}%`} />
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <Card>
                    <CardHeader><CardTitle>{copy.funnel}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <ProgressRow label={copy.totalUsers} value={stats?.totalUsers ?? 0} total={stats?.totalUsers ?? 1} />
                      <ProgressRow label={copy.verifiedUsers} value={stats?.verifiedUsers ?? 0} total={stats?.totalUsers ?? 1} />
                      <ProgressRow label={copy.activeSessions} value={stats?.activeSessions ?? 0} total={stats?.totalUsers ?? 1} />
                      <ProgressRow label={copy.resets30d} value={stats?.resetRequestsLast30Days ?? 0} total={Math.max(stats?.usersLast30Days ?? 1, 1)} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>{copy.localeDemand}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {data?.insights.localeBreakdown.map((item) => (
                        <div key={item.locale} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{localeBadge(item.locale)}</Badge>
                            <span className="font-medium text-slate-700">{item.locale.toUpperCase()}</span>
                          </div>
                          <span className="text-lg font-semibold text-slate-900">{item.count}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>{copy.stalePending}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {data?.insights.stalePendingUsers.length ? (
                        data.insights.stalePendingUsers.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectUser(item)}
                            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-slate-50"
                          >
                            <div>
                              <div className="font-medium text-slate-900">{item.email}</div>
                              <div className="text-xs text-slate-500">{formatDate(item.createdAt, locale)}</div>
                            </div>
                            <Badge variant="secondary">{copy.no}</Badge>
                          </button>
                        ))
                      ) : (
                        <div className="text-sm text-slate-500">{copy.noResults}</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle>{ga4Copy.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={data?.ga4?.enabled ? "default" : "secondary"}>
                          {data?.ga4?.enabled ? ga4Copy.ready : ga4Copy.missing}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {ga4Copy.fetchedAt}: {data?.ga4?.fetchedAt ? formatDate(data.ga4.fetchedAt, locale) : "-"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {data?.ga4?.error ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {data.ga4.error}
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <MetricCard title={ga4Copy.activeUsersToday} value={data?.ga4?.overview.activeUsers1d ?? 0} />
                      <MetricCard title={ga4Copy.activeUsers7d} value={data?.ga4?.overview.activeUsers7d ?? 0} />
                      <MetricCard title={ga4Copy.sessions7d} value={data?.ga4?.overview.sessions7d ?? 0} />
                      <MetricCard title={ga4Copy.pageViews7d} value={data?.ga4?.overview.pageViews7d ?? 0} />
                      <MetricCard title={ga4Copy.avgSession} value={formatDuration(Math.round((data?.ga4?.overview.avgSessionDuration7d ?? 0) * 1000))} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <StatPill label="page_view" value={data?.ga4?.events7d.pageViews ?? 0} />
                      <StatPill label="whatsapp_click" value={data?.ga4?.events7d.whatsappClicks ?? 0} />
                      <StatPill label="email_click" value={data?.ga4?.events7d.emailClicks ?? 0} />
                      <StatPill label="cta_click" value={data?.ga4?.events7d.ctaClicks ?? 0} />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <Card>
                        <CardHeader><CardTitle>{ga4Copy.topPages}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {data?.ga4?.topPages?.length ? data.ga4.topPages.map((item) => (
                            <div key={item.pagePath} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                              <span className="truncate text-sm text-slate-700">{item.pagePath}</span>
                              <span className="text-base font-semibold text-slate-900">{item.views}</span>
                            </div>
                          )) : <div className="text-sm text-slate-500">{copy.noResults}</div>}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader><CardTitle>{ga4Copy.sources}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {data?.ga4?.trafficSources?.length ? data.ga4.trafficSources.map((item) => (
                            <div key={item.sourceMedium} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                              <span className="truncate text-sm text-slate-700">{item.sourceMedium}</span>
                              <span className="text-base font-semibold text-slate-900">{item.users}</span>
                            </div>
                          )) : <div className="text-sm text-slate-500">{copy.noResults}</div>}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <Card>
                        <CardHeader><CardTitle>{ga4Copy.countries}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {data?.ga4?.countries?.length ? data.ga4.countries.map((item) => (
                            <div key={item.country} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                              <span className="truncate text-sm text-slate-700">{item.country}</span>
                              <span className="text-base font-semibold text-slate-900">{item.users}</span>
                            </div>
                          )) : <div className="text-sm text-slate-500">{copy.noResults}</div>}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader><CardTitle>{ga4Copy.devices}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {data?.ga4?.devices?.length ? data.ga4.devices.map((item) => (
                            <div key={item.deviceCategory} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                              <span className="truncate text-sm capitalize text-slate-700">{item.deviceCategory}</span>
                              <span className="text-base font-semibold text-slate-900">{item.users}</span>
                            </div>
                          )) : <div className="text-sm text-slate-500">{copy.noResults}</div>}
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
                      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />
                      <select
                        value={verificationFilter}
                        onChange={(event) => setVerificationFilter(event.target.value as "all" | "verified" | "pending")}
                        className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="all">{copy.verified}</option>
                        <option value="verified">{copy.yes}</option>
                        <option value="pending">{copy.no}</option>
                      </select>
                      <select
                        value={eventFilter}
                        onChange={(event) => setEventFilter(event.target.value)}
                        className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="all">{copy.eventType}</option>
                        {eventTypes.map((item) => (
                          <option key={item} value={item}>
                            {eventLabels[item] || item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">{copy.overview}</TabsTrigger>
                    <TabsTrigger value="users">{copy.users}</TabsTrigger>
                    <TabsTrigger value="visitors">{copy.visitors}</TabsTrigger>
                    <TabsTrigger value="conversations">{conversationCopy.conversations}</TabsTrigger>
                    <TabsTrigger value="sessions">{copy.sessions}</TabsTrigger>
                    <TabsTrigger value="events">{copy.events}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                      <UsersTable copy={copy} locale={locale} users={filteredUsers} selectedUserId={selectedUserId} onSelect={handleSelectUser} />
                      <UserDetailPanel
                        copy={copy}
                        locale={locale}
                        selectedUser={selectedUser}
                        editEmail={editEmail}
                        editPassword={editPassword}
                        editVerified={editVerified}
                        savingUser={savingUser}
                        selectedUserSessions={selectedUserSessions}
                        selectedUserEvents={selectedUserEvents}
                        onEditEmail={setEditEmail}
                        onEditPassword={setEditPassword}
                        onEditVerified={setEditVerified}
                        onSave={handleSaveUser}
                        onDelete={handleDeleteUser}
                        onResendVerification={handleResendVerification}
                        onRevokeUserSessions={handleRevokeUserSessions}
                        onRevokeSession={handleRevokeSession}
                        eventLabels={eventLabels}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="users">
                    <UsersTable copy={copy} locale={locale} users={filteredUsers} selectedUserId={selectedUserId} onSelect={handleSelectUser} />
                  </TabsContent>

                  <TabsContent value="visitors">
                    <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                      <VisitorsTable
                        copy={copy}
                        locale={locale}
                        visitors={filteredVisitors}
                        selectedVisitorId={selectedVisitorId}
                        onSelect={setSelectedVisitorId}
                      />
                      <VisitorDetailPanel copy={copy} locale={locale} visitor={selectedVisitor} />
                    </div>
                  </TabsContent>

                  <TabsContent value="conversations">
                    <ConversationsPanel
                      copy={{ ...copy, ...conversationCopy }}
                      locale={locale}
                      conversations={filteredConversations}
                      selectedConversationId={selectedConversationId}
                      onSelect={setSelectedConversationId}
                    />
                  </TabsContent>

                  <TabsContent value="sessions">
                    <Card>
                      <CardHeader><CardTitle>{copy.sessions}</CardTitle></CardHeader>
                      <CardContent>
                        <ScrollArea className="w-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{copy.email}</TableHead>
                                <TableHead>{copy.created}</TableHead>
                                <TableHead>{copy.sessionExpiry}</TableHead>
                                <TableHead>{copy.actions}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredSessions.length ? (
                                filteredSessions.map((session) => (
                                  <TableRow key={session.id}>
                                    <TableCell className="font-medium">{session.email || session.userId}</TableCell>
                                    <TableCell>{formatDate(session.createdAt, locale)}</TableCell>
                                    <TableCell>{formatDate(session.expiresAt, locale)}</TableCell>
                                    <TableCell>
                                      <Button type="button" size="sm" variant="outline" onClick={() => handleRevokeSession(session)}>
                                        {copy.revokeSession}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-slate-500">{copy.noResults}</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="events">
                    <Card>
                      <CardHeader><CardTitle>{copy.events}</CardTitle></CardHeader>
                      <CardContent>
                        <ScrollArea className="w-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{copy.eventType}</TableHead>
                                <TableHead>{copy.email}</TableHead>
                                <TableHead>{copy.locale}</TableHead>
                                <TableHead>IP</TableHead>
                                <TableHead>{copy.when}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredEvents.length ? (
                                filteredEvents.map((event) => (
                                  <TableRow key={event.id}>
                                    <TableCell className="font-medium">{eventLabels[event.type] || event.type}</TableCell>
                                    <TableCell>{event.email || "-"}</TableCell>
                                    <TableCell>{event.locale || "-"}</TableCell>
                                    <TableCell>{event.ip || "-"}</TableCell>
                                    <TableCell>{formatDate(event.createdAt, locale)}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-slate-500">{copy.noResults}</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function UsersTable({
  copy,
  locale,
  users,
  selectedUserId,
  onSelect,
}: {
  copy: Record<string, string>;
  locale: string;
  users: AdminDashboardUser[];
  selectedUserId: string | null;
  onSelect: (user: AdminDashboardUser) => void;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{copy.users}</CardTitle></CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.email}</TableHead>
                <TableHead>{copy.verified}</TableHead>
                <TableHead>{copy.created}</TableHead>
                <TableHead>{copy.lastSeen}</TableHead>
                <TableHead>{copy.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length ? (
                users.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>{item.email}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>{copy.eventCount}: {item.eventCount}</span>
                        <span>{copy.pendingTokens}: {item.pendingTokens}</span>
                        <span>{copy.signupLocale}: {localeBadge(item.signupLocale)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.emailVerifiedAt ? "default" : "secondary"}>
                        {item.emailVerifiedAt ? copy.yes : copy.no}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(item.createdAt, locale)}</TableCell>
                    <TableCell>{formatDate(item.lastSeenAt, locale)}</TableCell>
                    <TableCell>
                      <Button type="button" size="sm" variant={selectedUserId === item.id ? "default" : "outline"} onClick={() => onSelect(item)}>
                        {copy.select}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">{copy.noResults}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function UserDetailPanel({
  copy,
  locale,
  selectedUser,
  editEmail,
  editPassword,
  editVerified,
  savingUser,
  selectedUserSessions,
  selectedUserEvents,
  onEditEmail,
  onEditPassword,
  onEditVerified,
  onSave,
  onDelete,
  onResendVerification,
  onRevokeUserSessions,
  onRevokeSession,
  eventLabels,
}: {
  copy: Record<string, string>;
  locale: string;
  selectedUser: AdminDashboardUser | null;
  editEmail: string;
  editPassword: string;
  editVerified: boolean;
  savingUser: boolean;
  selectedUserSessions: AdminDashboardSession[];
  selectedUserEvents: AdminDashboardEvent[];
  onEditEmail: (value: string) => void;
  onEditPassword: (value: string) => void;
  onEditVerified: (value: boolean) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onResendVerification: () => Promise<void>;
  onRevokeUserSessions: () => Promise<void>;
  onRevokeSession: (session: AdminDashboardSession) => Promise<void>;
  eventLabels: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{copy.editor}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {selectedUser ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatPill label={copy.created} value={formatDate(selectedUser.createdAt, locale)} />
              <StatPill label={copy.updated} value={formatDate(selectedUser.updatedAt, locale)} />
              <StatPill label={copy.lastSeen} value={formatDate(selectedUser.lastSeenAt, locale)} />
              <StatPill label={copy.signupLocale} value={localeBadge(selectedUser.signupLocale)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-user-email">{copy.email}</Label>
              <Input id="admin-user-email" value={editEmail} onChange={(event) => onEditEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-user-password">{copy.newPassword}</Label>
              <Input id="admin-user-password" type="password" value={editPassword} onChange={(event) => onEditPassword(event.target.value)} placeholder={copy.passwordHint} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={editVerified} onChange={(event) => onEditVerified(event.target.checked)} />
              {copy.verified}
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" onClick={onSave} disabled={savingUser}>{copy.save}</Button>
              <Button type="button" variant="outline" onClick={onRevokeUserSessions} disabled={savingUser || selectedUser.activeSessions === 0}>{copy.revokeUserSessions}</Button>
              <Button type="button" variant="outline" onClick={onResendVerification} disabled={savingUser || Boolean(selectedUser.emailVerifiedAt)}>{copy.resendVerification}</Button>
              <Button type="button" variant="destructive" onClick={onDelete} disabled={savingUser}>{copy.delete}</Button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">{copy.accountHealth}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <StatPill label={copy.activeSessions} value={selectedUser.activeSessions} />
                <StatPill label={copy.pendingTokens} value={selectedUser.pendingTokens} />
                <StatPill label={copy.eventCount} value={selectedUser.eventCount} />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">{copy.activeForUser}</h3>
              {selectedUserSessions.length ? (
                selectedUserSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-slate-800">{formatDate(session.createdAt, locale)}</div>
                      <div className="text-slate-500">{copy.sessionExpiry}: {formatDate(session.expiresAt, locale)}</div>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => onRevokeSession(session)}>{copy.revokeSession}</Button>
                  </div>
                ))
              ) : <div className="text-sm text-slate-500">{copy.noResults}</div>}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">{copy.recentUserEvents}</h3>
              {selectedUserEvents.length ? (
                selectedUserEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-800">{eventLabels[event.type] || event.type}</span>
                      <Badge variant="outline">{event.locale || "-"}</Badge>
                    </div>
                    <div className="mt-2 text-slate-500">{formatDate(event.createdAt, locale)}</div>
                  </div>
                ))
              ) : <div className="text-sm text-slate-500">{copy.noResults}</div>}
            </div>
          </>
        ) : <div className="text-sm text-slate-500">-</div>}
      </CardContent>
    </Card>
  );
}

function VisitorsTable({
  copy,
  locale,
  visitors,
  selectedVisitorId,
  onSelect,
}: {
  copy: Record<string, string>;
  locale: string;
  visitors: AdminDashboardVisitor[];
  selectedVisitorId: string | null;
  onSelect: (visitorId: string) => void;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{copy.visitors}</CardTitle></CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.email}</TableHead>
                <TableHead>{copy.registeredState}</TableHead>
                <TableHead>{copy.deviceType}</TableHead>
                <TableHead>{copy.lastSeen}</TableHead>
                <TableHead>{copy.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.length ? (
                visitors.map((visitor) => {
                  const isSelected = selectedVisitorId === visitor.id;
                  return (
                  <TableRow
                    key={visitor.id}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-slate-50"}`}
                    onClick={() => onSelect(visitor.id)}
                  >
                    <TableCell className="font-medium">
                      <div>{visitor.email || visitor.ip || visitor.id.slice(0, 12)}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>{copy.lastPage}: {visitor.lastPath}</span>
                        <span>{copy.locale}: {localeBadge(visitor.locale)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={visitor.isRegistered ? "default" : "secondary"}>
                        {visitor.isRegistered ? copy.registeredYes : copy.registeredNo}
                      </Badge>
                    </TableCell>
                    <TableCell>{visitor.deviceType}</TableCell>
                    <TableCell>{formatDate(visitor.lastSeenAt, locale)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(visitor.id);
                        }}
                      >
                        {copy.select}
                      </Button>
                    </TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">{copy.noResults}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function VisitorDetailPanel({
  copy,
  locale,
  visitor,
}: {
  copy: Record<string, string>;
  locale: string;
  visitor: AdminDashboardVisitor | null;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{copy.visitorDetail}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {visitor ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatPill label={copy.registeredState} value={visitor.isRegistered ? copy.registeredYes : copy.registeredNo} />
              <StatPill label={copy.deviceType} value={visitor.deviceType} />
              <StatPill label={copy.created} value={formatDate(visitor.firstSeenAt, locale)} />
              <StatPill label={copy.lastSeen} value={formatDate(visitor.lastSeenAt, locale)} />
              <StatPill label={copy.locale} value={localeBadge(visitor.locale)} />
              <StatPill label={copy.browserLanguage} value={visitor.browserLanguage || "-"} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatPill label={copy.email} value={visitor.email || "-"} />
              <StatPill label="IP" value={visitor.ip || "-"} />
              <StatPill label={copy.timezone} value={visitor.timezone || "-"} />
              <StatPill label="Screen" value={visitor.screen || "-"} />
              <StatPill label={copy.landingPage} value={visitor.landingPath} />
              <StatPill label={copy.lastPage} value={visitor.lastPath} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{copy.campaignData}</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <StatPill label={copy.source} value={visitor.utmSource || "-"} />
                <StatPill label={copy.medium} value={visitor.utmMedium || "-"} />
                <StatPill label={copy.campaign} value={visitor.utmCampaign || "-"} />
                <StatPill label="gclid" value={visitor.gclid || "-"} />
                <StatPill label="fbclid" value={visitor.fbclid || "-"} />
                <StatPill label="utm_term" value={visitor.utmTerm || "-"} />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{copy.engagement}</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <StatPill label={copy.totalSessions} value={visitor.totalSessions} />
                <StatPill label={copy.totalPageViews} value={visitor.totalPageViews} />
                <StatPill
                  label={copy.avgDuration}
                  value={formatDuration(visitor.totalSessions ? Math.round(visitor.totalDurationMs / visitor.totalSessions) : null)}
                />
                <StatPill label={copy.lastSessionDuration} value={formatDuration(visitor.lastSessionDurationMs)} />
                <StatPill label={copy.whatsappClicks} value={visitor.whatsappClicks} />
                <StatPill label={copy.emailClicks} value={visitor.emailClicks} />
                <StatPill label={copy.ctaClicks} value={visitor.ctaClicks} />
                <StatPill label="Chat opens" value={visitor.chatOpens} />
                <StatPill label="Chat messages" value={visitor.chatMessages} />
                <StatPill label="pages/session" value={visitor.lastSessionPageCount ?? "-"} />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">User agent</div>
              <div className="mt-2 break-all text-sm text-slate-600">{visitor.userAgent || "-"}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Referrer</div>
              <div className="mt-2 break-all text-sm text-slate-600">{visitor.referrer || "-"}</div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">{copy.pageHistory}</h3>
              {visitor.pageViews.length ? (
                visitor.pageViews.map((pageView, index) => (
                  <div key={`${pageView.occurredAt}-${index}`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                    <div className="font-medium text-slate-800">{pageView.title || pageView.path}</div>
                    <div className="mt-1 break-all text-slate-500">{pageView.path}</div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{formatDate(pageView.occurredAt, locale)}</span>
                      <span>{localeBadge(pageView.locale)}</span>
                      <span>{pageView.referrer || "-"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">{copy.noResults}</div>
              )}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">{copy.interactionHistory}</h3>
              {visitor.interactions.length ? (
                visitor.interactions.map((interaction, index) => (
                  <div key={`${interaction.occurredAt}-${index}`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-800">{interaction.type}</span>
                      <span className="text-xs text-slate-500">{formatDate(interaction.occurredAt, locale)}</span>
                    </div>
                    <div className="mt-2 break-all text-slate-600">{interaction.href || interaction.path}</div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{interaction.label || "-"}</span>
                      <span>{formatDuration(interaction.durationMs)}</span>
                      <span>{interaction.pageCount ?? "-"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">{copy.noResults}</div>
              )}
            </div>
          </>
        ) : <div className="text-sm text-slate-500">-</div>}
      </CardContent>
    </Card>
  );
}
