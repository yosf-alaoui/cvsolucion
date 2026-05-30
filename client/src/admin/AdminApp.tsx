import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/i18n/i18n";
import AdminLogin from "./AdminLogin";

const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));

function AdminRouteFallback() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
      </div>
    </div>
  );
}

function AdminDashboardRoute() {
  const { loading, user, isAdmin } = useAuth();

  if (loading) return <AdminRouteFallback />;

  if (!user) {
    const next = encodeURIComponent("/admin");
    window.location.replace(`/admin/login?next=${next}`);
    return <AdminRouteFallback />;
  }

  if (!isAdmin) {
    return (
      <Suspense fallback={<AdminRouteFallback />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<AdminRouteFallback />}>
      <AdminDashboard />
    </Suspense>
  );
}

function AdminNotFound() {
  window.location.replace("/admin");
  return <AdminRouteFallback />;
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboardRoute} />
      <Route path="/admin" component={AdminDashboardRoute} />
      <Route component={AdminNotFound} />
    </Switch>
  );
}

export default function AdminApp() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <AdminRouter />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
