import Link from 'next/link';
import type { MyFarm } from '@/lib/farms/farms';
import { DetailRow } from '@/components/ui/DetailRow';
import { useAppText } from '@/i18n/useAppText';

type FarmCardProps = { entry: MyFarm };

export function FarmCard({ entry }: FarmCardProps) {
  const t = useAppText();
  const { farm, role } = entry;
  const canManageMembers = role === 'owner' || role === 'admin';

  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-brand-forest-100 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-brand-forest-900">{farm.name}</h2>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-brand-forest-50 px-3 py-1 text-brand-forest-800">
              {t.dashboard.yourRole}: {t.roles[role]}
            </span>
            <span className="rounded-full bg-brand-gold-500/15 px-3 py-1 text-brand-forest-900">
              {t.dashboard.status}: {t.statuses[farm.status]}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/farms/${farm.id}`}
            className="rounded-full bg-brand-forest-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-forest-700"
          >
            {t.dashboard.openFarm}
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
      </header>
      <dl className="flex flex-col gap-4">
        <DetailRow label={t.dashboard.farmType} value={t.dashboard.farmTypes[farm.farm_type]} notSetText={t.common.notSet} />
        <DetailRow label={t.dashboard.responsibleName} value={farm.responsible_name} notSetText={t.common.notSet} />
        <DetailRow label={t.dashboard.city} value={farm.city} notSetText={t.common.notSet} />
        <DetailRow label={t.dashboard.region} value={farm.region} notSetText={t.common.notSet} />
        <DetailRow label={t.dashboard.phone} value={farm.phone} notSetText={t.common.notSet} />
      </dl>
    </article>
  );
}
