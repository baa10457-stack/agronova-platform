import type { InputHTMLAttributes } from 'react';

export const fieldClassName =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm text-stone-900 outline-none transition-colors duration-200 placeholder:text-stone-400 focus:border-brand-gold-500 focus:ring-2 focus:ring-brand-gold-500/30 disabled:bg-stone-100';

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string | null;
};

export function FormField({ id, label, error, className = '', ...inputProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-brand-forest-900">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${fieldClassName} ${error ? 'border-red-400' : 'border-brand-forest-200'} ${className}`}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
