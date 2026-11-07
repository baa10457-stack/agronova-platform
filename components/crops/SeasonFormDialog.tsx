'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, fieldClassName } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import {
  CROP_SEASON_STATUSES,
  createCropSeason,
  updateCropSeason,
  type CropField,
  type CropSeason,
  type CropSeasonInput,
  type CropSeasonStatus,
} from '@/lib/crops/crops';

type SeasonFormDialogProps = {
  farmId: string;
  fields: CropField[];
  season: CropSeason | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function SeasonFormDialog({ farmId, fields, season, onClose, onSaved }: SeasonFormDialogProps) {
  const t = useAppText();
  const [fieldId, setFieldId] = useState(season?.field_id ?? '');
  const [cropName, setCropName] = useState(season?.crop_name ?? '');
  const [variety, setVariety] = useState(season?.variety ?? '');
  const [sowingDate, setSowingDate] = useState(season?.sowing_date ?? '');
  const [expectedHarvest, setExpectedHarvest] = useState(season?.expected_harvest_date ?? '');
  const [harvestDate, setHarvestDate] = useState(season?.harvest_date ?? '');
  const [yieldTons, setYieldTons] = useState(season?.actual_yield_tons != null ? String(season.actual_yield_tons) : '');
  const [status, setStatus] = useState<CropSeasonStatus>(season?.status ?? 'planned');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [cropError, setCropError] = useState<string | null>(null);
  const [yieldError, setYieldError] = useState<string | null>(null);
  const [harvestError, setHarvestError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const yieldText = yieldTons.trim();
    const yieldValue = yieldText === '' ? null : Number(yieldText.replace(',', '.'));
    const yieldValid = yieldValue === null || (Number.isFinite(yieldValue) && yieldValue >= 0);
    const harvestOrderValid = !sowingDate || !harvestDate || harvestDate >= sowingDate;

    setFieldError(fieldId ? null : t.common.required);
    setCropError(cropName.trim() === '' ? t.common.required : null);
    setYieldError(yieldValid ? null : t.crops.yieldInvalid);
    setHarvestError(harvestOrderValid ? null : t.crops.harvestBeforeSowing);
    if (!fieldId || cropName.trim() === '' || !yieldValid || !harvestOrderValid) return;

    const input: CropSeasonInput = {
      field_id: fieldId,
      crop_name: cropName.trim(),
      variety: optional(variety),
      sowing_date: optional(sowingDate),
      expected_harvest_date: optional(expectedHarvest),
      harvest_date: optional(harvestDate),
      actual_yield_tons: yieldValue,
      status,
    };

    setPending(true);
    try {
      if (season) {
        await updateCropSeason(season.id, input);
      } else {
        await createCropSeason(farmId, input);
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
        <h2 className="text-xl font-semibold text-brand-forest-900">{season ? t.crops.seasonFormEdit : t.crops.seasonFormNew}</h2>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="flex flex-col gap-2">
          <label htmlFor="season-field" className="text-sm font-medium text-brand-forest-900">
            {t.crops.colField}
          </label>
          <select
            id="season-field"
            value={fieldId}
            onChange={(e) => setFieldId(e.target.value)}
            disabled={pending}
            aria-invalid={Boolean(fieldError)}
            className={`${fieldClassName} ${fieldError ? 'border-red-400' : 'border-brand-forest-200'}`}
          >
            <option value="" disabled>
              {t.crops.chooseField}
            </option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
          {fieldError && <p className="text-sm text-red-700">{fieldError}</p>}
        </div>

        <FormField
          id="season-crop"
          label={t.crops.crop}
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
          error={cropError}
          maxLength={80}
          disabled={pending}
        />
        <FormField
          id="season-variety"
          label={t.crops.variety}
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
          maxLength={80}
          disabled={pending}
        />
        <FormField
          id="season-sowing"
          type="date"
          label={t.crops.sowingDate}
          value={sowingDate}
          onChange={(e) => setSowingDate(e.target.value)}
          disabled={pending}
        />
        <FormField
          id="season-expected"
          type="date"
          label={t.crops.expectedHarvest}
          value={expectedHarvest}
          onChange={(e) => setExpectedHarvest(e.target.value)}
          disabled={pending}
        />
        <FormField
          id="season-harvest"
          type="date"
          label={t.crops.harvestDate}
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          error={harvestError}
          disabled={pending}
        />
        <FormField
          id="season-yield"
          inputMode="decimal"
          label={t.crops.yieldTons}
          value={yieldTons}
          onChange={(e) => setYieldTons(e.target.value)}
          error={yieldError}
          disabled={pending}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="season-status" className="text-sm font-medium text-brand-forest-900">
            {t.crops.seasonStatus}
          </label>
          <select
            id="season-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CropSeasonStatus)}
            disabled={pending}
            className={`${fieldClassName} border-brand-forest-200`}
          >
            {CROP_SEASON_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t.crops.seasonStatuses[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? t.crops.saving : t.crops.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
