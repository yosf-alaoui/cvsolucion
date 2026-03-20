import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import { deleteAdminUser, getAdminDashboard, updateAdminUser, type AdminDashboardResponse } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

  const copy = useMemo(() => {
    if (locale === "fr") {
      return {
        title: "Tableau de bord",
        subtitle: "Vue interne des inscriptions, sessions actives et activite d'authentification.",
        refresh: "Actualiser",
        users: "Utilisateurs inscrits",
        sessions: "Sessions actives",
        events: "Activite recente",
        email: "Email",
        created: "Creation",
        verified: "Verification",
        actions: "Actions",
        select: "Modifier",
        editor: "Modifier le compte",
        newPassword: "Nouveau mot de passe",
        save: "Enregistrer",
        delete: "Supprimer le compte",
        deleteConfirm: "Supprimer ce compte definitivement ?",
        yes: "Verifie",
        no: "En attente",
        eventType: "Evenement",
        when: "Date",
        adminOnly: "Acces reserve a l'administrateur.",
        signInRequired: "Connectez-vous avec un compte administrateur.",
        passwordHint: "Laissez vide pour garder le mot de passe actuel.",
        stats: {
          users: "Comptes",
          verified: "Emails verifies",
          sessions: "Sessions actives",
          tokens: "Liens en attente",
          events: "Evenements",
        },
      };
    }

    if (locale === "ar") {
      return {
        title: "لوحة التحكم",
        subtitle: "عرض داخلي للتسجيلات والجلسات النشطة ونشاط المصادقة داخل الموقع.",
        refresh: "تحديث",
        users: "المستخدمون المسجلون",
        sessions: "الجلسات النشطة",
        events: "آخر النشاطات",
        email: "البريد",
        created: "تاريخ الإنشاء",
        verified: "التحقق",
        actions: "الإجراءات",
        select: "تعديل",
        editor: "تعديل الحساب",
        newPassword: "كلمة مرور جديدة",
        save: "حفظ التغييرات",
        delete: "حذف الحساب",
        deleteConfirm: "هل تريد حذف هذا الحساب نهائيًا؟",
        yes: "مؤكد",
        no: "قيد الانتظار",
        eventType: "الحدث",
        when: "التاريخ",
        adminOnly: "هذه الصفحة مخصصة للمشرف فقط.",
        signInRequired: "سجّل الدخول بحساب إداري أولًا.",
        passwordHint: "اترك الحقل فارغًا إذا كنت لا تريد تغيير كلمة المرور.",
        stats: {
          users: "الحسابات",
          verified: "البريد المؤكد",
          sessions: "الجلسات النشطة",
          tokens: "الروابط المعلقة",
          events: "الأحداث",
        },
      };
    }

    return {
      title: "Dashboard",
      subtitle: "Internal view of registrations, active sessions, and authentication activity.",
      refresh: "Refresh",
      users: "Registered users",
      sessions: "Active sessions",
      events: "Recent activity",
      email: "Email",
      created: "Created",
      verified: "Verification",
      actions: "Actions",
      select: "Edit",
      editor: "Edit account",
      newPassword: "New password",
      save: "Save changes",
      delete: "Delete account",
      deleteConfirm: "Delete this account permanently?",
      yes: "Verified",
      no: "Pending",
      eventType: "Event",
      when: "Date",
      adminOnly: "This page is for admins only.",
      signInRequired: "Sign in with an admin account first.",
      passwordHint: "Leave empty to keep the current password.",
      stats: {
        users: "Accounts",
        verified: "Verified emails",
        sessions: "Active sessions",
        tokens: "Pending links",
        events: "Events",
      },
    };
  }, [locale]);

  const loginHref = locale === "en" ? "/login" : `/${locale}/login`;
  const stats = data?.stats;
  const selectedUser = data?.users.find((item) => item.id === selectedUserId) ?? null;

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await getAdminDashboard();
      setData(response);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && user && isAdmin) {
      load();
    } else if (!loading) {
      setBusy(false);
    }
  }, [loading, user, isAdmin]);

  useEffect(() => {
    if (!data?.users.length) {
      setSelectedUserId(null);
      return;
    }

    if (!selectedUserId || !data.users.some((item) => item.id === selectedUserId)) {
      const next = data.users[0];
      setSelectedUserId(next.id);
      setEditEmail(next.email);
      setEditPassword("");
      setEditVerified(Boolean(next.emailVerifiedAt));
    }
  }, [data, selectedUserId]);

  const handleSelectUser = (userId: string) => {
    const next = data?.users.find((item) => item.id === userId);
    if (!next) return;
    setSelectedUserId(userId);
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
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to update user.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (typeof window !== "undefined" && !window.confirm(copy.deleteConfirm)) {
      return;
    }
    setSavingUser(true);
    setError(null);
    try {
      await deleteAdminUser(selectedUser.id);
      setSelectedUserId(null);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to delete user.");
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">{copy.title}</h1>
                <p className="mt-2 text-muted-foreground">{copy.subtitle}</p>
                {data?.admin?.email ? <p className="mt-2 text-sm text-slate-500">{data.admin.email}</p> : null}
              </div>
              {user && isAdmin ? (
                <Button type="button" onClick={load} disabled={busy || savingUser}>
                  {copy.refresh}
                </Button>
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <Card><CardHeader><CardTitle className="text-base">{copy.stats.users}</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats?.totalUsers ?? 0}</CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-base">{copy.stats.verified}</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats?.verifiedUsers ?? 0}</CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-base">{copy.stats.sessions}</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats?.activeSessions ?? 0}</CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-base">{copy.stats.tokens}</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats?.pendingTokens ?? 0}</CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-base">{copy.stats.events}</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats?.totalEvents ?? 0}</CardContent></Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>{copy.users}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="w-full">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{copy.email}</TableHead>
                              <TableHead>{copy.created}</TableHead>
                              <TableHead>{copy.verified}</TableHead>
                              <TableHead>{copy.actions}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data?.users.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.email}</TableCell>
                                <TableCell>{formatDate(item.createdAt, locale)}</TableCell>
                                <TableCell>
                                  <Badge variant={item.emailVerifiedAt ? "default" : "secondary"}>
                                    {item.emailVerifiedAt ? copy.yes : copy.no}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={selectedUserId === item.id ? "default" : "outline"}
                                    onClick={() => handleSelectUser(item.id)}
                                  >
                                    {copy.select}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{copy.editor}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedUser ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="admin-user-email">{copy.email}</Label>
                            <Input
                              id="admin-user-email"
                              value={editEmail}
                              onChange={(event) => setEditEmail(event.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="admin-user-password">{copy.newPassword}</Label>
                            <Input
                              id="admin-user-password"
                              type="password"
                              value={editPassword}
                              onChange={(event) => setEditPassword(event.target.value)}
                              placeholder={copy.passwordHint}
                            />
                          </div>

                          <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                              type="checkbox"
                              checked={editVerified}
                              onChange={(event) => setEditVerified(event.target.checked)}
                            />
                            {copy.verified}
                          </label>

                          <div className="flex gap-3">
                            <Button type="button" onClick={handleSaveUser} disabled={savingUser}>
                              {copy.save}
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleDeleteUser} disabled={savingUser}>
                              {copy.delete}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-500">-</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>{copy.sessions}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data?.sessions.length ? (
                      data.sessions.map((session) => (
                        <div key={session.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                          <div className="font-medium text-slate-800">{session.userId}</div>
                          <div className="text-slate-500">{formatDate(session.createdAt, locale)}</div>
                          <div className="text-slate-500">Expires: {formatDate(session.expiresAt, locale)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">0</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{copy.events}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{copy.eventType}</TableHead>
                            <TableHead>{copy.email}</TableHead>
                            <TableHead>Locale</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>{copy.when}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.events.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell className="font-medium">{event.type}</TableCell>
                              <TableCell>{event.email || "-"}</TableCell>
                              <TableCell>{event.locale || "-"}</TableCell>
                              <TableCell>{event.ip || "-"}</TableCell>
                              <TableCell>{formatDate(event.createdAt, locale)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
