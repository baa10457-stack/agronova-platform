import { LandingPage } from '@/components/landing/LandingPage';
import { AppProviders } from '@/components/app/AppProviders';

export default function HomePage() {
  return (
    <AppProviders>
      <LandingPage />
    </AppProviders>
  );
}
