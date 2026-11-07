'use client';

import { useParams } from 'next/navigation';
import { LivestockView } from '@/components/livestock/LivestockView';
import { ProtectedLayout } from '@/components/app/ProtectedLayout';

export default function LivestockPage() {
  const params = useParams<{ farmId: string }>();
  return (
    <ProtectedLayout>
      <LivestockView farmId={params.farmId} />
    </ProtectedLayout>
  );
}
