'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey, type ErrorKey } from '@/lib/errors';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AuthCard } from './AuthCard';

type LinkState = 'checking' | 'valid' | 'invalid';

export function ResetPasswordForm() {
  const t = useAppText();
  const [linkState, setLinkState] = useState<LinkState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<ErrorKey | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    createSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (active) setLinkState(data.session ? 'valid' : 'invalid');
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFieldError(t.validation.passwordShort);
      return;
    }
    if (password !== confirmPassword) {
      setFieldError(t.validation.passwordMismatch);
      return;
    }
    setFieldError(null);

    setPending(true);
    const { error } = await createSupabaseBrowserClient().auth.updateUser({ password });
    setPending(false);
    if (error) {
      setFormError(toErrorKey(error));
      return;
    }
    setDone(true);
  };

  if (linkState === 'checking') {
    return <AuthCard title={t.common.loading} subtitle="" />;
  }

  if (linkState === 'invalid') {
    return (
      <AuthCard title={t.reset.invalidTitle} subtitle={t.reset.invalidText}>
        <Link href="/forgot-password" className="text-sm font-semibold text-brand-forest-700 hover:text-brand-forest-900">
          {t.reset.requestNew}
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title={t.reset.doneTitle} subtitle={t.reset.doneText}>
        <Link href="/dashboard" className="text-sm font-semibold text-brand-forest-700 hover:text-brand-forest-900">
          {t.reset.continue}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.reset.title} subtitle={t.reset.subtitle}>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {formError && <Notice tone="error">{t.common.error[formError]}</Notice>}
        <FormField
          id="reset-password"
          label={t.reset.password}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError}
        />
        <FormField
          id="reset-confirm"
          label={t.reset.confirmPassword}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? t.reset.submitting : t.reset.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
