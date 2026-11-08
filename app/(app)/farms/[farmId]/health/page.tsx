'use client';

import { useParams } from 'next/navigation';
import { HealthView } from '@/components/health/HealthView';
import { ProtectedLayout } from '@/components/app/ProtectedLayout';

export default function HealthPage() {
  const params = useParams<{ farmId: string }>();
  return (
    <ProtectedLayout>
      <HealthView farmId={params.farmId} />
    </ProtectedLayout>
  );
}
