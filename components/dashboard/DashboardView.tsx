'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchMyFarms, type MyFarm } from '@/lib/farms/farms';
import { toErrorKey } from '@/lib/errors';
import { CreateFarmForm } from './CreateFarmForm';
import { FarmCard } from './FarmCard';

export function DashboardView() {
  const t = useAppText();
  const router = useRouter();
  const { user } = useAuth();

  const [farms, setFarms] = useState<MyFarm[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const metadata = user?.user_metadata ?? {};

  const displayName =
    metadata.full_name ||
    metadata.name ||
    user?.email?.split('@')[0] ||
    'Utilisateur';

  const avatarUrl =
    metadata.avatar_url ||
    metadata.picture ||
    metadata.photo_url;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join('');

  const userId = user?.id;

  const refresh = useCallback(async () => {
    if (!userId) return;

    try {
      setFarms(await fetchMyFarms(userId));
      setLoadError(null);
    } catch (cause) {
      setLoadError(t.common.error[toErrorKey(cause)]);
    }
  }, [userId, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreated = (farmId: string) => {
    setCreating(false);
    router.push(`/farms/${farmId}`);
  };

  const showCreateForm = creating || (farms !== null && farms.length === 0);

  return (
    <div className="flex flex-col gap-8">

      {/* ESPACE DE BIENVENUE */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 p-7 text-white shadow-xl sm:p-10">

        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 right-32 h-52 w-52 rounded-full bg-emerald-400/10" />

        <div className="relative z-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-center">

          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-emerald-100">
              AGRONOVA FARM
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Bienvenue, {displayName} !
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-emerald-100 sm:text-base">
              Pilotez vos exploitations agricoles depuis un espace
              intelligent, moderne et centralisé.
            </p>
          </div>

          {/* AVATAR UTILISATEUR */}

          <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">

            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`Photo de ${displayName}`}
                className="h-16 w-16 rounded-full border-2 border-white/70 object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/60 bg-gradient-to-br from-lime-300 to-emerald-500 text-xl font-bold text-emerald-950 shadow-lg">
                {initials || 'U'}
              </div>
            )}

            <div>
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="mt-1 text-xs text-emerald-100">
                Membre AGRONOVA
              </p>
              <p className="mt-1 text-xs text-white/70">
                {user?.email}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* STATISTIQUES */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <div className="group rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Exploitations
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold text-emerald-950">
            {farms === null ? '—' : farms.length}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            Exploitations associées à votre compte
          </p>
        </div>

        <div className="group rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Espace personnel
            </span>
          </div>

          <p className="mt-5 text-xl font-bold text-blue-950">
            Gestion centralisée
          </p>

          <p className="mt-1 text-sm text-stone-500">
            Retrouvez vos espaces agricoles.
          </p>
        </div>

        <div className="group rounded-2xl border border-amber-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              AGRONOVA
            </span>
          </div>

          <p className="mt-5 text-xl font-bold text-amber-950">
            Agriculture intelligente
          </p>

          <p className="mt-1 text-sm text-stone-500">
            Une plateforme au service de vos activités.
          </p>
        </div>

      </section>

      {/* ERREURS */}

      {loadError && (
        <div className="flex flex-col gap-4">
          <Notice tone="error">{loadError}</Notice>

          <Button
            variant="secondary"
            onClick={() => void refresh()}
            className="self-start"
          >
            {t.common.retry}
          </Button>
        </div>
      )}

      {/* CHARGEMENT */}

      {farms === null && !loadError && (
        <div className="rounded-2xl border border-stone-200 bg-white p-8">
          <p className="text-sm text-stone-500">
            {t.common.loading}
          </p>
        </div>
      )}

      {/* MES EXPLOITATIONS */}

      {farms !== null && (
        <section className="flex flex-col gap-6">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-emerald-950">
                Mes exploitations
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Gérez et consultez vos espaces agricoles.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                <path d="M20 7v5h-5M4 17v-5h5M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Actualiser
            </button>
          </div>

          {farms.length === 0 && (
            <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.7">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h3 className="mt-5 text-lg font-bold text-emerald-950">
                {t.dashboard.emptyTitle}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
                {t.dashboard.emptyText}
              </p>
            </div>
          )}

          {farms.length > 0 && (
            <div className="grid gap-5">
              {farms.map((entry) => (
                <FarmCard
                  key={entry.membershipId}
                  entry={entry}
                />
              ))}
            </div>
          )}

          {farms.length > 0 && !creating && (
            <div>
              <Button
                variant="secondary"
                onClick={() => setCreating(true)}
                className="rounded-xl px-6 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                + {t.dashboard.createAnother}
              </Button>
            </div>
          )}

        </section>
      )}

      {/* CREATION D'EXPLOITATION */}

      {showCreateForm && (
        <section className="flex flex-col gap-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg sm:p-8">

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              AGRONOVA FARM
            </span>

            <h2 className="text-2xl font-bold text-emerald-950">
              {t.dashboard.createTitle}
            </h2>

            <p className="text-sm text-stone-600">
              {t.dashboard.createSubtitle}
            </p>
          </div>

          <CreateFarmForm
            onCreated={handleCreated}
            onCancel={
              farms !== null && farms.length > 0
                ? () => setCreating(false)
                : undefined
            }
          />

        </section>
      )}

    </div>
  );
}
