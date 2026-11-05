'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Logo } from '@/components/layout/Logo';
import { getNavLinks } from '@/components/layout/navLinks';
import type { Dictionary } from '@/i18n/dictionaries';

type SiteHeaderProps = { t: Dictionary['nav'] };

export function SiteHeader({ t }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || menuOpen;
  const links = getNavLinks(t);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? 'bg-white/95 shadow-sm backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <Container>
        <div className="flex h-20 items-center justify-between">
          <Link href="#top" aria-label={t.home} onClick={closeMenu}>
            <Logo onDark={!solid} />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  solid
                    ? 'text-brand-forest-800 hover:text-brand-forest-600'
                    : 'text-white/85 hover:text-brand-gold-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher onDark={!solid} />
            <Link
              href="#modules"
              className="hidden rounded-full bg-brand-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-forest-900 transition-colors duration-200 hover:bg-brand-gold-400 md:inline-flex"
            >
              {t.cta}
            </Link>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t.closeMenu : t.openMenu}
              onClick={() => setMenuOpen((open) => !open)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors md:hidden ${
                solid ? 'text-brand-forest-900 hover:bg-brand-forest-50' : 'text-white hover:bg-white/10'
              }`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
      </Container>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-brand-forest-100 bg-white md:hidden">
          <Container>
            <nav aria-label="Mobile" className="flex flex-col py-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="border-b border-stone-100 py-4 text-base font-medium text-brand-forest-900"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="#modules"
                onClick={closeMenu}
                className="mt-6 rounded-full bg-brand-gold-500 px-5 py-3 text-center text-sm font-semibold text-brand-forest-900"
              >
                {t.cta}
              </Link>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
