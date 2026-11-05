'use client';

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
  const { user } = useAuth();
  const [farms, setFarms] = useState<MyFarm[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

  const handleCreated = () => {
    setCreating(false);
    void refresh();
  };

  const showCreateForm = creating || (farms !== null && farms.length === 0);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-brand-forest-900">{t.dashboard.title}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-stone-600">{t.dashboard.subtitle}</p>
      </section>

      {loadError && (
        <div className="flex flex-col gap-4">
          <Notice tone="error">{loadError}</Notice>
          <Button variant="secondary" onClick={() => void refresh()} className="self-start">
            {t.common.retry}
          </Button>
        </div>
      )}

      {farms === null && !loadError && <p className="text-sm text-stone-600">{t.common.loading}</p>}

      {farms !== null && farms.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-forest-200 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-brand-forest-900">{t.dashboard.emptyTitle}</h2>
          <p className="mt-2 text-sm text-stone-600">{t.dashboard.emptyText}</p>
        </div>
      )}

      {farms !== null &&
        farms.map((entry) => <FarmCard key={entry.membershipId} entry={entry} />)}

      {farms !== null && farms.length > 0 && !creating && (
        <div>
          <Button variant="secondary" onClick={() => setCreating(true)}>
            {t.dashboard.createAnother}
          </Button>
        </div>
      )}

      {showCreateForm && (
        <section className="flex flex-col gap-6 rounded-2xl border border-brand-forest-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-brand-forest-900">{t.dashboard.createTitle}</h2>
            <p className="text-sm text-stone-600">{t.dashboard.createSubtitle}</p>
          </div>
          <CreateFarmForm
            onCreated={handleCreated}
            onCancel={farms !== null && farms.length > 0 ? () => setCreating(false) : undefined}
          />
        </section>
      )}
    </div>
  );
}
