'use client';

import { useParams } from 'next/navigation';
import { MilkView } from '@/components/milk/MilkView';
import { ProtectedLayout } from '@/components/app/ProtectedLayout';

export default function MilkPage() {
  const params = useParams<{ farmId: string }>();
  return (
    <ProtectedLayout>
      <MilkView farmId={params.farmId} />
    </ProtectedLayout>
  );
}
