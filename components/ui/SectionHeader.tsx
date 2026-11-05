type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onDark?: boolean;
  align?: 'left' | 'center';
};

export function SectionHeader({ eyebrow, title, subtitle, onDark = false, align = 'center' }: SectionHeaderProps) {
  return (
    <div className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      <p
        className={`text-sm font-semibold uppercase tracking-[0.18em] ${
          onDark ? 'text-brand-gold-400' : 'text-brand-forest-600'
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-4 text-4xl font-semibold leading-[1.2] tracking-tight lg:text-5xl ${
          onDark ? 'text-white' : 'text-brand-forest-900'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-6 text-lg leading-normal ${onDark ? 'text-white/75' : 'text-stone-600'}`}>{subtitle}</p>
      )}
    </div>
  );
}
