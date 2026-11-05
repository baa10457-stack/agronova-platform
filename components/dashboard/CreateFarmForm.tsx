'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, fieldClassName } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { createFarm, type CreateFarmInput } from '@/lib/farms/farms';
import { toErrorKey, type ErrorKey } from '@/lib/errors';
import { isValidEmail, isValidPhone } from '@/lib/validation';

type CreateFarmFormProps = { onCreated: () => void; onCancel?: () => void };

const EMPTY_INPUT: CreateFarmInput = { name: '', address: '', location: '', phone: '', email: '', description: '' };

export function CreateFarmForm({ onCreated, onCancel }: CreateFarmFormProps) {
  const t = useAppText();
  const [input, setInput] = useState<CreateFarmInput>(EMPTY_INPUT);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateFarmInput, string>>>({});
  const [formError, setFormError] = useState<ErrorKey | null>(null);
  const [pending, setPending] = useState(false);

  const update = (field: keyof CreateFarmInput) => (value: string) => setInput((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (input.name.trim().length < 2) nextErrors.name = t.validation.nameShort;
    if (input.email.trim() !== '' && !isValidEmail(input.email)) nextErrors.email = t.validation.emailInvalid;
    if (!isValidPhone(input.phone)) nextErrors.phone = t.validation.phoneInvalid;
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      await createFarm(input);
      setInput(EMPTY_INPUT);
      onCreated();
    } catch (cause) {
      setFormError(toErrorKey(cause));
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {formError && <Notice tone="error">{t.common.error[formError]}</Notice>}
      <div className="grid gap-5 md:grid-cols-2">
        <FormField id="farm-name" label={t.dashboard.name} value={input.name} onChange={(e) => update('name')(e.target.value)} error={errors.name} />
        <FormField id="farm-address" label={t.dashboard.address} value={input.address} onChange={(e) => update('address')(e.target.value)} />
        <FormField id="farm-location" label={t.dashboard.location} value={input.location} onChange={(e) => update('location')(e.target.value)} />
        <FormField id="farm-phone" label={t.dashboard.phone} type="tel" value={input.phone} onChange={(e) => update('phone')(e.target.value)} error={errors.phone} />
        <FormField id="farm-email" label={t.dashboard.email} type="email" value={input.email} onChange={(e) => update('email')(e.target.value)} error={errors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="farm-description" className="text-sm font-medium text-brand-forest-900">
          {t.dashboard.description}
        </label>
        <textarea
          id="farm-description"
          rows={4}
          value={input.description}
          onChange={(e) => update('description')(e.target.value)}
          className={`${fieldClassName} border-brand-forest-200 resize-y`}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? t.dashboard.creating : t.dashboard.createSubmit}
        </Button>
      </div>
    </form>
  );
}
