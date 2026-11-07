import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { asRecords, asString, type Row } from '@/lib/parse';

export type FarmStatus = 'active' | 'suspended' | 'archived';
export type FarmRole = 'owner' | 'admin' | 'employee';
export const FARM_TYPES = ['cattle', 'small_ruminants', 'poultry', 'pig', 'mixed', 'other'] as const;
export type FarmType = (typeof FARM_TYPES)[number];

export type Farm = {
  id: string;
  name: string;
  farm_type: FarmType;
  responsible_name: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  status: FarmStatus;
  owner_id: string;
  created_at: string;
};

export type MyFarm = { membershipId: string; role: FarmRole; farm: Farm };

export type CreateFarmInput = {
  name: string;
  farmType: FarmType;
  responsibleName: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  email: string;
  description: string;
};

const FARM_COLUMNS =
  'id, name, farm_type, responsible_name, address, city, region, location, phone, email, description, status, owner_id, created_at';
const FARM_STATUSES: readonly string[] = ['active', 'suspended', 'archived'];
export const FARM_ROLES: readonly string[] = ['owner', 'admin', 'employee'];

export function parseFarm(row: Row): Farm | null {
  const id = asString(row.id);
  const name = asString(row.name);
  const status = asString(row.status);
  const farmType = asString(row.farm_type);
  const ownerId = asString(row.owner_id);
  const createdAt = asString(row.created_at);
  if (!id || !name || !ownerId || !createdAt || !status || !FARM_STATUSES.includes(status)) return null;
  if (!farmType || !FARM_TYPES.includes(farmType as FarmType)) return null;
  return {
    id,
    name,
    farm_type: farmType as FarmType,
    responsible_name: asString(row.responsible_name),
    address: asString(row.address),
    city: asString(row.city),
    region: asString(row.region),
    location: asString(row.location),
    phone: asString(row.phone),
    email: asString(row.email),
    description: asString(row.description),
    status: status as FarmStatus,
    owner_id: ownerId,
    created_at: createdAt,
  };
}

export async function fetchMyFarms(userId: string): Promise<MyFarm[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('farm_memberships')
    .select(`id, role, farms(${FARM_COLUMNS})`)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });
  if (error) throw error;

  return asRecords(data).flatMap((row) => {
    const membershipId = asString(row.id);
    const role = asString(row.role);
    const farmRow = Array.isArray(row.farms) ? row.farms[0] : row.farms;
    const farm = typeof farmRow === 'object' && farmRow !== null ? parseFarm(farmRow as Row) : null;
    if (!membershipId || !role || !FARM_ROLES.includes(role) || !farm) return [];
    return [{ membershipId, role: role as FarmRole, farm }];
  });
}

export async function fetchMembershipPermissions(membershipId: string): Promise<string[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('membership_permissions')
    .select('permission, granted')
    .eq('membership_id', membershipId);
  if (error) throw error;
  return asRecords(data).flatMap((row) => {
    const permission = asString(row.permission);
    return permission && row.granted === true ? [permission] : [];
  });
}

export async function fetchFarm(farmId: string): Promise<Farm | null> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('farms')
    .select(FARM_COLUMNS)
    .eq('id', farmId)
    .maybeSingle();
  if (error) throw error;
  return data && typeof data === 'object' ? parseFarm(data as Row) : null;
}

export async function fetchAllFarms(): Promise<Farm[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('farms')
    .select(FARM_COLUMNS)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return asRecords(data).flatMap((row) => {
    const farm = parseFarm(row);
    return farm ? [farm] : [];
  });
}

export async function createFarm(input: CreateFarmInput): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient().rpc('create_farm', {
    p_name: input.name,
    p_farm_type: input.farmType,
    p_responsible_name: input.responsibleName,
    p_phone: input.phone,
    p_address: input.address,
    p_city: input.city,
    p_region: input.region,
    p_email: input.email,
    p_description: input.description,
  });
  if (error) throw error;
  if (typeof data !== 'string') throw new Error('Unexpected response from create_farm');
  return data;
}

export async function setFarmStatus(farmId: string, status: FarmStatus): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc('set_farm_status', {
    p_farm_id: farmId,
    p_status: status,
  });
  if (error) throw error;
}
