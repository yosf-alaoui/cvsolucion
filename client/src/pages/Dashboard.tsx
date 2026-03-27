import AdminDashboard from "@/pages/AdminDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!user) return <CustomerDashboard />;
  if (isAdmin) return <AdminDashboard />;
  return <CustomerDashboard />;
}
