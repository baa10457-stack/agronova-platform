import { Container } from '@/components/ui/Container';
import { ModuleIcon } from '@/components/ui/ModuleIcon';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { Dictionary } from '@/i18n/dictionaries';

type EcosystemModulesProps = { t: Dictionary['modules'] };

export function EcosystemModules({ t }: EcosystemModulesProps) {
  return (
    <section id="modules" className="scroll-mt-20 bg-stone-50 py-24 lg:py-32">
      <Container>
        <SectionHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {t.items.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-8 transition duration-300 hover:-translate-y-1 hover:border-brand-gold-500 hover:shadow-xl hover:shadow-brand-forest-900/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-forest-50 text-brand-forest-700 transition-colors duration-300 group-hover:bg-brand-forest-700 group-hover:text-white">
                <ModuleIcon id={item.id} className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-brand-forest-900">{item.title}</h3>
              <p className="mt-3 leading-normal text-stone-600">{item.description}</p>
              <ul className="mt-6 space-y-2 border-t border-stone-100 pt-6">
                {item.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-3 text-sm text-stone-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-gold-500" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
