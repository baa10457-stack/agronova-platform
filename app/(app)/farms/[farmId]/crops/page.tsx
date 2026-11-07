'use client';

import { useParams } from 'next/navigation';
import { CropsView } from '@/components/crops/CropsView';
import { ProtectedLayout } from '@/components/app/ProtectedLayout';

export default function CropsPage() {
  const params = useParams<{ farmId: string }>();
  return (
    <ProtectedLayout>
      <CropsView farmId={params.farmId} />
    </ProtectedLayout>
  );
}
