import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import type { Dictionary } from '@/i18n/dictionaries';

const HERO_IMAGE_URL =
  'https://images.pexels.com/photos/7457537/pexels-photo-7457537.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

type HeroProps = { t: Dictionary['hero'] };

export function Hero({ t }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden bg-brand-forest-900 pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(212,175,55,0.14),transparent_45%)]"
      />
      <Container>
        <div className="relative grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold-500/40 bg-white/5 px-4 py-1.5 text-sm font-semibold text-brand-gold-400">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gold-500" />
              {t.badge}
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.15] tracking-tight text-white lg:text-6xl">
              {t.titleLead}{' '}
              <span className="text-brand-gold-400">{t.titleHighlight}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-normal text-white/80">{t.subtitle}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="#modules"
                className="inline-flex items-center rounded-full bg-brand-gold-500 px-7 py-3.5 text-sm font-semibold text-brand-forest-900 shadow-lg shadow-black/20 transition-colors duration-200 hover:bg-brand-gold-400"
              >
                {t.primaryCta}
              </Link>
              <Link
                href="#technology"
                className="inline-flex items-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
              >
                {t.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
              <Image
                src={HERO_IMAGE_URL}
                alt={t.imageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
