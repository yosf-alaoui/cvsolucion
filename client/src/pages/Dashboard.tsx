import { lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";

const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const CustomerDashboard = lazy(() => import("@/pages/CustomerDashboard"));
const DesignerDashboard = lazy(() => import("@/pages/DesignerDashboard"));
const TrainerDashboard = lazy(() => import("@/pages/TrainerDashboard"));

export default function Dashboard() {
  const { user, role, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!user) return <CustomerDashboard />;
  if (role === "designer") return <DesignerDashboard />;
  if (role === "trainer") return <TrainerDashboard />;
  if (isAdmin) return <AdminDashboard />;
  return <CustomerDashboard />;
}
