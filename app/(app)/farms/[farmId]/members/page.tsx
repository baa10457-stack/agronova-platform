'use client';

import { useParams } from 'next/navigation';
import { MembersView } from '@/components/members/MembersView';
import { ProtectedLayout } from '@/components/app/ProtectedLayout';

export default function FarmMembersPage() {
  const params = useParams<{ farmId: string }>();
  return (
    <ProtectedLayout>
      <MembersView farmId={params.farmId} />
    </ProtectedLayout>
  );
}
