'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, fieldClassName } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import { localDay } from '@/lib/milk/milk';
import type { Animal } from '@/lib/livestock/animals';
import {
  createHealthRecord,
  HEALTH_RECORD_TYPES,
  updateHealthRecord,
  type HealthRecord,
  type HealthRecordInput,
  type HealthRecordType,
} from '@/lib/health/health';

type HealthRecordFormDialogProps = {
  farmId: string;
  animals: Animal[];
  record: HealthRecord | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function HealthRecordFormDialog({ farmId, animals, record, onClose, onSaved }: HealthRecordFormDialogProps) {
  const t = useAppText();
  const [animalId, setAnimalId] = useState(record?.animal_id ?? '');
  const [recordType, setRecordType] = useState<HealthRecordType>(record?.record_type ?? 'checkup');
  const [recordDate, setRecordDate] = useState(record?.record_date ?? localDay(new Date()));
  const [title, setTitle] = useState(record?.title ?? '');
  const [product, setProduct] = useState(record?.product ?? '');
  const [withdrawalEnd, setWithdrawalEnd] = useState(record?.withdrawal_end_date ?? '');
  const [notes, setNotes] = useState(record?.notes ?? '');
  const [animalError, setAnimalError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const animal = animals.find((item) => item.id === animalId);
    const dateValid = recordDate !== '';
    const withdrawalValid = withdrawalEnd === '' || (dateValid && withdrawalEnd >= recordDate);

    setAnimalError(animal ? null : t.common.required);
    setDateError(dateValid ? null : t.common.required);
    setTitleError(title.trim() === '' ? t.common.required : null);
    setWithdrawalError(withdrawalValid ? null : t.health.withdrawalInvalid);
    if (!animal || !dateValid || title.trim() === '' || !withdrawalValid) return;

    const input: HealthRecordInput = {
      animal_id: animal.id,
      animal_tag: animal.tag_number,
      record_type: recordType,
      record_date: recordDate,
      title: title.trim(),
      product: optional(product),
      withdrawal_end_date: optional(withdrawalEnd),
      notes: optional(notes),
    };

    setPending(true);
    try {
      if (record) {
        await updateHealthRecord(record.id, input);
      } else {
        await createHealthRecord(farmId, input);
      }
      await onSaved();
    } catch (cause) {
      setError(t.common.error[toErrorKey(cause)]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-forest-900/50 px-6" role="dialog" aria-modal="true">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-6 overflow-y-auto rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-brand-forest-900">{record ? t.health.formEdit : t.health.formNew}</h2>
          <p className="text-sm text-stone-600">{t.health.formSubtitle}</p>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="flex flex-col gap-2">
          <label htmlFor="health-animal" className="text-sm font-medium text-brand-forest-900">
            {t.health.animal}
          </label>
          <select
            id="health-animal"
            value={animalId}
            onChange={(e) => setAnimalId(e.target.value)}
            disabled={pending}
            aria-invalid={Boolean(animalError)}
            className={`${fieldClassName} ${animalError ? 'border-red-400' : 'border-brand-forest-200'}`}
          >
            <option value="" disabled>
              {t.health.chooseAnimal}
            </option>
            {animals.map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.tag_number}
                {animal.name ? ` · ${animal.name}` : ''}
              </option>
            ))}
          </select>
          {animalError && <p className="text-sm text-red-700">{animalError}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="health-type" className="text-sm font-medium text-brand-forest-900">
            {t.health.type}
          </label>
          <select
            id="health-type"
            value={recordType}
            onChange={(e) => setRecordType(e.target.value as HealthRecordType)}
            disabled={pending}
            className={`${fieldClassName} border-brand-forest-200`}
          >
            {HEALTH_RECORD_TYPES.map((type) => (
              <option key={type} value={type}>
                {t.health.types[type]}
              </option>
            ))}
          </select>
        </div>

        <FormField
          id="health-date"
          type="date"
          label={t.health.recordDate}
          value={recordDate}
          onChange={(e) => setRecordDate(e.target.value)}
          error={dateError}
          disabled={pending}
        />
        <FormField
          id="health-title"
          label={t.health.titleLabel}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={titleError}
          maxLength={120}
          disabled={pending}
        />
        <FormField
          id="health-product"
          label={t.health.product}
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          maxLength={120}
          disabled={pending}
        />
        <FormField
          id="health-withdrawal"
          type="date"
          label={t.health.withdrawalEnd}
          value={withdrawalEnd}
          onChange={(e) => setWithdrawalEnd(e.target.value)}
          error={withdrawalError}
          disabled={pending}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="health-notes" className="text-sm font-medium text-brand-forest-900">
            {t.health.notes}
          </label>
          <textarea
            id="health-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={3}
            disabled={pending}
            className={`${fieldClassName} resize-y border-brand-forest-200`}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? t.health.saving : t.health.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
