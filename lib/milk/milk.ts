import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { asRecords, asString, type Row } from '@/lib/parse';

export type MilkRecord = {
  id: string;
  farm_id: string;
  animal_id: string | null;
  animal_tag: string;
  record_date: string;
  liters: number;
  notes: string | null;
};

export type MilkRecordInput = {
  animal_id: string;
  animal_tag: string;
  record_date: string;
  liters: number;
  notes: string | null;
};

const MILK_COLUMNS = 'id, farm_id, animal_id, animal_tag, record_date, liters, notes';

export function localDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseMilkRecord(row: Row): MilkRecord | null {
  const id = asString(row.id);
  const farmId = asString(row.farm_id);
  const animalTag = asString(row.animal_tag);
  const recordDate = asString(row.record_date);
  const liters = typeof row.liters === 'number' ? row.liters : Number(row.liters);
  if (!id || !farmId || !animalTag || !recordDate || !Number.isFinite(liters)) return null;
  return {
    id,
    farm_id: farmId,
    animal_id: asString(row.animal_id),
    animal_tag: animalTag,
    record_date: recordDate,
    liters,
    notes: asString(row.notes),
  };
}

export async function fetchMilkRecords(farmId: string, sinceDay: string): Promise<MilkRecord[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('milk_production_records')
    .select(MILK_COLUMNS)
    .eq('farm_id', farmId)
    .gte('record_date', sinceDay)
    .order('record_date', { ascending: false });
  if (error) throw error;
  return asRecords(data).flatMap((row) => {
    const record = parseMilkRecord(row);
    return record ? [record] : [];
  });
}

export async function createMilkRecord(farmId: string, input: MilkRecordInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('milk_production_records')
    .insert({ ...input, farm_id: farmId });
  if (error) throw error;
}

export async function updateMilkRecord(recordId: string, input: MilkRecordInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('milk_production_records')
    .update({
      animal_id: input.animal_id,
      animal_tag: input.animal_tag,
      record_date: input.record_date,
      liters: input.liters,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId);
  if (error) throw error;
}

export async function deleteMilkRecord(recordId: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('milk_production_records')
    .delete()
    .eq('id', recordId);
  if (error) throw error;
}
