'use client';

import { useParams } from 'next/navigation';
import { FinanceView } from '@/components/finance/FinanceView';
import { ProtectedLayout } from '@/components/app/ProtectedLayout';

export default function FinancePage() {
  const params = useParams<{ farmId: string }>();
  return (
    <ProtectedLayout>
      <FinanceView farmId={params.farmId} />
    </ProtectedLayout>
  );
}
