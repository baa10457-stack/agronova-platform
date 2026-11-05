'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, fieldClassName } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { invitationEmailConfigured } from '@/lib/invitations/delivery';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey, type ErrorKey } from '@/lib/errors';
import { createInvitation, type InvitationRole } from '@/lib/farms/members';
import { isValidEmail } from '@/lib/validation';

type InviteMemberFormProps = { farmId: string; isOwner: boolean; onInvited: () => Promise<void> };

export function InviteMemberForm({ farmId, isOwner, onInvited }: InviteMemberFormProps) {
  const t = useAppText();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitationRole>('employee');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<ErrorKey | null>(null);
  const [pending, setPending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!isValidEmail(email)) {
      setEmailError(t.validation.emailInvalid);
      return;
    }
    setEmailError(null);

    setPending(true);
    try {
      const token = await createInvitation(farmId, email.trim(), role);
      setInviteLink(`${window.location.origin}/invite?token=${encodeURIComponent(token)}`);
      setEmail('');
      await onInvited();
    } catch (cause) {
      setFormError(toErrorKey(cause));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-brand-forest-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-brand-forest-900">{t.members.inviteTitle}</h2>
        <p className="text-sm leading-relaxed text-stone-600">{t.members.inviteSubtitle}</p>
      </div>

      {!invitationEmailConfigured && <Notice tone="info">{t.members.notConfigured}</Notice>}
      {formError && <Notice tone="error">{t.common.error[formError]}</Notice>}

      {inviteLink && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-brand-forest-900">{t.members.inviteLink}</p>
          <code className="break-all rounded-xl bg-brand-forest-50 px-4 py-3 text-xs text-brand-forest-900">{inviteLink}</code>
          <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(inviteLink)} className="self-start">
            {t.common.copy}
          </Button>
        </div>
      )}

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <FormField id="invite-email" label={t.members.inviteEmail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} />
        <div className="flex flex-col gap-2">
          <label htmlFor="invite-role" className="text-sm font-medium text-brand-forest-900">
            {t.members.inviteRole}
          </label>
          <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as InvitationRole)} className={`${fieldClassName} border-brand-forest-200`}>
            <option value="employee">{t.roles.employee}</option>
            {isOwner && <option value="admin">{t.roles.admin}</option>}
          </select>
        </div>
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? t.members.inviting : t.members.inviteSubmit}
        </Button>
      </form>
    </section>
  );
}
