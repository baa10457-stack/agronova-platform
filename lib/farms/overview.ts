import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { asRecords, asString } from '@/lib/parse';

export type FarmActivity = { id: string; action: string; createdAt: string };

export async function fetchFarmMemberCount(farmId: string): Promise<number> {
  const { count, error } = await createSupabaseBrowserClient()
    .from('farm_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('farm_id', farmId)
    .eq('status', 'active');
  if (error) throw error;
  return count ?? 0;
}

export async function fetchFarmActivity(farmId: string): Promise<FarmActivity[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('audit_log')
    .select('id, action, created_at')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return asRecords(data).flatMap((row) => {
    const id = asString(row.id);
    const action = asString(row.action);
    const createdAt = asString(row.created_at);
    if (!id || !action || !createdAt) return [];
    return [{ id, action, createdAt }];
  });
}
