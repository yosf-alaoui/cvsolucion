import AdminDashboard from "@/pages/AdminDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import DesignerDashboard from "@/pages/DesignerDashboard";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, role, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!user) return <CustomerDashboard />;
  if (role === "designer") return <DesignerDashboard />;
  if (isAdmin) return <AdminDashboard />;
  return <CustomerDashboard />;
}
