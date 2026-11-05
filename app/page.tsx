import { LandingPage } from '@/components/landing/LandingPage';
import { LanguageProvider } from '@/i18n/LanguageProvider';

export default function HomePage() {
  return (
    <LanguageProvider>
      <LandingPage />
    </LanguageProvider>
  );
}
