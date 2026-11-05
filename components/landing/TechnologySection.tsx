import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { Dictionary } from '@/i18n/dictionaries';

type TechnologySectionProps = { t: Dictionary['technology'] };

export function TechnologySection({ t }: TechnologySectionProps) {
  return (
    <section id="technology" className="scroll-mt-20 bg-white py-24 lg:py-32">
      <Container>
        <SectionHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {t.pillars.map((pillar, index) => (
            <article
              key={pillar.title}
              className="group rounded-2xl border border-brand-forest-100 bg-white p-8 transition duration-300 hover:-translate-y-1 hover:border-brand-gold-500/60 hover:shadow-xl hover:shadow-brand-forest-900/5"
            >
              <span className="block h-1 w-12 rounded-full bg-brand-gold-500 transition-all duration-300 group-hover:w-20" />
              <p className="mt-6 text-sm font-semibold text-brand-forest-600">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 text-xl font-semibold text-brand-forest-900">{pillar.title}</h3>
              <p className="mt-4 leading-normal text-stone-600">{pillar.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
