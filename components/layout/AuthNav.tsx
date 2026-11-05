'use client';

import Link from 'next/link';
import { useAppText } from '@/i18n/useAppText';
import { useAuth } from '@/lib/auth/AuthProvider';

type AuthNavProps = { variant: 'desktop' | 'mobile'; onDark?: boolean; onNavigate?: () => void };

const PILL_BASE =
  'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition-colors duration-200 sm:px-5 sm:py-2.5 sm:text-sm';
const PRIMARY_PILL =
  'inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-brand-forest-700 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-brand-forest-800 sm:px-5 sm:py-2.5 sm:text-sm';

export function AuthNav({ variant, onDark = false, onNavigate }: AuthNavProps) {
  const t = useAppText();
  const { user, loading, signOut } = useAuth();

  if (loading) return null;

  const handleSignOut = async () => {
    await signOut();
    onNavigate?.();
  };

  if (variant === 'mobile') {
    if (!user) {
      return (
        <div className="mt-4 flex flex-col gap-3">
          <Link href="/login" onClick={onNavigate} className="rounded-full border border-brand-forest-200 px-5 py-3 text-center text-sm font-semibold text-brand-forest-900">
            {t.nav.login}
          </Link>
          <Link href="/signup" onClick={onNavigate} className="rounded-full bg-brand-forest-700 px-5 py-3 text-center text-sm font-semibold text-white">
            {t.nav.signup}
          </Link>
        </div>
      );
    }
    return (
      <div className="mt-4 flex flex-col gap-3">
        <p className="text-sm text-stone-600">
          {t.nav.account} <span className="font-semibold text-brand-forest-900">{displayName(user)}</span>
        </p>
        <Link href="/dashboard" onClick={onNavigate} className="rounded-full bg-brand-forest-700 px-5 py-3 text-center text-sm font-semibold text-white">
          {t.nav.dashboard}
        </Link>
        <button type="button" onClick={() => void handleSignOut()} className="rounded-full border border-brand-forest-200 px-5 py-3 text-sm font-semibold text-brand-forest-900">
          {t.nav.signOut}
        </button>
      </div>
    );
  }

  const outlineClass = onDark
    ? 'border-white/50 text-white hover:bg-white/10'
    : 'border-brand-forest-200 text-brand-forest-900 hover:bg-brand-forest-50';

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/login" className={`${PILL_BASE} ${outlineClass}`}>
          {t.nav.login}
        </Link>
        <Link href="/signup" className={PRIMARY_PILL}>
          {t.nav.signup}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span
        className={`hidden max-w-[10rem] truncate text-sm font-semibold lg:block ${onDark ? 'text-white' : 'text-brand-forest-900'}`}
        title={displayName(user)}
      >
        {displayName(user)}
      </span>
      <Link href="/dashboard" className={`${PILL_BASE} ${outlineClass}`}>
        {t.nav.dashboard}
      </Link>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className={`shrink-0 whitespace-nowrap rounded-full px-2 py-2 text-xs font-medium transition-colors duration-200 sm:px-3 sm:text-sm ${onDark ? 'text-white/85 hover:text-brand-gold-400' : 'text-brand-forest-700 hover:text-brand-forest-900'}`}
      >
        {t.nav.signOut}
      </button>
    </div>
  );
}

function displayName(user: { email?: string; user_metadata: Record<string, unknown> }): string {
  const fullName = typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  return fullName || user.email || '';
}
