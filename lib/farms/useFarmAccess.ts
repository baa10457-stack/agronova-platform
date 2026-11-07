'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchFarm, fetchMembershipPermissions, fetchMyFarms, type Farm } from '@/lib/farms/farms';

export type FarmAccessState =
  | { kind: 'loading' }
  | { kind: 'notFound' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; farm: Farm; canManage: boolean };

export function useFarmAccess(farmId: string): FarmAccessState {
  const { user, isPlatformAdmin } = useAuth();
  const [state, setState] = useState<FarmAccessState>({ kind: 'loading' });
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const farms = await fetchMyFarms(userId);
        const entry = farms.find((item) => item.farm.id === farmId);
        const farm = entry?.farm ?? (isPlatformAdmin ? await fetchFarm(farmId) : null);
        if (cancelled) return;
        if (!farm) {
          setState({ kind: 'notFound' });
          return;
        }
        const permissions = entry ? await fetchMembershipPermissions(entry.membershipId) : [];
        const role = entry?.role ?? null;
        const canManage = isPlatformAdmin || role === 'owner' || role === 'admin' || permissions.includes('farm.manage');
        if (!cancelled) setState({ kind: 'ready', farm, canManage });
      } catch (cause) {
        if (!cancelled) setState({ kind: 'error', error: cause });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, farmId, isPlatformAdmin]);

  return state;
}
