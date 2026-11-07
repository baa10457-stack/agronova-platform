import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { asRecords, asString, type Row } from '@/lib/parse';

export const CROP_SEASON_STATUSES = ['planned', 'growing', 'harvested'] as const;
export type CropSeasonStatus = (typeof CROP_SEASON_STATUSES)[number];

export type CropField = {
  id: string;
  farm_id: string;
  name: string;
  area_hectares: number;
  location: string | null;
  soil_type: string | null;
  notes: string | null;
};

export type CropFieldInput = {
  name: string;
  area_hectares: number;
  location: string | null;
  soil_type: string | null;
  notes: string | null;
};

export type CropSeason = {
  id: string;
  farm_id: string;
  field_id: string;
  crop_name: string;
  variety: string | null;
  sowing_date: string | null;
  expected_harvest_date: string | null;
  harvest_date: string | null;
  actual_yield_tons: number | null;
  status: CropSeasonStatus;
};

export type CropSeasonInput = {
  field_id: string;
  crop_name: string;
  variety: string | null;
  sowing_date: string | null;
  expected_harvest_date: string | null;
  harvest_date: string | null;
  actual_yield_tons: number | null;
  status: CropSeasonStatus;
};

const FIELD_COLUMNS = 'id, farm_id, name, area_hectares, location, soil_type, notes';
const SEASON_COLUMNS =
  'id, farm_id, field_id, crop_name, variety, sowing_date, expected_harvest_date, harvest_date, actual_yield_tons, status';

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseField(row: Row): CropField | null {
  const id = asString(row.id);
  const farmId = asString(row.farm_id);
  const name = asString(row.name);
  const area = toNumber(row.area_hectares);
  if (!id || !farmId || !name || area === null) return null;
  return {
    id,
    farm_id: farmId,
    name,
    area_hectares: area,
    location: asString(row.location),
    soil_type: asString(row.soil_type),
    notes: asString(row.notes),
  };
}

function parseSeason(row: Row): CropSeason | null {
  const id = asString(row.id);
  const farmId = asString(row.farm_id);
  const fieldId = asString(row.field_id);
  const cropName = asString(row.crop_name);
  const status = asString(row.status);
  if (!id || !farmId || !fieldId || !cropName) return null;
  if (!CROP_SEASON_STATUSES.includes(status as CropSeasonStatus)) return null;
  return {
    id,
    farm_id: farmId,
    field_id: fieldId,
    crop_name: cropName,
    variety: asString(row.variety),
    sowing_date: asString(row.sowing_date),
    expected_harvest_date: asString(row.expected_harvest_date),
    harvest_date: asString(row.harvest_date),
    actual_yield_tons: toNumber(row.actual_yield_tons),
    status: status as CropSeasonStatus,
  };
}

export async function fetchCropFields(farmId: string): Promise<CropField[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('crop_fields')
    .select(FIELD_COLUMNS)
    .eq('farm_id', farmId)
    .order('name', { ascending: true });
  if (error) throw error;
  return asRecords(data).flatMap((row) => {
    const field = parseField(row);
    return field ? [field] : [];
  });
}

export async function fetchCropSeasons(farmId: string): Promise<CropSeason[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('crop_seasons')
    .select(SEASON_COLUMNS)
    .eq('farm_id', farmId)
    .order('sowing_date', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return asRecords(data).flatMap((row) => {
    const season = parseSeason(row);
    return season ? [season] : [];
  });
}

export async function createCropField(farmId: string, input: CropFieldInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('crop_fields')
    .insert({ ...input, farm_id: farmId });
  if (error) throw error;
}

export async function updateCropField(fieldId: string, input: CropFieldInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('crop_fields')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', fieldId);
  if (error) throw error;
}

export async function deleteCropField(fieldId: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from('crop_fields').delete().eq('id', fieldId);
  if (error) throw error;
}

export async function createCropSeason(farmId: string, input: CropSeasonInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('crop_seasons')
    .insert({ ...input, farm_id: farmId });
  if (error) throw error;
}

export async function updateCropSeason(seasonId: string, input: CropSeasonInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('crop_seasons')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', seasonId);
  if (error) throw error;
}

export async function deleteCropSeason(seasonId: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from('crop_seasons').delete().eq('id', seasonId);
  if (error) throw error;
}
