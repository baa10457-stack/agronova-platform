'use client';

import { useState, type FormEvent } from 'react';
import { ParcelMap } from '@/components/crops/ParcelMap';
import type { MapParcel, MapPoint } from '@/components/crops/LeafletParcelMap';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import { createCropField, updateCropField, type CropField, type CropFieldInput } from '@/lib/crops/crops';

type FieldFormDialogProps = {
  farmId: string;
  field: CropField | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const MAX_AREA = 100000;
const COORDINATE_PRECISION = 6;
const NO_PARCELS: MapParcel[] = [];

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function parseDecimal(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

function inRange(value: number, limit: number): boolean {
  return Number.isFinite(value) && Math.abs(value) <= limit;
}

function parseLocation(latitudeText: string, longitudeText: string): MapPoint | null | 'invalid' {
  const hasLatitude = latitudeText.trim() !== '';
  const hasLongitude = longitudeText.trim() !== '';
  if (!hasLatitude && !hasLongitude) return null;
  if (!hasLatitude || !hasLongitude) return 'invalid';
  const latitude = parseDecimal(latitudeText);
  const longitude = parseDecimal(longitudeText);
  if (!inRange(latitude, 90) || !inRange(longitude, 180)) return 'invalid';
  return { latitude, longitude };
}

function formatCoordinate(value: number): string {
  return value.toFixed(COORDINATE_PRECISION);
}

export function FieldFormDialog({ farmId, field, onClose, onSaved }: FieldFormDialogProps) {
  const t = useAppText();
  const [name, setName] = useState(field?.name ?? '');
  const [area, setArea] = useState(field ? String(field.area_hectares) : '');
  const [location, setLocation] = useState(field?.location ?? '');
  const [soilType, setSoilType] = useState(field?.soil_type ?? '');
  const [notes, setNotes] = useState(field?.notes ?? '');
  const [latitude, setLatitude] = useState(field?.latitude != null ? formatCoordinate(field.latitude) : '');
  const [longitude, setLongitude] = useState(field?.longitude != null ? formatCoordinate(field.longitude) : '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const parsedLocation = parseLocation(latitude, longitude);
  const pickedPoint = parsedLocation && parsedLocation !== 'invalid' ? parsedLocation : null;

  const placeOnMap = (point: MapPoint) => {
    setLatitude(formatCoordinate(point.latitude));
    setLongitude(formatCoordinate(point.longitude));
    setLocationError(null);
  };

  const clearLocation = () => {
    setLatitude('');
    setLongitude('');
    setLocationError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const surface = parseDecimal(area);
    const areaValid = area.trim() !== '' && Number.isFinite(surface) && surface > 0 && surface <= MAX_AREA;
    const coordinates = parseLocation(latitude, longitude);
    const locationValid = coordinates !== 'invalid';
    setNameError(name.trim() === '' ? t.common.required : null);
    setAreaError(areaValid ? null : t.crops.areaInvalid);
    setLocationError(locationValid ? null : t.crops.coordinatesInvalid);
    if (name.trim() === '' || !areaValid || !locationValid) return;

    const input: CropFieldInput = {
      name: name.trim(),
      area_hectares: surface,
      location: optional(location),
      soil_type: optional(soilType),
      notes: optional(notes),
      latitude: coordinates ? coordinates.latitude : null,
      longitude: coordinates ? coordinates.longitude : null,
    };

    setPending(true);
    try {
      if (field) {
        await updateCropField(field.id, input);
      } else {
        await createCropField(farmId, input);
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
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-6 overflow-y-auto rounded-2xl bg-white p-8 shadow-xl"
      >
        <h2 className="text-xl font-semibold text-brand-forest-900">{field ? t.crops.fieldFormEdit : t.crops.fieldFormNew}</h2>

        {error && <Notice tone="error">{error}</Notice>}

        <FormField
          id="field-name"
          label={t.crops.fieldName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          maxLength={80}
          disabled={pending}
        />
        <FormField
          id="field-area"
          inputMode="decimal"
          label={t.crops.area}
          value={area}
          onChange={(e) => setArea(e.target.value)}
          error={areaError}
          disabled={pending}
        />
        <FormField
          id="field-location"
          label={t.crops.location}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={120}
          disabled={pending}
        />
        <FormField
          id="field-soil"
          label={t.crops.soilType}
          value={soilType}
          onChange={(e) => setSoilType(e.target.value)}
          maxLength={80}
          disabled={pending}
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-brand-forest-900">{t.crops.mapTitle}</span>
            {(latitude !== '' || longitude !== '') && (
              <Button variant="secondary" className="px-4 py-2" onClick={clearLocation} disabled={pending}>
                {t.crops.clearLocation}
              </Button>
            )}
          </div>
          <p className="text-xs text-stone-600">{t.crops.mapPickHint}</p>
          <ParcelMap
            parcels={NO_PARCELS}
            picked={pickedPoint}
            onPick={pending ? undefined : placeOnMap}
            heightClassName="h-64"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="field-latitude"
              inputMode="decimal"
              label={t.crops.latitude}
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              error={locationError}
              disabled={pending}
            />
            <FormField
              id="field-longitude"
              inputMode="decimal"
              label={t.crops.longitude}
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              disabled={pending}
            />
          </div>
          <p className="text-xs text-stone-500">{t.crops.locationSourceNote}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="field-notes" className="text-sm font-medium text-brand-forest-900">
            {t.crops.notes}
          </label>
          <textarea
            id="field-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={3}
            disabled={pending}
            className="w-full resize-y rounded-xl border border-brand-forest-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition-colors duration-200 focus:border-brand-gold-500 focus:ring-2 focus:ring-brand-gold-500/30 disabled:bg-stone-100"
          />
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
