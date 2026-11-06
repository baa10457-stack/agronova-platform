'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toErrorKey } from '@/lib/errors';
import { fetchFarm, type Farm, type FarmRole } from '@/lib/farms/farms';
import {
  fetchFarmMembers,
  fetchInvitations,
  fetchMyPermissions,
  fetchMyRole,
  type FarmMember,
  type Invitation,
  type Permission,
} from '@/lib/farms/members';
import { InvitationsPanel } from './InvitationsPanel';
import { InviteMemberForm } from './InviteMemberForm';
import { MemberRow } from './MemberRow';
import { MemberSettingsDialog } from './MemberSettingsDialog';

type MembersViewProps = { farmId: string };

export function MembersView({ farmId }: MembersViewProps) {
  const t = useAppText();
  const { user, isPlatformAdmin } = useAuth();
  const userId = user?.id ?? null;
  const [farm, setFarm] = useState<Farm | null>(null);
  const [myRole, setMyRole] = useState<FarmRole | null | undefined>(undefined);
  const [myPermissions, setMyPermissions] = useState<Permission[]>([]);
  const [members, setMembers] = useState<FarmMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = members.find((m) => m.membershipId === selectedId) ?? null;

  const canManage = isPlatformAdmin || myRole === 'owner' || myRole === 'admin';
  const canInvite = canManage || myPermissions.includes('members.manage');

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [farmData, role, permissions, memberList, invitationList] = await Promise.all([
        fetchFarm(farmId),
        fetchMyRole(farmId, userId),
        fetchMyPermissions(farmId, userId),
        fetchFarmMembers(farmId),
        fetchInvitations(farmId),
      ]);
      setFarm(farmData);
      setMyRole(role);
      setMyPermissions(permissions);
      setMembers(memberList);
      setInvitations(invitationList);
      setLoadError(null);
    } catch (cause) {
      setLoadError(t.common.error[toErrorKey(cause)]);
    }
  }, [farmId, userId, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (myRole === undefined && !loadError) {
    return <p className="text-sm text-stone-600">{t.common.loading}</p>;
  }

  if (!canInvite) {
    return (
      <div className="flex flex-col gap-6">
        <Notice tone="error">{t.members.noAccess}</Notice>
        <Link href="/dashboard" className="text-sm font-semibold text-brand-forest-700 hover:text-brand-forest-900">
          {t.members.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <Link href="/dashboard" className="text-sm font-semibold text-brand-forest-700 hover:text-brand-forest-900">
          {t.members.back}
        </Link>
        <h1 className="text-3xl font-semibold text-brand-forest-900">{farm ? `${t.members.title} : ${farm.name}` : t.members.title}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-stone-600">{t.members.subtitle}</p>
      </section>

      {loadError && <Notice tone="error">{loadError}</Notice>}

      <section className="overflow-x-auto rounded-2xl border border-brand-forest-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-forest-50 text-brand-forest-900">
            <tr>
              <th className="px-6 py-4 font-semibold">{t.members.colName}</th>
              <th className="px-6 py-4 font-semibold">{t.members.colRole}</th>
              <th className="px-6 py-4 font-semibold">{t.members.colJoined}</th>
              <th className="px-6 py-4 font-semibold">{t.members.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow
                key={member.membershipId}
                member={member}
                isSelf={member.userId === userId}
                onManage={canManage ? () => setSelectedId(member.membershipId) : undefined}
              />
            ))}
          </tbody>
        </table>
        {members.length === 0 && <p className="px-6 py-8 text-sm text-stone-600">{t.members.empty}</p>}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <InviteMemberForm farmId={farmId} isOwner={isPlatformAdmin || myRole === 'owner'} onInvited={refresh} />
        <InvitationsPanel invitations={invitations} onRevoked={refresh} />
      </div>

      {selected && canManage && (
        <MemberSettingsDialog
          member={selected}
          viewerRole={isPlatformAdmin ? 'owner' : (myRole ?? 'employee')}
          isSelf={selected.userId === userId}
          onClose={() => setSelectedId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
