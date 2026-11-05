'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { useAppText } from '@/i18n/useAppText';
import { useAuth } from '@/lib/auth/AuthProvider';

type ProtectedLayoutProps = { children: ReactNode; requirePlatformAdmin?: boolean };

export function ProtectedLayout({ children, requirePlatformAdmin = false }: ProtectedLayoutProps) {
  const t = useAppText();
  const router = useRouter();
  const { user, loading, isPlatformAdmin, signOut } = useAuth();

  const allowed = Boolean(user) && (!requirePlatformAdmin || isPlatformAdmin);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } else if (requirePlatformAdmin && !isPlatformAdmin) {
      router.replace('/dashboard');
    }
  }, [loading, user, isPlatformAdmin, requirePlatformAdmin, router]);

  if (loading || !allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-sm text-stone-600">{t.common.loading}</p>
      </main>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-brand-forest-100 bg-white">
        <Container>
          <div className="flex h-20 items-center justify-between gap-4">
            <Link href="/dashboard" aria-label={t.common.dashboard}>
              <Logo onDark={false} />
            </Link>
            <nav aria-label="Workspace" className="hidden items-center gap-6 md:flex">
              <Link href="/dashboard" className="text-sm font-medium text-brand-forest-800 hover:text-brand-forest-600">
                {t.common.dashboard}
              </Link>
              {isPlatformAdmin && (
                <Link href="/admin" className="text-sm font-medium text-brand-forest-800 hover:text-brand-forest-600">
                  {t.common.administration}
                </Link>
              )}
            </nav>
            <div className="flex items-center gap-4">
              <LanguageSwitcher onDark={false} />
              <Button variant="secondary" onClick={handleSignOut} className="px-4 py-2">
                {t.common.signOut}
              </Button>
            </div>
          </div>
        </Container>
      </header>
      <Container>
        <div className="py-12">{children}</div>
      </Container>
    </div>
  );
}
