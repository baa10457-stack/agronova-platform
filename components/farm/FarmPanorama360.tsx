'use client';
import { useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

declare global {
  interface Window {
    pannellum?: {
      viewer: (
        container: HTMLElement,
        config: Record<string, unknown>
      ) => { destroy: () => void };
    };
    L?: any;
  }
}

type Props = {
  farmId: string;
  farmName: string;
};

const BUCKET = 'farm-panoramas';

const PANNELLUM_CSS =
  'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.css';

const PANNELLUM_JS =
  'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.js';

const LEAFLET_CSS =
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

const LEAFLET_JS =
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

type Coordinates = {
  latitude: number;
  longitude: number;
};

function loadCss(id: string, href: string) {
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;

    if (existing) {
      const globalName = id === 'leaflet-js' ? 'L' : 'pannellum';

      if ((window as any)[globalName]) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(
      new Error('Impossible de charger une bibliothèque cartographique.')
    );

    document.body.appendChild(script);
  });
}

export function FarmPanorama360({ farmId, farmName }: Props) {
  const panoramaContainer = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'satellite' | '360'>('satellite');

  const [panoramaUrl, setPanoramaUrl] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [savedCoordinates, setSavedCoordinates] =
    useState<Coordinates | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Charger les données de l'exploitation
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createSupabaseBrowserClient();

        const [panoramaResult, locationResult] = await Promise.all([
          supabase
            .from('farm_panoramas')
            .select('image_path')
            .eq('farm_id', farmId)
            .maybeSingle(),

          supabase
            .from('farm_locations')
            .select('latitude, longitude')
            .eq('farm_id', farmId)
            .maybeSingle(),
        ]);

        if (panoramaResult.error) throw panoramaResult.error;
        if (locationResult.error) throw locationResult.error;

        if (cancelled) return;

        if (panoramaResult.data) {
          const path = panoramaResult.data.image_path;

          const { data, error: signedError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(path, 3600);

          if (signedError) throw signedError;

          if (!cancelled) {
            setImagePath(path);
            setPanoramaUrl(data.signedUrl);
          }
        }

        if (locationResult.data) {
          const position = {
            latitude: locationResult.data.latitude,
            longitude: locationResult.data.longitude,
          };

          setCoordinates(position);
          setSavedCoordinates(position);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger les données.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [farmId]);

  // Initialiser la carte satellite
  useEffect(() => {
    if (mode !== 'satellite' || loading || !mapContainer.current) return;

    let cancelled = false;

    async function initializeMap() {
      try {
        loadCss('leaflet-css', LEAFLET_CSS);
        await loadScript('leaflet-js', LEAFLET_JS);

        if (cancelled || !mapContainer.current || !window.L) return;

        const L = window.L;

        if (!mapRef.current) {
          const center = coordinates
            ? [coordinates.latitude, coordinates.longitude]
            : [14.5, -14.5];

          const map = L.map(mapContainer.current).setView(center, coordinates ? 16 : 6);

          L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              attribution:
                'Tiles © Esri — Sources: Esri, Maxar, Earthstar Geographics',
              maxZoom: 19,
            }
          ).addTo(map);

          map.on('click', (event: any) => {
            const position = {
              latitude: event.latlng.lat,
              longitude: event.latlng.lng,
            };

            setCoordinates(position);

            if (markerRef.current) {
              markerRef.current.setLatLng(event.latlng);
            } else {
              markerRef.current = L.marker(event.latlng).addTo(map);
            }
          });

          mapRef.current = map;

          if (coordinates) {
            markerRef.current = L.marker(center).addTo(map);
          }
        } else {
          mapRef.current.invalidateSize();

          if (coordinates) {
            const position = [
              coordinates.latitude,
              coordinates.longitude,
            ];

            mapRef.current.setView(position, 16);

            if (markerRef.current) {
              markerRef.current.setLatLng(position);
            } else {
              markerRef.current = L.marker(position).addTo(mapRef.current);
            }
          }
        }

        setMapReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger la carte satellite.'
          );
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
    };
  }, [mode, loading, coordinates?.latitude, coordinates?.longitude]);

  // Initialiser la vue panoramique 360°
  useEffect(() => {
    if (mode !== '360' || !panoramaUrl || !panoramaContainer.current) return;

    let cancelled = false;

    async function initializePanorama() {
      try {
        setReady(false);

        loadCss('pannellum-css', PANNELLUM_CSS);
        await loadScript('pannellum-js', PANNELLUM_JS);

        if (cancelled || !panoramaContainer.current || !window.pannellum) {
          return;
        }

        viewerRef.current?.destroy();

        viewerRef.current = window.pannellum.viewer(
          panoramaContainer.current,
          {
            type: 'equirectangular',
            panorama: panoramaUrl,
            autoLoad: true,
            showControls: true,
            showZoomCtrl: true,
            showFullscreenCtrl: true,
            compass: true,
            pitch: 0,
            yaw: 0,
            hfov: 100,
            minHfov: 40,
            maxHfov: 120,
            autoRotate: false,
            title: farmName,
            escapeHTML: true,
          }
        );

        setReady(true);
      } catch {
        if (!cancelled) {
          setError('Impossible de charger la vue panoramique 360°.');
        }
      }
    }

    initializePanorama();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [mode, panoramaUrl, farmName]);

  // Enregistrer la position GPS choisie sur la carte
  async function saveLocation() {
    if (!coordinates) {
      setError('Clique d’abord sur la carte pour choisir la position.');
      return;
    }

    setSavingLocation(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase
        .from('farm_locations')
        .upsert(
          {
            farm_id: farmId,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'farm_id' }
        );

      if (error) throw error;

      setSavedCoordinates(coordinates);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer la position.'
      );
    } finally {
      setSavingLocation(false);
    }
  }

  // Importer une image panoramique
  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choisis une image JPEG, PNG ou WebP.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const extension = file.name.split('.').pop() || 'jpg';
      const path = `${farmId}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: saveError } = await supabase
        .from('farm_panoramas')
        .upsert(
          {
            farm_id: farmId,
            image_path: path,
            title: farmName,
          },
          { onConflict: 'farm_id' }
        );

      if (saveError) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw saveError;
      }

      const { data, error: signedError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 3600);

      if (signedError) throw signedError;

      setImagePath(path);
      setPanoramaUrl(data.signedUrl);
      setMode('360');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer cette image.'
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Supprimer le panorama
  async function deletePanorama() {
    if (!imagePath) return;

    if (!window.confirm('Supprimer le panorama de cette exploitation ?')) {
      return;
    }

    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error: dbError } = await supabase
        .from('farm_panoramas')
        .delete()
        .eq('farm_id', farmId);

      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([imagePath]);

      if (storageError) throw storageError;

      setImagePath(null);
      setPanoramaUrl(null);
      setReady(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de supprimer le panorama.'
      );
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-brand-forest-100 bg-white shadow-sm">

      <div className="border-b border-brand-forest-100 p-6">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-forest-600">
          AGRONOVA IMMERSIVE
        </span>

        <h2 className="mt-2 text-xl font-semibold text-brand-forest-900">
          Exploration de votre exploitation
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          Découvrez votre ferme depuis le ciel ou en immersion panoramique.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode('satellite')}
            className={`rounded-xl px-5 py-3 text-sm font-semibold ${
              mode === 'satellite'
                ? 'bg-brand-forest-700 text-white'
                : 'border border-brand-forest-200 text-brand-forest-800'
            }`}
          >
            🛰️ Vue satellite
          </button>

          <button
            type="button"
            onClick={() => setMode('360')}
            className={`rounded-xl px-5 py-3 text-sm font-semibold ${
              mode === '360'
                ? 'bg-brand-forest-700 text-white'
                : 'border border-brand-forest-200 text-brand-forest-800'
            }`}
          >
            🌍 Vue immersive 360°
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-stone-500">
          Chargement de votre exploitation...
        </div>
      ) : (
        <>
          {mode === 'satellite' && (
            <div>
              <div
                ref={mapContainer}
                className="h-[400px] w-full sm:h-[550px]"
                aria-label={`Carte satellite de ${farmName}`}
              />

              {!mapReady && (
                <p className="p-4 text-sm text-stone-500">
                  Chargement de la carte satellite...
                </p>
              )}

              <div className="space-y-3 p-5">
                <h3 className="font-semibold text-brand-forest-900">
                  Position géographique de l'exploitation
                </h3>

                <p className="text-sm text-stone-600">
                  Clique directement sur la carte pour placer le repère de
                  ton exploitation.
                </p>

                {coordinates ? (
                  <div className="rounded-xl bg-brand-forest-50 p-4 text-sm text-brand-forest-900">
                    <p>
                      Latitude : {coordinates.latitude.toFixed(6)}
                    </p>
                    <p>
                      Longitude : {coordinates.longitude.toFixed(6)}
                    </p>

                    {savedCoordinates &&
                      savedCoordinates.latitude === coordinates.latitude &&
                      savedCoordinates.longitude === coordinates.longitude && (
                        <p className="mt-2 font-semibold text-green-700">
                          ✓ Position enregistrée
                        </p>
                      )}
                  </div>
                ) : (
                  <p className="text-sm text-stone-500">
                    Aucune position sélectionnée.
                  </p>
                )}

                <button
                  type="button"
                  onClick={saveLocation}
                  disabled={!coordinates || savingLocation}
                  className="rounded-xl bg-brand-forest-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingLocation
                    ? 'Enregistrement...'
                    : 'Enregistrer la position'}
                </button>
              </div>
            </div>
          )}

          {mode === '360' && (
            <div>
              {panoramaUrl ? (
                <>
                  <div className="relative">
                    {!ready && (
                      <div className="flex h-[350px] items-center justify-center text-sm text-stone-500">
                        Préparation de la vue immersive...
                      </div>
                    )}

                    <div
                      ref={panoramaContainer}
                      className="h-[350px] w-full sm:h-[500px]"
                      aria-label={`Vue panoramique de ${farmName}`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 p-5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="rounded-xl bg-brand-forest-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Changer le panorama
                    </button>

                    <button
                      type="button"
                      onClick={deletePanorama}
                      className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600"
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[350px] flex-col items-center justify-center bg-brand-forest-50/50 p-8 text-center">
                  <div className="mb-4 text-5xl">🌍</div>

                  <h3 className="text-lg font-semibold text-brand-forest-900">
                    Votre exploitation en 360°
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
                    Importez une photographie panoramique équirectangulaire
                    pour explorer votre exploitation en immersion.
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-5 rounded-xl bg-brand-forest-700 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {uploading ? 'Envoi en cours...' : 'Importer un panorama 360°'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />

      {error && (
        <div className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="px-5 pb-5 text-xs text-stone-500">
        La carte satellite utilise l'imagerie Esri. La vue 360° nécessite
        une image panoramique compatible au format 2:1.
      </div>
    </section>
  );
}

