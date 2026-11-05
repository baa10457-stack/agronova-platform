'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import { revokeInvitation, type Invitation } from '@/lib/farms/members';

type InvitationsPanelProps = { invitations: Invitation[]; onRevoked: () => Promise<void> };

export function InvitationsPanel({ invitations, onRevoked }: InvitationsPanelProps) {
  const t = useAppText();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    setError(null);
    setBusyId(id);
    try {
      await revokeInvitation(id);
      await onRevoked();
    } catch (cause) {
      setError(t.common.error[toErrorKey(cause)]);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-brand-forest-100 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-brand-forest-900">{t.members.invitationsTitle}</h2>
      {error && <Notice tone="error">{error}</Notice>}
      {invitations.length === 0 && <p className="text-sm text-stone-600">{t.members.noInvitations}</p>}
      <ul className="flex flex-col divide-y divide-brand-forest-100">
        {invitations.map((invitation) => (
          <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-stone-900">{invitation.email}</span>
              <span className="text-xs text-stone-600">
                {t.roles[invitation.role]} · {t.statuses[invitation.status]} · {t.members.colExpires}{' '}
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
            {invitation.status === 'pending' && (
              <Button variant="secondary" disabled={busyId === invitation.id} onClick={() => void handleRevoke(invitation.id)} className="px-4 py-2">
                {t.common.revoke}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
