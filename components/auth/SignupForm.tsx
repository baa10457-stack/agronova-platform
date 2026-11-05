'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey, type ErrorKey } from '@/lib/errors';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import { AuthCard } from './AuthCard';

type FieldErrors = Partial<Record<'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword', string>>;

export function SignupForm() {
  const t = useAppText();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<ErrorKey | null>(null);
  const [pending, setPending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (fullName.trim().length < 2) errors.fullName = t.validation.nameShort;
    if (!isValidEmail(email)) errors.email = t.validation.emailInvalid;
    if (!isValidPhone(phone)) errors.phone = t.validation.phoneInvalid;
    if (password.length < 8) errors.password = t.validation.passwordShort;
    if (confirmPassword !== password) errors.confirmPassword = t.validation.passwordMismatch;
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    const { data, error } = await createSupabaseBrowserClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), phone: phone.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setPending(false);

    if (error) {
      setFormError(toErrorKey(error));
      return;
    }
    if (data.session) {
      router.replace('/dashboard');
      return;
    }
    setAwaitingConfirmation(true);
  };

  if (awaitingConfirmation) {
    return (
      <AuthCard title={t.signup.confirmTitle} subtitle={t.signup.confirmText}>
        <Link href="/login" className="text-sm font-semibold text-brand-forest-700 hover:text-brand-forest-900">
          {t.signup.login}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t.signup.title}
      subtitle={t.signup.subtitle}
      footer={
        <>
          {t.signup.haveAccount}{' '}
          <Link href="/login" className="font-semibold text-brand-forest-700 hover:text-brand-forest-900">
            {t.signup.login}
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {formError && <Notice tone="error">{t.common.error[formError]}</Notice>}
        <FormField
          id="signup-name"
          label={t.signup.fullName}
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={fieldErrors.fullName}
        />
        <FormField
          id="signup-email"
          label={t.signup.email}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          id="signup-phone"
          label={t.signup.phone}
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={fieldErrors.phone}
        />
        <FormField
          id="signup-password"
          label={t.signup.password}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <FormField
          id="signup-confirm"
          label={t.signup.confirmPassword}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />
        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? t.signup.submitting : t.signup.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
