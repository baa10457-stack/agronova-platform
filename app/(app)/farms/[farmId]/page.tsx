'use client';

import { useParams } from 'next/navigation';
import { FarmOverviewView } from '@/components/farm/FarmOverviewView';
import { ProtectedLayout } from '@/components/app/ProtectedLayout';

export default function FarmOverviewPage() {
  const params = useParams<{ farmId: string }>();
  return (
    <ProtectedLayout>
      <FarmOverviewView farmId={params.farmId} />
    </ProtectedLayout>
  );
}
