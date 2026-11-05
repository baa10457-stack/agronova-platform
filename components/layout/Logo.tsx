type LogoProps = { onDark: boolean };

export function Logo({ onDark }: LogoProps) {
  return (
    <span className="flex items-center gap-3">
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8">
        <path d="M16 3c7 4 9 10 9 16 0 4-3 8-9 10-6-2-9-6-9-10 0-6 2-12 9-16z" className="fill-brand-gold-500" />
        <path d="M16 9v18" className="stroke-brand-forest-900" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
      <span
        className={`text-lg font-semibold tracking-[0.18em] ${onDark ? 'text-white' : 'text-brand-forest-900'}`}
      >
        AGRONOVA
      </span>
    </span>
  );
}
