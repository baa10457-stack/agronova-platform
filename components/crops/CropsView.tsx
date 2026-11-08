'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FieldFormDialog } from '@/components/crops/FieldFormDialog';
import { ParcelMap } from '@/components/crops/ParcelMap';
import type { MapParcel } from '@/components/crops/LeafletParcelMap';
import { SeasonFormDialog } from '@/components/crops/SeasonFormDialog';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import {
  deleteCropField,
  deleteCropSeason,
  fetchCropFields,
  fetchCropSeasons,
  type CropField,
  type CropSeason,
} from '@/lib/crops/crops';
import { useFarmAccess } from '@/lib/farms/useFarmAccess';

type CropsViewProps = { farmId: string };

type Dialog = { kind: 'field'; field: CropField | null } | { kind: 'season'; season: CropSeason | null } | null;

type PendingDelete = { kind: 'field' | 'season'; id: string } | null;

function formatDay(value: string | null, fallback: string): string {
  if (!value) return fallback;
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function CropsView({ farmId }: CropsViewProps) {
  const t = useAppText();
  const access = useFarmAccess(farmId);
  const [fields, setFields] = useState<CropField[]>([]);
  const [seasons, setSeasons] = useState<CropSeason[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const isReady = access.kind === 'ready';

  const loadData = useCallback(async () => {
    try {
      const [fieldList, seasonList] = await Promise.all([fetchCropFields(farmId), fetchCropSeasons(farmId)]);
      setFields(fieldList);
      setSeasons(seasonList);
      setLoadError(null);
    } catch (cause) {
      setLoadError(t.common.error[toErrorKey(cause)]);
    }
  }, [farmId, t]);

  useEffect(() => {
    if (isReady) void loadData();
  }, [isReady, loadData]);

  const fieldNames = useMemo(() => new Map(fields.map((field) => [field.id, field.name])), [fields]);

  const locatedParcels = useMemo<MapParcel[]>(
    () =>
      fields.flatMap((field) =>
        field.latitude !== null && field.longitude !== null
          ? [
              {
                id: field.id,
                name: field.name,
                area_hectares: field.area_hectares,
                latitude: field.latitude,
                longitude: field.longitude,
              },
            ]
          : [],
      ),
    [fields],
  );

  const stats = useMemo(
    () => ({
      area: fields.reduce((sum, field) => sum + field.area_hectares, 0),
      active: seasons.filter((season) => season.status !== 'harvested').length,
      tons: seasons.reduce((sum, season) => sum + (season.actual_yield_tons ?? 0), 0),
    }),
    [fields, seasons],
  );

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setActionError(null);
    try {
      if (pendingDelete.kind === 'field') {
        await deleteCropField(pendingDelete.id);
      } else {
        await deleteCropSeason(pendingDelete.id);
      }
      setPendingDelete(null);
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
    { label: t.crops.statFields, value: String(fields.length) },
    { label: t.crops.statArea, value: formatNumber(stats.area) },
    { label: t.crops.statGrowing, value: String(stats.active) },
    { label: t.crops.statTons, value: formatNumber(stats.tons) },
  ];
  const deleteMessage = pendingDelete?.kind === 'field' ? t.crops.confirmDeleteField : t.crops.confirmDeleteSeason;
  const headerCell = 'px-6 py-4 font-semibold';

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <Link href={`/farms/${farm.id}`} className="self-start text-sm font-semibold text-brand-forest-800 hover:text-brand-forest-600">
          {t.crops.back}
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-brand-forest-900">{t.crops.title}</h1>
          <p className="text-sm text-stone-600">{farm.name}</p>
        </div>
        {!canManage && <Notice tone="info">{t.crops.readOnly}</Notice>}
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-brand-forest-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-brand-forest-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-brand-forest-900">{t.crops.mapTitle}</h2>
          <p className="text-sm text-stone-600">{t.crops.mapSubtitle}</p>
        </div>
        {locatedParcels.length === 0 ? (
          <Notice tone="info">{t.crops.mapEmpty}</Notice>
        ) : (
          <>
            <p className="text-sm font-medium text-stone-700">
              {t.crops.mapLocatedCount}: {locatedParcels.length}
            </p>
            <ParcelMap parcels={locatedParcels} picked={null} heightClassName="h-[28rem]" />
          </>
        )}
      </section>

      {actionError && <Notice tone="error">{actionError}</Notice>}

      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-brand-forest-900">{t.crops.fieldsTitle}</h2>
          {canManage && <Button onClick={() => setDialog({ kind: 'field', field: null })}>{t.crops.addField}</Button>}
        </div>
        <div className="flex flex-col rounded-2xl border border-brand-forest-100 bg-white shadow-sm">
          {fields.length === 0 ? (
            <p className="p-8 text-sm text-stone-600">{t.crops.emptyFields}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-brand-forest-100 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className={headerCell}>{t.crops.colField}</th>
                    <th className={headerCell}>{t.crops.colArea}</th>
                    <th className={headerCell}>{t.crops.colLocation}</th>
                    <th className={headerCell}>{t.crops.colSoil}</th>
                    {canManage && <th className={headerCell}>{t.crops.colActions}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-forest-100">
                  {fields.map((field) => (
                    <tr key={field.id} className="transition-colors duration-200 hover:bg-brand-forest-50/60">
                      <td className="px-6 py-4 font-semibold text-brand-forest-900">{field.name}</td>
                      <td className="px-6 py-4 text-stone-800">{formatNumber(field.area_hectares)}</td>
                      <td className="px-6 py-4 text-stone-800">{field.location ?? t.common.notSet}</td>
                      <td className="px-6 py-4 text-stone-800">{field.soil_type ?? t.common.notSet}</td>
                      {canManage && (
                        <td className="px-6 py-4">
                          {pendingDelete?.kind === 'field' && pendingDelete.id === field.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-stone-600">{deleteMessage}</span>
                              <Button variant="danger" className="px-4 py-2" onClick={() => void handleDelete()}>
                                {t.common.confirm}
                              </Button>
                              <Button variant="secondary" className="px-4 py-2" onClick={() => setPendingDelete(null)}>
                                {t.common.cancel}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Button variant="secondary" className="px-4 py-2" onClick={() => setDialog({ kind: 'field', field })}>
                                {t.crops.edit}
                              </Button>
                              <Button variant="danger" className="px-4 py-2" onClick={() => setPendingDelete({ kind: 'field', id: field.id })}>
                                {t.crops.delete}
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
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-brand-forest-900">{t.crops.seasonsTitle}</h2>
          {canManage && fields.length > 0 && (
            <Button onClick={() => setDialog({ kind: 'season', season: null })}>{t.crops.addSeason}</Button>
          )}
        </div>
        {canManage && fields.length === 0 && <Notice tone="info">{t.crops.noFields}</Notice>}
        <div className="flex flex-col rounded-2xl border border-brand-forest-100 bg-white shadow-sm">
          {seasons.length === 0 ? (
            <p className="p-8 text-sm text-stone-600">{t.crops.emptySeasons}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-brand-forest-100 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className={headerCell}>{t.crops.colField}</th>
                    <th className={headerCell}>{t.crops.colCrop}</th>
                    <th className={headerCell}>{t.crops.colSowing}</th>
                    <th className={headerCell}>{t.crops.colHarvest}</th>
                    <th className={headerCell}>{t.crops.colYield}</th>
                    <th className={headerCell}>{t.crops.colStatus}</th>
                    {canManage && <th className={headerCell}>{t.crops.colActions}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-forest-100">
                  {seasons.map((season) => (
                    <tr key={season.id} className="transition-colors duration-200 hover:bg-brand-forest-50/60">
                      <td className="px-6 py-4 text-stone-800">{fieldNames.get(season.field_id) ?? t.common.notSet}</td>
                      <td className="px-6 py-4 font-semibold text-brand-forest-900">
                        {season.crop_name}
                        {season.variety && <span className="block text-xs font-normal text-stone-500">{season.variety}</span>}
                      </td>
                      <td className="px-6 py-4 text-stone-800">{formatDay(season.sowing_date, t.common.notSet)}</td>
                      <td className="px-6 py-4 text-stone-800">{formatDay(season.harvest_date, t.common.notSet)}</td>
                      <td className="px-6 py-4 text-stone-800">
                        {season.actual_yield_tons !== null ? formatNumber(season.actual_yield_tons) : t.common.notSet}
                      </td>
                      <td className="px-6 py-4 text-stone-800">{t.crops.seasonStatuses[season.status]}</td>
                      {canManage && (
                        <td className="px-6 py-4">
                          {pendingDelete?.kind === 'season' && pendingDelete.id === season.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-stone-600">{deleteMessage}</span>
                              <Button variant="danger" className="px-4 py-2" onClick={() => void handleDelete()}>
                                {t.common.confirm}
                              </Button>
                              <Button variant="secondary" className="px-4 py-2" onClick={() => setPendingDelete(null)}>
                                {t.common.cancel}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Button variant="secondary" className="px-4 py-2" onClick={() => setDialog({ kind: 'season', season })}>
                                {t.crops.edit}
                              </Button>
                              <Button variant="danger" className="px-4 py-2" onClick={() => setPendingDelete({ kind: 'season', id: season.id })}>
                                {t.crops.delete}
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
        </div>
      </section>

      {dialog?.kind === 'field' && (
        <FieldFormDialog
          farmId={farmId}
          field={dialog.field}
          onClose={() => setDialog(null)}
          onSaved={async () => {
            setDialog(null);
            await loadData();
          }}
        />
      )}
      {dialog?.kind === 'season' && (
        <SeasonFormDialog
          farmId={farmId}
          fields={fields}
          season={dialog.season}
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
