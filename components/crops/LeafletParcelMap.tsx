'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

export type MapPoint = { latitude: number; longitude: number };
export type MapParcel = MapPoint & { id: string; name: string; area_hectares: number };

type LeafletParcelMapProps = {
  parcels: MapParcel[];
  picked: MapPoint | null;
  onPick?: (point: MapPoint) => void;
};

const IMAGERY_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const IMAGERY_ATTRIBUTION = 'Imagery &copy; Esri, Maxar, Earthstar Geographics';
const DEFAULT_CENTER: L.LatLngTuple = [46.6, 2.4];

function markerIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:20px;height:20px;border-radius:9999px;background:${color};border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.45)"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function parcelPopup(parcel: MapParcel): HTMLElement {
  const wrapper = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = parcel.name;
  const area = document.createElement('div');
  area.textContent = `${parcel.area_hectares.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha`;
  wrapper.append(name, area);
  return wrapper;
}

export function LeafletParcelMap({ parcels, picked, onPick }: LeafletParcelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const pickedRef = useRef(picked);
  const onPickRef = useRef(onPick);
  const pickable = Boolean(onPick);

  useEffect(() => {
    pickedRef.current = picked;
    onPickRef.current = onPick;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const start = pickedRef.current;
    const map = L.map(container).setView(
      start ? [start.latitude, start.longitude] : DEFAULT_CENTER,
      start ? 16 : 5,
    );
    L.tileLayer(IMAGERY_URL, { maxZoom: 19, attribution: IMAGERY_ATTRIBUTION }).addTo(map);
    L.tileLayer(LABELS_URL, { maxZoom: 19 }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    map.on('click', (event) => {
      onPickRef.current?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    });
    mapRef.current = map;
    layerRef.current = layer;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const parcel of parcels) {
      L.marker([parcel.latitude, parcel.longitude], { icon: markerIcon('#2f7d4f'), title: parcel.name })
        .bindPopup(parcelPopup(parcel))
        .addTo(layer);
    }
    if (picked) {
      L.marker([picked.latitude, picked.longitude], { icon: markerIcon('#c9a227'), draggable: pickable }).on(
        'dragend',
        (event) => {
          const position = (event.target as L.Marker).getLatLng();
          onPickRef.current?.({ latitude: position.lat, longitude: position.lng });
        },
      ).addTo(layer);
    }
  }, [parcels, picked, pickable]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || parcels.length === 0) return;
    const bounds = L.latLngBounds(parcels.map((parcel) => [parcel.latitude, parcel.longitude] as L.LatLngTuple));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
  }, [parcels]);

  return <div ref={containerRef} className="h-full w-full" />;
}
