import type { Dictionary } from '@/i18n/dictionaries';

export type NavLink = { href: string; label: string };

export function getNavLinks(t: Dictionary['nav']): NavLink[] {
  return [
    { href: '#technology', label: t.technology },
    { href: '#modules', label: t.modules },
    { href: '#benefits', label: t.benefits },
    { href: '#impact', label: t.impact },
  ];
}
