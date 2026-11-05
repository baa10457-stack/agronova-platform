'use client';

import { AuthProvider } from '@/lib/auth/AuthProvider';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import type { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}
