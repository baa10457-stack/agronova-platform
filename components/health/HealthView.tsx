'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HealthRecordFormDialog } from '@/components/health/HealthRecordFormDialog';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import { fetchAnimals, type Animal } from '@/lib/livestock/animals';
import { deleteHealthRecord, fetchHealthRecords, type HealthRecord } from '@/lib/health/health';
import { useFarmAccess } from '@/lib/farms/useFarmAccess';
import { localDay } from '@/lib/milk/milk';

type HealthViewProps = { farmId: string };

type Dialog = { mode: 'create' } | { mode: 'edit'; record: HealthRecord } | null;

const RECENT_DAYS = 30;

function daysAgo(count: number): string {
  const date = new Date();
  date.setDate(date.getDate() - count);
  return localDay(date);
}

function formatDay(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function HealthView({ farmId }: HealthViewProps) {
  const t = useAppText();
  const access = useFarmAccess(farmId);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isReady = access.kind === 'ready';

  const loadData = useCallback(async () => {
    try {
      const [animalList, recordList] = await Promise.all([fetchAnimals(farmId), fetchHealthRecords(farmId)]);
      setAnimals(animalList);
      setRecords(recordList);
      setLoadError(null);
    } catch (cause) {
      setLoadError(t.common.error[toErrorKey(cause)]);
    }
  }, [farmId, t]);

  useEffect(() => {
    if (isReady) void loadData();
  }, [isReady, loadData]);

  const stats = useMemo(() => {
    const today = daysAgo(0);
    const recentStart = daysAgo(RECENT_DAYS - 1);
    return {
      recent: records.filter((record) => record.record_date >= recentStart).length,
      activeWithdrawals: records.filter((record) => record.withdrawal_end_date !== null && record.withdrawal_end_date >= today)
        .length,
    };
  }, [records]);

  const activeAnimals = useMemo(() => animals.filter((animal) => animal.status === 'active'), [animals]);
  const formAnimals = useMemo(
    () =>
      animals.filter(
        (animal) => animal.status === 'active' || (dialog?.mode === 'edit' && animal.id === dialog.record.animal_id),
      ),
    [animals, dialog],
  );

  const handleDelete = async (record: HealthRecord) => {
    setActionError(null);
    try {
      await deleteHealthRecord(record.id);
      setDeletingId(null);
      await loadData();
    } catch (cause) {
      setActionError(t.common.error[toErrorKey(cause)]);
    }
  };

  if (access.kind === 'notFound') {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="error">{t.overview.notFound}</Notice>
        <Link href="/dashboard" className="text-sm font-semibold text-brand-forest-800 hover:text-brand-forest-600">
          {t.overview.back}
        </Link>
      </div>
    );
  }

  if (access.kind === 'error') return <Notice tone="error">{t.common.error[toErrorKey(access.error)]}</Notice>;
  if (loadError) return <Notice tone="error">{loadError}</Notice>;
  if (access.kind !== 'ready') return <p className="text-sm text-stone-600">{t.common.loading}</p>;

  const { farm, canManage } = access;
  const today = daysAgo(0);
  const statCards = [
    { label: t.health.statRecent, value: String(stats.recent) },
    { label: t.health.statWithdrawals, value: String(stats.activeWithdrawals) },
    { label: t.health.statAnimals, value: String(activeAnimals.length) },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <Link href={`/farms/${farm.id}`} className="self-start text-sm font-semibold text-brand-forest-800 hover:text-brand-forest-600">
          {t.health.back}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-brand-forest-900">{t.health.title}</h1>
            <p className="text-sm text-stone-600">{farm.name}</p>
          </div>
          {canManage && activeAnimals.length > 0 && <Button onClick={() => setDialog({ mode: 'create' })}>{t.health.add}</Button>}
        </div>
        {!canManage && <Notice tone="info">{t.health.readOnly}</Notice>}
        {canManage && activeAnimals.length === 0 && <Notice tone="info">{t.health.noAnimals}</Notice>}
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-brand-forest-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-brand-forest-900">{stat.value}</p>
          </div>
        ))}
      </section>

      {actionError && <Notice tone="error">{actionError}</Notice>}

      <section className="flex flex-col rounded-2xl border border-brand-forest-100 bg-white shadow-sm">
        {records.length === 0 ? (
          <p className="p-8 text-sm text-stone-600">{t.health.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-brand-forest-100 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t.health.colDate}</th>
                  <th className="px-6 py-4 font-semibold">{t.health.colAnimal}</th>
                  <th className="px-6 py-4 font-semibold">{t.health.colType}</th>
                  <th className="px-6 py-4 font-semibold">{t.health.colTitle}</th>
                  <th className="px-6 py-4 font-semibold">{t.health.colWithdrawal}</th>
                  {canManage && <th className="px-6 py-4 font-semibold">{t.health.colActions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-forest-100">
                {records.map((record) => {
                  const inWithdrawal = record.withdrawal_end_date !== null && record.withdrawal_end_date >= today;
                  return (
                    <tr key={record.id} className="transition-colors duration-200 hover:bg-brand-forest-50/60">
                      <td className="px-6 py-4 text-stone-800">{formatDay(record.record_date)}</td>
                      <td className="px-6 py-4 font-semibold text-brand-forest-900">
                        {record.animal_id ? record.animal_tag : t.health.removedAnimal}
                      </td>
                      <td className="px-6 py-4 text-stone-800">{t.health.types[record.record_type]}</td>
                      <td className="px-6 py-4 text-stone-800">
                        {record.title}
                        {record.product && <span className="block text-xs text-stone-500">{record.product}</span>}
                      </td>
                      <td className="px-6 py-4">
                        {record.withdrawal_end_date ? (
                          <span
                            className={
                              inWithdrawal
                                ? 'rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900'
                                : 'text-stone-800'
                            }
                          >
                            {inWithdrawal ? `${t.health.activeWithdrawal} · ` : ''}
                            {formatDay(record.withdrawal_end_date)}
                          </span>
                        ) : (
                          t.common.notSet
                        )}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4">
                          {deletingId === record.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-stone-600">{t.health.confirmDelete}</span>
                              <Button variant="danger" className="px-4 py-2" onClick={() => void handleDelete(record)}>
                                {t.common.confirm}
                              </Button>
                              <Button variant="secondary" className="px-4 py-2" onClick={() => setDeletingId(null)}>
                                {t.common.cancel}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Button variant="secondary" className="px-4 py-2" onClick={() => setDialog({ mode: 'edit', record })}>
                                {t.health.edit}
                              </Button>
                              <Button variant="danger" className="px-4 py-2" onClick={() => setDeletingId(record.id)}>
                                {t.health.delete}
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialog && (
        <HealthRecordFormDialog
          farmId={farmId}
          animals={formAnimals}
          record={dialog.mode === 'edit' ? dialog.record : null}
          onClose={() => setDialog(null)}
          onSaved={async () => {
            setDialog(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}
