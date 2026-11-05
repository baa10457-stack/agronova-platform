'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ProtectedLayout } from '@/components/app/ProtectedLayout';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import { acceptInvitation } from '@/lib/farms/members';

function AcceptInvitationView() {
  const t = useAppText();
  const token = useSearchParams().get('token')?.trim() ?? '';
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleAccept = async () => {
    setError(null);
    setPending(true);
    try {
      await acceptInvitation(token);
      setDone(true);
    } catch (cause) {
      setError(t.common.error[toErrorKey(cause)]);
    } finally {
      setPending(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold text-brand-forest-900">{t.accept.title}</h1>
        <Notice tone="error">{t.accept.missing}</Notice>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold text-brand-forest-900">{t.accept.doneTitle}</h1>
        <p className="text-base leading-relaxed text-stone-600">{t.accept.doneText}</p>
        <Link href="/dashboard" className="text-sm font-semibold text-brand-forest-700 hover:text-brand-forest-900">
          {t.accept.goDashboard}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-semibold text-brand-forest-900">{t.accept.title}</h1>
      <p className="text-base leading-relaxed text-stone-600">{t.accept.subtitle}</p>
      {error && <Notice tone="error">{error}</Notice>}
      <Button onClick={() => void handleAccept()} disabled={pending} className="self-start">
        {pending ? t.accept.accepting : t.accept.accept}
      </Button>
    </div>
  );
}

export function AcceptInvitationPage() {
  return (
    <ProtectedLayout>
      <AcceptInvitationView />
    </ProtectedLayout>
  );
}
