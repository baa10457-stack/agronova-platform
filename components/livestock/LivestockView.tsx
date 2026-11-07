'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AnimalFormDialog } from '@/components/livestock/AnimalFormDialog';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchFarm, fetchMembershipPermissions, fetchMyFarms, type Farm, type FarmRole } from '@/lib/farms/farms';
import { deleteAnimal, fetchAnimals, type Animal } from '@/lib/livestock/animals';
import { toErrorKey } from '@/lib/errors';

type LivestockViewProps = { farmId: string };

type Access = { farm: Farm; canManage: boolean };

type Dialog = { mode: 'create' } | { mode: 'edit'; animal: Animal } | null;

export function LivestockView({ farmId }: LivestockViewProps) {
  const t = useAppText();
  const { user, isPlatformAdmin } = useAuth();
  const [access, setAccess] = useState<Access | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const userId = user?.id;

  const loadAnimals = useCallback(async () => {
    setAnimals(await fetchAnimals(farmId));
  }, [farmId]);

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
        const permissions = entry ? await fetchMembershipPermissions(entry.membershipId) : [];
        const role: FarmRole | null = entry?.role ?? null;
        const canManage = isPlatformAdmin || role === 'owner' || role === 'admin' || permissions.includes('farm.manage');
        const list = await fetchAnimals(farmId);
        if (!cancelled) {
          setAccess({ farm, canManage });
          setAnimals(list);
        }
      } catch (cause) {
        if (!cancelled) setLoadError(t.common.error[toErrorKey(cause)]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, farmId, isPlatformAdmin, t]);

  const handleDelete = async (animal: Animal) => {
    setActionError(null);
    try {
      await deleteAnimal(animal.id);
      setDeletingId(null);
      await loadAnimals();
    } catch (cause) {
      setActionError(t.common.error[toErrorKey(cause)]);
    }
  };

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
  if (!access) return <p className="text-sm text-stone-600">{t.common.loading}</p>;

  const { farm, canManage } = access;
  const activeAnimals = animals.filter((animal) => animal.status === 'active');
  const stats = [
    { label: t.livestock.statActive, value: activeAnimals.length },
    { label: t.livestock.statFemales, value: activeAnimals.filter((a) => a.sex === 'female').length },
    { label: t.livestock.statMales, value: activeAnimals.filter((a) => a.sex === 'male').length },
    { label: t.livestock.statExited, value: animals.length - activeAnimals.length },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <Link href={`/farms/${farm.id}`} className="self-start text-sm font-semibold text-brand-forest-800 hover:text-brand-forest-600">
          {t.livestock.back}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-brand-forest-900">{t.livestock.title}</h1>
            <p className="text-sm text-stone-600">{farm.name}</p>
          </div>
          {canManage && (
            <Button onClick={() => setDialog({ mode: 'create' })}>{t.livestock.add}</Button>
          )}
        </div>
        {!canManage && <Notice tone="info">{t.livestock.readOnly}</Notice>}
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-brand-forest-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-brand-forest-900">{stat.value}</p>
          </div>
        ))}
      </section>

      {actionError && <Notice tone="error">{actionError}</Notice>}

      <section className="flex flex-col rounded-2xl border border-brand-forest-100 bg-white shadow-sm">
        {animals.length === 0 ? (
          <p className="p-8 text-sm text-stone-600">{t.livestock.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-brand-forest-100 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t.livestock.colTag}</th>
                  <th className="px-6 py-4 font-semibold">{t.livestock.colName}</th>
                  <th className="px-6 py-4 font-semibold">{t.livestock.colSex}</th>
                  <th className="px-6 py-4 font-semibold">{t.livestock.colBreed}</th>
                  <th className="px-6 py-4 font-semibold">{t.livestock.colBirth}</th>
                  <th className="px-6 py-4 font-semibold">{t.livestock.colStatus}</th>
                  {canManage && <th className="px-6 py-4 font-semibold">{t.livestock.colActions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-forest-100">
                {animals.map((animal) => (
                  <tr key={animal.id} className="transition-colors duration-200 hover:bg-brand-forest-50/60">
                    <td className="px-6 py-4 font-semibold text-brand-forest-900">{animal.tag_number}</td>
                    <td className="px-6 py-4 text-stone-800">{animal.name ?? t.common.notSet}</td>
                    <td className="px-6 py-4 text-stone-800">{t.livestock.sexes[animal.sex]}</td>
                    <td className="px-6 py-4 text-stone-800">{animal.breed ?? t.common.notSet}</td>
                    <td className="px-6 py-4 text-stone-800">
                      {animal.birth_date
                        ? new Date(`${animal.birth_date}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
                        : t.common.notSet}
                    </td>
                    <td className="px-6 py-4 text-stone-800">{t.livestock.animalStatuses[animal.status]}</td>
                    {canManage && (
                      <td className="px-6 py-4">
                        {deletingId === animal.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-stone-600">{t.livestock.confirmDelete}</span>
                            <Button variant="danger" className="px-4 py-2" onClick={() => void handleDelete(animal)}>
                              {t.common.confirm}
                            </Button>
                            <Button variant="secondary" className="px-4 py-2" onClick={() => setDeletingId(null)}>
                              {t.common.cancel}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" className="px-4 py-2" onClick={() => setDialog({ mode: 'edit', animal })}>
                              {t.livestock.edit}
                            </Button>
                            <Button variant="danger" className="px-4 py-2" onClick={() => setDeletingId(animal.id)}>
                              {t.livestock.delete}
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
        <AnimalFormDialog
          farmId={farmId}
          animal={dialog.mode === 'edit' ? dialog.animal : null}
          onClose={() => setDialog(null)}
          onSaved={async () => {
            setDialog(null);
            await loadAnimals();
          }}
        />
      )}
    </div>
  );
}
