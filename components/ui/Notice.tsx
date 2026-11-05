import type { ReactNode } from 'react';

const TONES = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-brand-forest-200 bg-brand-forest-50 text-brand-forest-900',
  info: 'border-brand-gold-500/40 bg-brand-gold-500/10 text-brand-forest-900',
} as const;

type NoticeProps = { tone: keyof typeof TONES; children: ReactNode };

export function Notice({ tone, children }: NoticeProps) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${TONES[tone]}`}>
      {children}
    </div>
  );
}
