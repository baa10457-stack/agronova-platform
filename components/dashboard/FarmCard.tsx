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
    <article className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl">

      {/* BANDEAU SUPERIEUR */}

      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-800 px-6 py-7 text-white sm:px-8">

        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-125" />

        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl shadow-inner backdrop-blur">
              🌱
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                AGRONOVA FARM
              </p>

              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {farm.name}
              </h2>

              <p className="mt-1 text-xs text-emerald-100/80">
                {farm.city || farm.region || 'Exploitation agricole'}
              </p>
            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              {t.dashboard.yourRole}: {t.roles[role]}
            </span>

            <span className="rounded-full bg-lime-300 px-3 py-1.5 text-xs font-bold text-emerald-950">
              {t.dashboard.status}: {t.statuses[farm.status]}
            </span>

          </div>

        </div>
      </div>

      {/* INFORMATIONS */}

      <div className="flex flex-col gap-6 p-6 sm:p-8">

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-950">
            Informations de l'exploitation
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">

            <DetailRow
              label={t.dashboard.farmType}
              value={t.dashboard.farmTypes[farm.farm_type]}
              notSetText={t.common.notSet}
            />

            <DetailRow
              label={t.dashboard.responsibleName}
              value={farm.responsible_name}
              notSetText={t.common.notSet}
            />

            <DetailRow
              label={t.dashboard.city}
              value={farm.city}
              notSetText={t.common.notSet}
            />

            <DetailRow
              label={t.dashboard.region}
              value={farm.region}
              notSetText={t.common.notSet}
            />

            <DetailRow
              label={t.dashboard.phone}
              value={farm.phone}
              notSetText={t.common.notSet}
            />

          </div>
        </div>

        {/* SEPARATEUR */}

        <div className="h-px bg-gradient-to-r from-transparent via-emerald-100 to-transparent" />

        {/* BOUTONS PROFESSIONNELS */}

        <div className="flex flex-col gap-3 sm:flex-row">

          <Link
            href={`/farms/${farm.id}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
              <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {t.dashboard.openFarm}

            <span aria-hidden="true">→</span>
          </Link>

          {canManageMembers && (
            <Link
              href={`/farms/${farm.id}/members`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {t.dashboard.manageMembers}
            </Link>
          )}

        </div>

      </div>
    </article>
  );
}
