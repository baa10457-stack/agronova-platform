import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { Dictionary } from '@/i18n/dictionaries';

type BenefitsSectionProps = { t: Dictionary['benefits'] };

export function BenefitsSection({ t }: BenefitsSectionProps) {
  return (
    <section id="benefits" className="scroll-mt-20 bg-white py-24 lg:py-32">
      <Container>
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
            <SectionHeader align="left" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
            <Link
              href="#modules"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-brand-forest-900 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-forest-600"
            >
              {t.cta}
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
            {t.items.map((item, index) => (
              <article
                key={item.title}
                className="group rounded-2xl bg-stone-50 p-8 ring-1 ring-stone-200/70 transition duration-300 hover:-translate-y-1 hover:bg-white hover:ring-brand-gold-500 hover:shadow-xl hover:shadow-brand-forest-900/5"
              >
                <p className="text-sm font-semibold text-brand-forest-600">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-4 text-xl font-semibold text-brand-forest-900">{item.title}</h3>
                <p className="mt-4 leading-normal text-stone-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
