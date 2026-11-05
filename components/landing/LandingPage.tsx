'use client';

import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { EcosystemModules } from '@/components/landing/EcosystemModules';
import { Hero } from '@/components/landing/Hero';
import { ImpactSection } from '@/components/landing/ImpactSection';
import { TechnologySection } from '@/components/landing/TechnologySection';
import { useLanguage } from '@/i18n/LanguageProvider';

export function LandingPage() {
  const { dictionary: t } = useLanguage();

  return (
    <>
      <SiteHeader t={t.nav} />
      <main>
        <Hero t={t.hero} />
        <TechnologySection t={t.technology} />
        <EcosystemModules t={t.modules} />
        <BenefitsSection t={t.benefits} />
        <ImpactSection t={t.impact} />
      </main>
      <SiteFooter t={t.footer} nav={t.nav} />
    </>
  );
}
