'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MilkRecordFormDialog } from '@/components/milk/MilkRecordFormDialog';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import { fetchAnimals, type Animal } from '@/lib/livestock/animals';
import { deleteMilkRecord, fetchMilkRecords, localDay, type MilkRecord } from '@/lib/milk/milk';
import { useFarmAccess } from '@/lib/farms/useFarmAccess';

type MilkViewProps = { farmId: string };

type Dialog = { mode: 'create' } | { mode: 'edit'; record: MilkRecord } | null;

const HISTORY_DAYS = 90;

function daysAgo(count: number): string {
  const date = new Date();
  date.setDate(date.getDate() - count);
  return localDay(date);
}

function formatLiters(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function MilkView({ farmId }: MilkViewProps) {
  const t = useAppText();
  const access = useFarmAccess(farmId);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isReady = access.kind === 'ready';

  const loadData = useCallback(async () => {
    try {
      const [animalList, recordList] = await Promise.all([
        fetchAnimals(farmId),
        fetchMilkRecords(farmId, daysAgo(HISTORY_DAYS)),
      ]);
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
    const weekStart = daysAgo(6);
    const monthStart = daysAgo(29);
    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;
    const cowsThisMonth = new Set<string>();
    for (const record of records) {
      if (record.record_date === today) todayTotal += record.liters;
      if (record.record_date >= weekStart) weekTotal += record.liters;
      if (record.record_date >= monthStart) {
        monthTotal += record.liters;
        if (record.animal_id) cowsThisMonth.add(record.animal_id);
      }
    }
    return { todayTotal, weekTotal, dailyAverage: monthTotal / 30, cowCount: cowsThisMonth.size };
  }, [records]);

  const cows = useMemo(() => animals.filter((animal) => animal.sex === 'female'), [animals]);
  const formCows = useMemo(
    () =>
      cows.filter(
        (cow) => cow.status === 'active' || (dialog?.mode === 'edit' && cow.id === dialog.record.animal_id),
      ),
    [cows, dialog],
  );

  const handleDelete = async (record: MilkRecord) => {
    setActionError(null);
    try {
      await deleteMilkRecord(record.id);
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
  const statCards = [
    { label: t.milk.statToday, value: `${formatLiters(stats.todayTotal)} L` },
    { label: t.milk.statWeek, value: `${formatLiters(stats.weekTotal)} L` },
    { label: t.milk.statDailyAverage, value: `${formatLiters(stats.dailyAverage)} L` },
    { label: t.milk.statCows, value: String(stats.cowCount) },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <Link href={`/farms/${farm.id}`} className="self-start text-sm font-semibold text-brand-forest-800 hover:text-brand-forest-600">
          {t.milk.back}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-brand-forest-900">{t.milk.title}</h1>
            <p className="text-sm text-stone-600">{farm.name}</p>
          </div>
          {canManage && cows.length > 0 && <Button onClick={() => setDialog({ mode: 'create' })}>{t.milk.add}</Button>}
        </div>
        {!canManage && <Notice tone="info">{t.milk.readOnly}</Notice>}
        {canManage && cows.length === 0 && <Notice tone="info">{t.milk.noCows}</Notice>}
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <p className="p-8 text-sm text-stone-600">{t.milk.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-brand-forest-100 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t.milk.colDate}</th>
                  <th className="px-6 py-4 font-semibold">{t.milk.colAnimal}</th>
                  <th className="px-6 py-4 font-semibold">{t.milk.colLiters}</th>
                  <th className="px-6 py-4 font-semibold">{t.milk.colNotes}</th>
                  {canManage && <th className="px-6 py-4 font-semibold">{t.milk.colActions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-forest-100">
                {records.map((record) => (
                  <tr key={record.id} className="transition-colors duration-200 hover:bg-brand-forest-50/60">
                    <td className="px-6 py-4 text-stone-800">
                      {new Date(`${record.record_date}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-forest-900">
                      {record.animal_id ? record.animal_tag : t.milk.removedAnimal}
                    </td>
                    <td className="px-6 py-4 text-stone-800">{formatLiters(record.liters)}</td>
                    <td className="px-6 py-4 text-stone-800">{record.notes ?? t.common.notSet}</td>
                    {canManage && (
                      <td className="px-6 py-4">
                        {deletingId === record.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-stone-600">{t.milk.confirmDelete}</span>
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
                              {t.milk.edit}
                            </Button>
                            <Button variant="danger" className="px-4 py-2" onClick={() => setDeletingId(record.id)}>
                              {t.milk.delete}
                            </Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialog && (
        <MilkRecordFormDialog
          farmId={farmId}
          cows={formCows}
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
