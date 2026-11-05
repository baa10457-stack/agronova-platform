'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { useAuth } from '@/lib/auth/AuthProvider';
import { homePathFor, safeNextPath } from '@/lib/auth/routes';
import { toErrorKey, type ErrorKey } from '@/lib/errors';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isValidEmail } from '@/lib/validation';
import { AuthCard } from './AuthCard';

export function LoginForm() {
  const t = useAppText();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<ErrorKey | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(safeNextPath(readNext()) ?? '/dashboard');
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!isValidEmail(email)) {
      setEmailError(t.validation.emailInvalid);
      return;
    }
    setEmailError(null);

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setPending(false);
      setFormError(toErrorKey(error));
      return;
    }

    const { data: isAdmin, error: roleError } = await supabase.rpc('is_platform_admin');
    setPending(false);
    if (roleError) {
      setFormError(toErrorKey(roleError));
      return;
    }
    router.replace(safeNextPath(readNext()) ?? homePathFor(isAdmin === true));
  };

  return (
    <AuthCard
      title={t.login.title}
      subtitle={t.login.subtitle}
      footer={
        <>
          {t.login.noAccount}{' '}
          <Link href="/signup" className="font-semibold text-brand-forest-700 hover:text-brand-forest-900">
            {t.login.createAccount}
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {formError && <Notice tone="error">{t.common.error[formError]}</Notice>}
        <FormField
          id="login-email"
          label={t.login.email}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
        />
        <FormField
          id="login-password"
          label={t.login.password}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-brand-forest-700 hover:text-brand-forest-900">
            {t.login.forgot}
          </Link>
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? t.login.submitting : t.login.submit}
        </Button>
      </form>
    </AuthCard>
  );
}

function readNext(): string | null {
  return new URLSearchParams(window.location.search).get('next');
}
