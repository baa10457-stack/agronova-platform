'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TransactionFormDialog } from '@/components/finance/TransactionFormDialog';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import {
  deleteTransaction,
  fetchTransactions,
  monthBounds,
  monthKey,
  shiftMonth,
  type Transaction,
  type TransactionCategory,
  type TransactionKind,
} from '@/lib/finance/finance';
import { useFarmAccess } from '@/lib/farms/useFarmAccess';
import { localDay } from '@/lib/milk/milk';

type FinanceViewProps = { farmId: string };

type Dialog = { mode: 'create' } | { mode: 'edit'; transaction: Transaction } | null;
type Filter = 'all' | TransactionKind;

const TREND_MONTHS = 12;

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthLabel(key: string, format: 'long' | 'short'): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, format === 'long' ? { month: 'long', year: 'numeric' } : { month: 'short' });
}

export function FinanceView({ farmId }: FinanceViewProps) {
  const t = useAppText();
  const access = useFarmAccess(farmId);
  const currentMonth = monthKey(new Date());
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const isReady = access.kind === 'ready';

  const loadData = useCallback(async () => {
    try {
      const from = monthBounds(shiftMonth(month, -(TREND_MONTHS - 1))).from;
      const to = monthBounds(month).to;
      setTransactions(await fetchTransactions(farmId, from, to));
      setLoadError(null);
      setLoaded(true);
    } catch (cause) {
      setLoadError(t.common.error[toErrorKey(cause)]);
    }
  }, [farmId, month, t]);

  useEffect(() => {
    if (isReady) void loadData();
  }, [isReady, loadData]);

  const summary = useMemo(() => {
    const months = Array.from({ length: TREND_MONTHS }, (_, i) => shiftMonth(month, i - (TREND_MONTHS - 1)));
    const byMonth = new Map(months.map((key) => [key, { income: 0, expense: 0 }]));
    const byCategory = new Map<TransactionCategory, number>();
    const monthItems: Transaction[] = [];
    for (const item of transactions) {
      const key = item.transaction_date.slice(0, 7);
      const bucket = byMonth.get(key);
      if (bucket) bucket[item.kind] += item.amount;
      if (key === month) {
        monthItems.push(item);
        if (item.kind === 'expense') byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.amount);
      }
    }
    const trend = months.map((key) => ({ key, ...byMonth.get(key)! }));
    const current = byMonth.get(month)!;
    const yearBalance = trend.reduce((sum, row) => sum + row.income - row.expense, 0);
    const trendMax = Math.max(0, ...trend.map((row) => Math.max(row.income, row.expense)));
    const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
    return { trend, trendMax, current, yearBalance, categories, monthItems };
  }, [transactions, month]);

  const visibleItems = useMemo(
    () => (filter === 'all' ? summary.monthItems : summary.monthItems.filter((item) => item.kind === filter)),
    [summary.monthItems, filter],
  );

  const handleDelete = async (item: Transaction) => {
    setActionError(null);
    try {
      await deleteTransaction(item.id);
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
  if (access.kind !== 'ready' || !loaded) return <p className="text-sm text-stone-600">{t.common.loading}</p>;

  const { farm, canManage } = access;
  const { current, yearBalance } = summary;
  const balance = current.income - current.expense;
  const balanceTone = (value: number) => (value < 0 ? 'text-red-700' : 'text-emerald-700');
  const statCards = [
    { label: t.finance.statIncome, value: formatAmount(current.income), tone: 'text-emerald-700' },
    { label: t.finance.statExpenses, value: formatAmount(current.expense), tone: 'text-red-700' },
    { label: t.finance.statBalance, value: formatAmount(balance), tone: balanceTone(balance) },
    { label: t.finance.statYearBalance, value: formatAmount(yearBalance), tone: balanceTone(yearBalance) },
  ];
  const totalExpenses = current.expense;
  const defaultDate = month === currentMonth ? localDay(new Date()) : monthBounds(month).from;
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t.finance.filterAll },
    { id: 'income', label: t.finance.filterIncome },
    { id: 'expense', label: t.finance.filterExpense },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <Link href={`/farms/${farm.id}`} className="self-start text-sm font-semibold text-brand-forest-800 hover:text-brand-forest-600">
          {t.finance.back}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-brand-forest-900">{t.finance.title}</h1>
            <p className="text-sm text-stone-600">{farm.name}</p>
          </div>
          {canManage && <Button onClick={() => setDialog({ mode: 'create' })}>{t.finance.add}</Button>}
        </div>
        {!canManage && <Notice tone="info">{t.finance.readOnly}</Notice>}
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="px-4 py-2" aria-label={t.finance.previousMonth} onClick={() => setMonth(shiftMonth(month, -1))}>
            ←
          </Button>
          <p className="min-w-[10rem] text-center text-lg font-semibold capitalize text-brand-forest-900">{monthLabel(month, 'long')}</p>
          <Button
            variant="secondary"
            className="px-4 py-2"
            aria-label={t.finance.nextMonth}
            disabled={month >= currentMonth}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            →
          </Button>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-brand-forest-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">{stat.label}</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-6 rounded-2xl border border-brand-forest-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-brand-forest-900">{t.finance.trendTitle}</h2>
            <div className="flex gap-4 text-xs text-stone-600">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                {t.finance.trendIncome}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                {t.finance.trendExpenses}
              </span>
            </div>
          </div>
          {summary.trendMax === 0 ? (
            <p className="text-sm text-stone-600">{t.finance.trendEmpty}</p>
          ) : (
            <div className="flex h-48 items-end gap-2">
              {summary.trend.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => setMonth(row.key)}
                  title={`${monthLabel(row.key, 'long')} — ${t.finance.trendIncome}: ${formatAmount(row.income)} · ${t.finance.trendExpenses}: ${formatAmount(row.expense)}`}
                  className={`group flex h-full flex-1 flex-col items-center justify-end gap-2 rounded-md px-0.5 pt-1 ${row.key === month ? 'bg-brand-forest-50' : ''}`}
                >
                  <div className="flex min-h-0 w-full flex-1 items-end justify-center gap-0.5">
                    <span className="w-1/2 max-w-[14px] rounded-t-sm bg-emerald-600" style={{ height: `${(row.income / summary.trendMax) * 100}%` }} />
                    <span className="w-1/2 max-w-[14px] rounded-t-sm bg-red-500" style={{ height: `${(row.expense / summary.trendMax) * 100}%` }} />
                  </div>
                  <span className={`text-[10px] capitalize ${row.key === month ? 'font-semibold text-brand-forest-900' : 'text-stone-500'}`}>
                    {monthLabel(row.key, 'short')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 rounded-2xl border border-brand-forest-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-forest-900">{t.finance.breakdownTitle}</h2>
          {summary.categories.length === 0 ? (
            <p className="text-sm text-stone-600">{t.finance.breakdownEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {summary.categories.map(([category, total]) => (
                <li key={category} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-stone-800">{t.finance.categories[category]}</span>
                    <span className="font-semibold tabular-nums text-brand-forest-900">{formatAmount(total)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-brand-gold-500" style={{ width: `${(total / totalExpenses) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {actionError && <Notice tone="error">{actionError}</Notice>}

      <section className="flex flex-col rounded-2xl border border-brand-forest-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-forest-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-forest-900">{t.finance.listTitle}</h2>
          <div className="flex gap-1 rounded-full bg-stone-100 p-1">
            {filters.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                aria-pressed={filter === option.id}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                  filter === option.id ? 'bg-white text-brand-forest-900 shadow-sm' : 'text-stone-600 hover:text-brand-forest-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {visibleItems.length === 0 ? (
          <p className="p-8 text-sm text-stone-600">{t.finance.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-brand-forest-100 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t.finance.colDate}</th>
                  <th className="px-6 py-4 font-semibold">{t.finance.colDescription}</th>
                  <th className="px-6 py-4 font-semibold">{t.finance.colCategory}</th>
                  <th className="px-6 py-4 font-semibold">{t.finance.colCounterparty}</th>
                  <th className="px-6 py-4 text-right font-semibold">{t.finance.colAmount}</th>
                  {canManage && <th className="px-6 py-4 font-semibold">{t.finance.colActions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-forest-100">
                {visibleItems.map((item) => (
                  <tr key={item.id} className="transition-colors duration-200 hover:bg-brand-forest-50/60">
                    <td className="whitespace-nowrap px-6 py-4 text-stone-800">
                      {new Date(`${item.transaction_date}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-brand-forest-900">{item.description}</p>
                      {item.notes && <p className="mt-1 text-xs text-stone-500">{item.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-stone-800">{t.finance.categories[item.category]}</td>
                    <td className="px-6 py-4 text-stone-800">{item.counterparty ?? t.common.notSet}</td>
                    <td className={`whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums ${item.kind === 'income' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {item.kind === 'income' ? '+' : '−'}
                      {formatAmount(item.amount)}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4">
                        {deletingId === item.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-stone-600">{t.finance.confirmDelete}</span>
                            <Button variant="danger" className="px-4 py-2" onClick={() => void handleDelete(item)}>
                              {t.common.confirm}
                            </Button>
                            <Button variant="secondary" className="px-4 py-2" onClick={() => setDeletingId(null)}>
                              {t.common.cancel}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" className="px-4 py-2" onClick={() => setDialog({ mode: 'edit', transaction: item })}>
                              {t.finance.edit}
                            </Button>
                            <Button variant="danger" className="px-4 py-2" onClick={() => setDeletingId(item.id)}>
                              {t.finance.delete}
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
        <TransactionFormDialog
          farmId={farmId}
          transaction={dialog.mode === 'edit' ? dialog.transaction : null}
          defaultDate={defaultDate}
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
