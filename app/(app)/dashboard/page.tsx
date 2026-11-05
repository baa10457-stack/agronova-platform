import { DashboardView } from '@/components/dashboard/DashboardView';
import { ProtectedLayout } from '@/components/app/ProtectedLayout';

export default function DashboardPage() {
  return (
    <ProtectedLayout>
      <DashboardView />
    </ProtectedLayout>
  );
}
