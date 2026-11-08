'use client';

import dynamic from 'next/dynamic';
import type { MapParcel, MapPoint } from '@/components/crops/LeafletParcelMap';
import { useAppText } from '@/i18n/useAppText';

function MapLoading() {
  const t = useAppText();
  return <div className="flex h-full items-center justify-center bg-brand-forest-50 text-sm text-stone-600">{t.crops.mapLoading}</div>;
}

const LeafletParcelMap = dynamic(
  () => import('@/components/crops/LeafletParcelMap').then((module) => module.LeafletParcelMap),
  { ssr: false, loading: () => <MapLoading /> },
);

type ParcelMapProps = {
  parcels: MapParcel[];
  picked?: MapPoint | null;
  onPick?: (point: MapPoint) => void;
  heightClassName: string;
};

export function ParcelMap({ parcels, picked = null, onPick, heightClassName }: ParcelMapProps) {
  return (
    <div className={`relative z-0 overflow-hidden rounded-2xl border border-brand-forest-100 ${heightClassName}`}>
      <LeafletParcelMap parcels={parcels} picked={picked} onPick={onPick} />
    </div>
  );
}
