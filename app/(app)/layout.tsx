import type { ReactNode } from 'react';
import { AppProviders } from '@/components/app/AppProviders';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
