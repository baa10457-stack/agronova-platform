'use client';

import { useLanguage } from '@/i18n/LanguageProvider';
import type { Language } from '@/i18n/dictionaries';

const OPTIONS: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
];

type LanguageSwitcherProps = { onDark: boolean };

export function LanguageSwitcher({ onDark }: LanguageSwitcherProps) {
  const { language, setLanguage, dictionary } = useLanguage();

  return (
    <div
      role="group"
      aria-label={dictionary.nav.language}
      className={`inline-flex rounded-full border p-1 text-xs font-semibold ${
        onDark ? 'border-white/25' : 'border-brand-forest-200'
      }`}
    >
      {OPTIONS.map((option) => {
        const active = option.code === language;
        return (
          <button
            key={option.code}
            type="button"
            aria-pressed={active}
            onClick={() => setLanguage(option.code)}
            className={`rounded-full px-3 py-1.5 transition-colors duration-200 ${
              active
                ? 'bg-brand-gold-500 text-brand-forest-900'
                : onDark
                  ? 'text-white/80 hover:text-white'
                  : 'text-brand-forest-700 hover:text-brand-forest-900'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
