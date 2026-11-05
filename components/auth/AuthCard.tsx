import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/layout/Logo';

type AuthCardProps = { title: string; subtitle: string; children?: ReactNode; footer?: ReactNode };

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-forest-50 px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 flex justify-center">
          <Logo onDark={false} />
        </Link>
        <div className="rounded-2xl border border-brand-forest-100 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-2xl font-semibold leading-tight text-brand-forest-900">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-stone-600">{footer}</div>}
      </div>
    </main>
  );
}
