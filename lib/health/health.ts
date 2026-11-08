import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { asRecords, asString, type Row } from '@/lib/parse';

export const HEALTH_RECORD_TYPES = ['vaccination', 'treatment', 'checkup'] as const;
export type HealthRecordType = (typeof HEALTH_RECORD_TYPES)[number];

export type HealthRecord = {
  id: string;
  farm_id: string;
  animal_id: string | null;
  animal_tag: string;
  record_type: HealthRecordType;
  record_date: string;
  title: string;
  product: string | null;
  withdrawal_end_date: string | null;
  notes: string | null;
};

export type HealthRecordInput = {
  animal_id: string;
  animal_tag: string;
  record_type: HealthRecordType;
  record_date: string;
  title: string;
  product: string | null;
  withdrawal_end_date: string | null;
  notes: string | null;
};

const HEALTH_COLUMNS = 'id, farm_id, animal_id, animal_tag, record_type, record_date, title, product, withdrawal_end_date, notes';

function parseHealthRecord(row: Row): HealthRecord | null {
  const id = asString(row.id);
  const farmId = asString(row.farm_id);
  const animalTag = asString(row.animal_tag);
  const recordType = asString(row.record_type);
  const recordDate = asString(row.record_date);
  const title = asString(row.title);
  if (!id || !farmId || !animalTag || !title || !recordDate) return null;
  if (!HEALTH_RECORD_TYPES.includes(recordType as HealthRecordType)) return null;
  return {
    id,
    farm_id: farmId,
    animal_id: asString(row.animal_id),
    animal_tag: animalTag,
    record_type: recordType as HealthRecordType,
    record_date: recordDate,
    title,
    product: asString(row.product),
    withdrawal_end_date: asString(row.withdrawal_end_date),
    notes: asString(row.notes),
  };
}

export async function fetchHealthRecords(farmId: string): Promise<HealthRecord[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('animal_health_records')
    .select(HEALTH_COLUMNS)
    .eq('farm_id', farmId)
    .order('record_date', { ascending: false });
  if (error) throw error;
  return asRecords(data).flatMap((row) => {
    const record = parseHealthRecord(row);
    return record ? [record] : [];
  });
}

export async function createHealthRecord(farmId: string, input: HealthRecordInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('animal_health_records')
    .insert({ ...input, farm_id: farmId });
  if (error) throw error;
}

export async function updateHealthRecord(recordId: string, input: HealthRecordInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('animal_health_records')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', recordId);
  if (error) throw error;
}

export async function deleteHealthRecord(recordId: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from('animal_health_records').delete().eq('id', recordId);
  if (error) throw error;
}
