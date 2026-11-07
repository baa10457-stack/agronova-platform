'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, fieldClassName } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import type { Animal } from '@/lib/livestock/animals';
import { createMilkRecord, localDay, updateMilkRecord, type MilkRecord, type MilkRecordInput } from '@/lib/milk/milk';

type MilkRecordFormDialogProps = {
  farmId: string;
  cows: Animal[];
  record: MilkRecord | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const MAX_LITERS = 100;

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function MilkRecordFormDialog({ farmId, cows, record, onClose, onSaved }: MilkRecordFormDialogProps) {
  const t = useAppText();
  const [animalId, setAnimalId] = useState(record?.animal_id ?? '');
  const [recordDate, setRecordDate] = useState(record?.record_date ?? localDay(new Date()));
  const [liters, setLiters] = useState(record ? String(record.liters) : '');
  const [notes, setNotes] = useState(record?.notes ?? '');
  const [animalError, setAnimalError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [litersError, setLitersError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const cow = cows.find((item) => item.id === animalId);
    const quantity = Number(liters.trim().replace(',', '.'));
    const litersValid = liters.trim() !== '' && Number.isFinite(quantity) && quantity >= 0 && quantity <= MAX_LITERS;

    setAnimalError(cow ? null : t.common.required);
    setDateError(recordDate ? null : t.common.required);
    setLitersError(litersValid ? null : t.milk.litersInvalid);
    if (!cow || !recordDate || !litersValid) return;

    const input: MilkRecordInput = {
      animal_id: cow.id,
      animal_tag: cow.tag_number,
      record_date: recordDate,
      liters: quantity,
      notes: optional(notes),
    };

    setPending(true);
    try {
      if (record) {
        await updateMilkRecord(record.id, input);
      } else {
        await createMilkRecord(farmId, input);
      }
      await onSaved();
    } catch (cause) {
      const key = toErrorKey(cause);
      setError(key === 'duplicate' ? t.milk.duplicate : t.common.error[key]);
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
          <h2 className="text-xl font-semibold text-brand-forest-900">{record ? t.milk.formEdit : t.milk.formNew}</h2>
          <p className="text-sm text-stone-600">{t.milk.formSubtitle}</p>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="flex flex-col gap-2">
          <label htmlFor="milk-animal" className="text-sm font-medium text-brand-forest-900">
            {t.milk.animal}
          </label>
          <select
            id="milk-animal"
            value={animalId}
            onChange={(e) => setAnimalId(e.target.value)}
            disabled={pending}
            aria-invalid={Boolean(animalError)}
            className={`${fieldClassName} ${animalError ? 'border-red-400' : 'border-brand-forest-200'}`}
          >
            <option value="" disabled>
              {t.milk.chooseAnimal}
            </option>
            {cows.map((cow) => (
              <option key={cow.id} value={cow.id}>
                {cow.tag_number}
                {cow.name ? ` · ${cow.name}` : ''}
              </option>
            ))}
          </select>
          {animalError && <p className="text-sm text-red-700">{animalError}</p>}
        </div>

        <FormField
          id="milk-date"
          type="date"
          label={t.milk.recordDate}
          value={recordDate}
          onChange={(e) => setRecordDate(e.target.value)}
          error={dateError}
          disabled={pending}
        />
        <FormField
          id="milk-liters"
          inputMode="decimal"
          label={t.milk.liters}
          value={liters}
          onChange={(e) => setLiters(e.target.value)}
          error={litersError}
          disabled={pending}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="milk-notes" className="text-sm font-medium text-brand-forest-900">
            {t.milk.notes}
          </label>
          <textarea
            id="milk-notes"
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
            {pending ? t.milk.saving : t.milk.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
