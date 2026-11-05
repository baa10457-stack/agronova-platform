'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey, type ErrorKey } from '@/lib/errors';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isValidEmail } from '@/lib/validation';
import { AuthCard } from './AuthCard';

export function ForgotPasswordForm() {
  const t = useAppText();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<ErrorKey | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!isValidEmail(email)) {
      setEmailError(t.validation.emailInvalid);
      return;
    }
    setEmailError(null);

    setPending(true);
    const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (error) {
      setFormError(toErrorKey(error));
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard title={t.forgot.sentTitle} subtitle={t.forgot.sentText}>
        <Link href="/login" className="text-sm font-semibold text-brand-forest-700 hover:text-brand-forest-900">
          {t.forgot.back}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t.forgot.title}
      subtitle={t.forgot.subtitle}
      footer={
        <Link href="/login" className="font-semibold text-brand-forest-700 hover:text-brand-forest-900">
          {t.forgot.back}
        </Link>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {formError && <Notice tone="error">{t.common.error[formError]}</Notice>}
        <FormField
          id="forgot-email"
          label={t.forgot.email}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? t.forgot.submitting : t.forgot.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
