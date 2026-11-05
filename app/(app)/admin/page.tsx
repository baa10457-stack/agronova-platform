'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedLayout } from '@/components/app/ProtectedLayout';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import { fetchAllFarms, setFarmStatus, type Farm, type FarmStatus } from '@/lib/farms/farms';

const STATUSES: readonly FarmStatus[] = ['active', 'suspended', 'archived'];

function AdminView() {
  const t = useAppText();
  const [farms, setFarms] = useState<Farm[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setFarms(await fetchAllFarms());
      setError(null);
    } catch (cause) {
      setError(t.common.error[toErrorKey(cause)]);
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleStatus = async (farmId: string, status: FarmStatus) => {
    setError(null);
    try {
      await setFarmStatus(farmId, status);
      await refresh();
    } catch (cause) {
      setError(t.common.error[toErrorKey(cause)]);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-brand-forest-900">{t.admin.title}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-stone-600">{t.admin.subtitle}</p>
      </section>
      {error && <Notice tone="error">{error}</Notice>}
      {farms === null && !error && <p className="text-sm text-stone-600">{t.common.loading}</p>}
      {farms !== null && (
        <section className="overflow-x-auto rounded-2xl border border-brand-forest-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-forest-50 text-brand-forest-900">
              <tr>
                <th className="px-6 py-4 font-semibold">{t.admin.colFarm}</th>
                <th className="px-6 py-4 font-semibold">{t.admin.colLocation}</th>
                <th className="px-6 py-4 font-semibold">{t.admin.colCreated}</th>
                <th className="px-6 py-4 font-semibold">{t.admin.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {farms.map((farm) => (
                <tr key={farm.id} className="border-t border-brand-forest-100">
                  <td className="px-6 py-4 font-medium text-stone-900">{farm.name}</td>
                  <td className="px-6 py-4 text-stone-700">{farm.location ?? t.common.notSet}</td>
                  <td className="px-6 py-4 text-stone-700">{new Date(farm.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <select
                      aria-label={t.admin.colStatus}
                      value={farm.status}
                      onChange={(e) => void handleStatus(farm.id, e.target.value as FarmStatus)}
                      className="rounded-xl border border-brand-forest-200 bg-white px-3 py-2 text-sm text-stone-900"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {t.statuses[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {farms.length === 0 && <p className="px-6 py-8 text-sm text-stone-600">{t.admin.empty}</p>}
        </section>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedLayout requirePlatformAdmin>
      <AdminView />
    </ProtectedLayout>
  );
}
