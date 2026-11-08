'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DetailRow } from '@/components/ui/DetailRow';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchFarm, fetchMyFarms, type Farm, type FarmRole } from '@/lib/farms/farms';
import { fetchFarmActivity, fetchFarmMemberCount, type FarmActivity } from '@/lib/farms/overview';
import { toErrorKey } from '@/lib/errors';

type FarmOverviewViewProps = { farmId: string };

type OverviewData = { farm: Farm; role: FarmRole | null; memberCount: number; activity: FarmActivity[] };

export function FarmOverviewView({ farmId }: FarmOverviewViewProps) {
  const t = useAppText();
  const { user, isPlatformAdmin } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const farms = await fetchMyFarms(userId);
        const entry = farms.find((item) => item.farm.id === farmId);
        const farm = entry?.farm ?? (isPlatformAdmin ? await fetchFarm(farmId) : null);
        if (!farm) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const [memberCount, activity] = await Promise.all([
          fetchFarmMemberCount(farmId),
          fetchFarmActivity(farmId),
        ]);
        if (!cancelled) setData({ farm, role: entry?.role ?? null, memberCount, activity });
      } catch (cause) {
        if (!cancelled) setLoadError(t.common.error[toErrorKey(cause)]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, farmId, isPlatformAdmin, t]);

  if (notFound) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="error">{t.overview.notFound}</Notice>
        <Link href="/dashboard" className="text-sm font-semibold text-brand-forest-800 hover:text-brand-forest-600">
          {t.overview.back}
        </Link>
      </div>
    );
  }

  if (loadError) return <Notice tone="error">{loadError}</Notice>;

  if (!data) return <p className="text-sm text-stone-600">{t.common.loading}</p>;

  const { farm, role, memberCount, activity } = data;
  const canManageMembers = isPlatformAdmin || role === 'owner' || role === 'admin';
  const createdOn = new Date(farm.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <Link href="/dashboard" className="self-start text-sm font-semibold text-brand-forest-800 hover:text-brand-forest-600">
          {t.overview.back}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold text-brand-forest-900">{farm.name}</h1>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {role && (
                <span className="rounded-full bg-brand-forest-50 px-3 py-1 text-brand-forest-800">
                  {t.dashboard.yourRole}: {t.roles[role]}
                </span>
              )}
              <span className="rounded-full bg-brand-gold-500/15 px-3 py-1 text-brand-forest-900">
                {t.dashboard.status}: {t.statuses[farm.status]}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/farms/${farm.id}/livestock`}
              className="rounded-full bg-brand-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-forest-900 transition-colors duration-200 hover:bg-brand-gold-400"
            >
              {t.livestock.open}
            </Link>
            <Link
              href={`/farms/${farm.id}/health`}
              className="rounded-full bg-brand-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-forest-900 transition-colors duration-200 hover:bg-brand-gold-400"
            >
              {t.health.open}
            </Link>
            <Link
              href={`/farms/${farm.id}/crops`}
              className="rounded-full bg-brand-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-forest-900 transition-colors duration-200 hover:bg-brand-gold-400"
            >
              {t.crops.open}
            </Link>
            <Link
              href={`/farms/${farm.id}/milk`}
              className="rounded-full bg-brand-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-forest-900 transition-colors duration-200 hover:bg-brand-gold-400"
            >
              {t.milk.open}
            </Link>
            <Link
              href={`/farms/${farm.id}/finance`}
              className="rounded-full bg-brand-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-forest-900 transition-colors duration-200 hover:bg-brand-gold-400"
            >
              {t.finance.open}
            </Link>
            {canManageMembers && (
              <Link
                href={`/farms/${farm.id}/members`}
                className="rounded-full border border-brand-forest-200 px-5 py-2.5 text-sm font-semibold text-brand-forest-900 transition-colors duration-200 hover:bg-brand-forest-50"
              >
                {t.dashboard.manageMembers}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-brand-forest-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">{t.overview.membersCount}</p>
          <p className="mt-2 text-3xl font-semibold text-brand-forest-900">{memberCount}</p>
        </div>
        <div className="rounded-2xl border border-brand-forest-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">{t.overview.createdOn}</p>
          <p className="mt-2 text-3xl font-semibold text-brand-forest-900">{createdOn}</p>
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-brand-forest-100 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-brand-forest-900">{t.overview.info}</h2>
        <dl className="flex flex-col gap-4">
          <DetailRow label={t.dashboard.farmType} value={t.dashboard.farmTypes[farm.farm_type]} notSetText={t.common.notSet} />
          <DetailRow label={t.dashboard.responsibleName} value={farm.responsible_name} notSetText={t.common.notSet} />
          <DetailRow label={t.dashboard.address} value={farm.address} notSetText={t.common.notSet} />
          <DetailRow label={t.dashboard.city} value={farm.city} notSetText={t.common.notSet} />
          <DetailRow label={t.dashboard.region} value={farm.region} notSetText={t.common.notSet} />
          <DetailRow label={t.dashboard.phone} value={farm.phone} notSetText={t.common.notSet} />
          <DetailRow label={t.dashboard.email} value={farm.email} notSetText={t.common.notSet} />
          <DetailRow label={t.dashboard.description} value={farm.description} notSetText={t.common.notSet} />
        </dl>
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-brand-forest-100 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-brand-forest-900">{t.overview.activity}</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-stone-600">{t.overview.activityEmpty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-brand-forest-100">
            {activity.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="text-sm text-stone-900">
                  {(t.overview.actions as Record<string, string>)[item.action] ?? t.overview.unknownAction}
                </span>
                <time className="text-xs text-stone-500" dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
