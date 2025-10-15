import DashboardLayout from "@/app/dashboard/_components/DashboardLayout";
import { TabRouter } from "./_components/TabRouter";
import { requireAuth, type ServerUser } from "@/lib/auth-server";

export default async function DashboardPage() {
  // Server-side authentication check - will redirect if not authenticated
  const user = await requireAuth();

  return (
    <DashboardLayout user={user}>
      <TabRouter />
    </DashboardLayout>
  );
}
