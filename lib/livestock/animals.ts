import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { asRecords, asString, type Row } from '@/lib/parse';

export const ANIMAL_SEXES = ['female', 'male'] as const;
export const ANIMAL_STATUSES = ['active', 'sold', 'deceased'] as const;
export type AnimalSex = (typeof ANIMAL_SEXES)[number];
export type AnimalStatus = (typeof ANIMAL_STATUSES)[number];

export type Animal = {
  id: string;
  farm_id: string;
  tag_number: string;
  name: string | null;
  sex: AnimalSex;
  breed: string | null;
  birth_date: string | null;
  status: AnimalStatus;
  notes: string | null;
};

export type AnimalInput = {
  tag_number: string;
  name: string | null;
  sex: AnimalSex;
  breed: string | null;
  birth_date: string | null;
  status: AnimalStatus;
  notes: string | null;
};

const ANIMAL_COLUMNS = 'id, farm_id, tag_number, name, sex, breed, birth_date, status, notes';

function parseAnimal(row: Row): Animal | null {
  const id = asString(row.id);
  const farmId = asString(row.farm_id);
  const tagNumber = asString(row.tag_number);
  const sex = asString(row.sex);
  const status = asString(row.status);
  if (!id || !farmId || !tagNumber) return null;
  if (!ANIMAL_SEXES.includes(sex as AnimalSex) || !ANIMAL_STATUSES.includes(status as AnimalStatus)) return null;
  return {
    id,
    farm_id: farmId,
    tag_number: tagNumber,
    name: asString(row.name),
    sex: sex as AnimalSex,
    breed: asString(row.breed),
    birth_date: asString(row.birth_date),
    status: status as AnimalStatus,
    notes: asString(row.notes),
  };
}

export async function fetchAnimals(farmId: string): Promise<Animal[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('livestock_animals')
    .select(ANIMAL_COLUMNS)
    .eq('farm_id', farmId)
    .order('tag_number', { ascending: true });
  if (error) throw error;
  return asRecords(data).flatMap((row) => {
    const animal = parseAnimal(row);
    return animal ? [animal] : [];
  });
}

export async function createAnimal(farmId: string, input: AnimalInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('livestock_animals')
    .insert({ ...input, farm_id: farmId });
  if (error) throw error;
}

export async function updateAnimal(animalId: string, input: AnimalInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('livestock_animals')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', animalId);
  if (error) throw error;
}

export async function deleteAnimal(animalId: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('livestock_animals')
    .delete()
    .eq('id', animalId);
  if (error) throw error;
}
