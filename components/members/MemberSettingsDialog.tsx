'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { fieldClassName } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import type { FarmRole } from '@/lib/farms/farms';
import {
  PERMISSIONS,
  removeMember,
  setMemberPermission,
  setMemberRole,
  type FarmMember,
  type InvitationRole,
  type Permission,
} from '@/lib/farms/members';

type MemberSettingsDialogProps = {
  member: FarmMember;
  viewerRole: FarmRole;
  isSelf: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
};

export function MemberSettingsDialog({ member, viewerRole, isSelf, onClose, onChanged }: MemberSettingsDialogProps) {
  const t = useAppText();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const isOwnerViewer = viewerRole === 'owner';
  const roleLocked = member.role === 'owner' || (member.role === 'admin' && !isOwnerViewer);
  const permissionsEditable = member.role === 'employee' && !isSelf;

  const run = async (action: () => Promise<void>) => {
    setError(null);
    setPending(true);
    try {
      await action();
      await onChanged();
    } catch (cause) {
      setError(t.common.error[toErrorKey(cause)]);
    } finally {
      setPending(false);
    }
  };

  const handleRoleChange = (value: InvitationRole) =>
    run(() => setMemberRole(member.membershipId, value));

  const handlePermission = (permission: Permission, granted: boolean) =>
    run(() => setMemberPermission(member.membershipId, permission, granted));

  const handleRemove = () =>
    run(async () => {
      await removeMember(member.membershipId);
      onClose();
    });

  const role = member.role === 'admin' ? 'admin' : 'employee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-forest-900/50 px-6" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-6 overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-brand-forest-900">{t.members.settingsTitle}</h2>
          <p className="text-sm text-stone-600">{member.fullName ?? t.common.notSet}</p>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        {roleLocked && <Notice tone="info">{member.role === 'admin' ? t.members.adminOnlyOwner : t.members.ownerLocked}</Notice>}
        {isSelf && <Notice tone="info">{t.members.selfLocked}</Notice>}

        <div className="flex flex-col gap-2">
          <label htmlFor="member-role" className="text-sm font-medium text-brand-forest-900">
            {t.members.settingsRole}
          </label>
          <select
            id="member-role"
            value={role}
            disabled={roleLocked || pending}
            onChange={(e) => void handleRoleChange(e.target.value as InvitationRole)}
            className={`${fieldClassName} border-brand-forest-200`}
          >
            <option value="employee">{t.roles.employee}</option>
            {isOwnerViewer && <option value="admin">{t.roles.admin}</option>}
          </select>
        </div>

        {member.role === 'employee' && (
          <fieldset className="flex flex-col gap-4">
            <legend className="text-sm font-medium text-brand-forest-900">{t.members.settingsPermissions}</legend>
            <p className="text-xs text-stone-600">{t.members.settingsPermissionsHint}</p>
            {PERMISSIONS.map((permission) => (
              <label key={permission} className="flex items-center justify-between gap-4 text-sm text-stone-800">
                {t.members.permissions[permission]}
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-brand-forest-700"
                  checked={member.permissions[permission] === true}
                  disabled={!permissionsEditable || pending}
                  onChange={(e) => void handlePermission(permission, e.target.checked)}
                />
              </label>
            ))}
          </fieldset>
        )}

        <div className="flex flex-col gap-4 border-t border-brand-forest-100 pt-6">
          {!confirmingRemoval ? (
            <Button variant="danger" disabled={roleLocked || isSelf || pending} onClick={() => setConfirmingRemoval(true)} className="self-start">
              {t.members.removeMember}
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-stone-900">{t.members.removeTitle}</p>
              <p className="text-sm text-stone-600">{t.members.removeText}</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="danger" disabled={pending} onClick={() => void handleRemove()}>
                  {t.common.confirm}
                </Button>
                <Button variant="secondary" onClick={() => setConfirmingRemoval(false)}>
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t.common.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
