import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { Dictionary } from '@/i18n/dictionaries';

type ImpactSectionProps = { t: Dictionary['impact'] };

export function ImpactSection({ t }: ImpactSectionProps) {
  return (
    <section id="impact" className="scroll-mt-20 relative overflow-hidden bg-brand-forest-900 py-24 lg:py-32">
      <Container>
        <SectionHeader onDark eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />

        <div className="mt-12 flex flex-col items-center gap-4">
          <span className="inline-flex items-center rounded-full border border-brand-gold-500/40 px-4 py-1.5 text-sm font-semibold text-brand-gold-400">
            {t.badge}
          </span>
          <p className="max-w-2xl text-center text-sm leading-normal text-white/65">{t.disclaimer}</p>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {t.items.map((item) => (
            <div
              key={item.label}
              className="flex flex-col-reverse rounded-2xl border border-white/10 bg-white/5 p-8 text-center"
            >
              <dt className="mt-3 text-sm leading-normal text-white/75">{item.label}</dt>
              <dd className="text-5xl font-semibold tabular-nums text-brand-gold-400">
                <AnimatedNumber value={item.value} />
                {item.suffix}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
