import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-gold-500 text-brand-forest-900 hover:bg-brand-gold-400',
  secondary: 'border border-brand-forest-200 bg-white text-brand-forest-900 hover:bg-brand-forest-50',
  danger: 'bg-red-700 text-white hover:bg-red-800',
};

export function buttonClassName(variant: ButtonVariant = 'primary'): string {
  return `inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`${buttonClassName(variant)} ${className}`} {...props} />;
}
