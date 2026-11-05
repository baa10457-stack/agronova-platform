import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Logo } from '@/components/layout/Logo';
import { getNavLinks } from '@/components/layout/navLinks';
import type { Dictionary } from '@/i18n/dictionaries';

type SiteFooterProps = {
  t: Dictionary['footer'];
  nav: Dictionary['nav'];
};

export function SiteFooter({ t, nav }: SiteFooterProps) {
  const links = getNavLinks(nav);

  return (
    <footer className="bg-brand-forest-950 py-16 text-white/80">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo onDark />
            <p className="mt-6 max-w-sm leading-normal text-white/70">{t.tagline}</p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 lg:col-span-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/80 transition-colors duration-200 hover:text-brand-gold-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col items-start gap-6 lg:col-span-3 lg:items-end">
            <Link
              href="#top"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors duration-200 hover:text-brand-gold-400"
            >
              {t.backToTop}
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </Link>
            <LanguageSwitcher onDark />
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-sm text-white/60">
          © {new Date().getFullYear()} AGRONOVA. {t.rights}
        </div>
      </Container>
    </footer>
  );
}
