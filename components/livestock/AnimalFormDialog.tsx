'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, fieldClassName } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import {
  ANIMAL_SEXES,
  ANIMAL_STATUSES,
  createAnimal,
  updateAnimal,
  type Animal,
  type AnimalInput,
  type AnimalSex,
  type AnimalStatus,
} from '@/lib/livestock/animals';

type AnimalFormDialogProps = {
  farmId: string;
  animal: Animal | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function AnimalFormDialog({ farmId, animal, onClose, onSaved }: AnimalFormDialogProps) {
  const t = useAppText();
  const [tagNumber, setTagNumber] = useState(animal?.tag_number ?? '');
  const [name, setName] = useState(animal?.name ?? '');
  const [sex, setSex] = useState<AnimalSex | ''>(animal?.sex ?? '');
  const [breed, setBreed] = useState(animal?.breed ?? '');
  const [birthDate, setBirthDate] = useState(animal?.birth_date ?? '');
  const [status, setStatus] = useState<AnimalStatus>(animal?.status ?? 'active');
  const [notes, setNotes] = useState(animal?.notes ?? '');
  const [tagError, setTagError] = useState<string | null>(null);
  const [sexError, setSexError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const tag = tagNumber.trim();
    setTagError(tag === '' ? t.common.required : null);
    setSexError(sex === '' ? t.common.required : null);
    if (tag === '' || sex === '') return;

    const input: AnimalInput = {
      tag_number: tag,
      name: optional(name),
      sex,
      breed: optional(breed),
      birth_date: optional(birthDate),
      status,
      notes: optional(notes),
    };

    setPending(true);
    try {
      if (animal) {
        await updateAnimal(animal.id, input);
      } else {
        await createAnimal(farmId, input);
      }
      await onSaved();
    } catch (cause) {
      const key = toErrorKey(cause);
      setError(key === 'duplicate' ? t.livestock.tagTaken : t.common.error[key]);
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
          <h2 className="text-xl font-semibold text-brand-forest-900">{animal ? t.livestock.formEdit : t.livestock.formNew}</h2>
          <p className="text-sm text-stone-600">{t.livestock.formSubtitle}</p>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <FormField
          id="animal-tag"
          label={t.livestock.tagNumber}
          value={tagNumber}
          onChange={(e) => setTagNumber(e.target.value)}
          error={tagError}
          maxLength={40}
          disabled={pending}
        />
        <FormField
          id="animal-name"
          label={t.livestock.animalName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          disabled={pending}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="animal-sex" className="text-sm font-medium text-brand-forest-900">
            {t.livestock.sex}
          </label>
          <select
            id="animal-sex"
            value={sex}
            onChange={(e) => setSex(e.target.value as AnimalSex | '')}
            disabled={pending}
            aria-invalid={Boolean(sexError)}
            className={`${fieldClassName} ${sexError ? 'border-red-400' : 'border-brand-forest-200'}`}
          >
            <option value="" disabled>
              —
            </option>
            {ANIMAL_SEXES.map((value) => (
              <option key={value} value={value}>
                {t.livestock.sexes[value]}
              </option>
            ))}
          </select>
          {sexError && <p className="text-sm text-red-700">{sexError}</p>}
        </div>

        <FormField
          id="animal-breed"
          label={t.livestock.breed}
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          maxLength={80}
          disabled={pending}
        />
        <FormField
          id="animal-birth"
          type="date"
          label={t.livestock.birthDate}
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          disabled={pending}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="animal-status" className="text-sm font-medium text-brand-forest-900">
            {t.livestock.animalStatus}
          </label>
          <select
            id="animal-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AnimalStatus)}
            disabled={pending}
            className={`${fieldClassName} border-brand-forest-200`}
          >
            {ANIMAL_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t.livestock.animalStatuses[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="animal-notes" className="text-sm font-medium text-brand-forest-900">
            {t.livestock.notes}
          </label>
          <textarea
            id="animal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={4}
            disabled={pending}
            className={`${fieldClassName} resize-y border-brand-forest-200`}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? t.livestock.saving : t.livestock.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
