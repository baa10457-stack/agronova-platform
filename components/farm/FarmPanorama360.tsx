'use client';

import { useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

declare global {
  interface Window {
    pannellum?: {
      viewer: (
        container: HTMLElement,
        config: Record<string, unknown>
      ) => {
        destroy: () => void;
      };
    };
  }
}

type FarmPanorama360Props = {
  farmId: string;
  farmName: string;
};

const PANNELLUM_CSS =
  'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.css';

const PANNELLUM_JS =
  'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.js';

const BUCKET = 'farm-panoramas';

export function FarmPanorama360({
  farmId,
  farmName,
}: FarmPanorama360Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<{ destroy: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [panoramaUrl, setPanoramaUrl] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger le panorama enregistré dans Supabase
  useEffect(() => {
    let cancelled = false;

    async function loadPanorama() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createSupabaseBrowserClient();

        const { data, error: dbError } = await supabase
          .from('farm_panoramas')
          .select('image_path')
          .eq('farm_id', farmId)
          .maybeSingle();

        if (dbError) throw dbError;

        if (!data) {
          if (!cancelled) {
            setImagePath(null);
            setPanoramaUrl(null);
          }
          return;
        }

        const { data: signedData, error: signedError } =
          await supabase.storage
            .from(BUCKET)
            .createSignedUrl(data.image_path, 3600);

        if (signedError) throw signedError;

        if (!cancelled) {
          setImagePath(data.image_path);
          setPanoramaUrl(signedData.signedUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger le panorama.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPanorama();

    return () => {
      cancelled = true;
    };
  }, [farmId]);

  // Charger le moteur Pannellum
  useEffect(() => {
    if (!panoramaUrl || !containerRef.current) return;

    let cancelled = false;

    const initialize = async () => {
      try {
        setReady(false);

        if (!document.querySelector('#pannellum-css')) {
          const link = document.createElement('link');
          link.id = 'pannellum-css';
          link.rel = 'stylesheet';
          link.href = PANNELLUM_CSS;
          document.head.appendChild(link);
        }

        if (!window.pannellum) {
          await new Promise<void>((resolve, reject) => {
            let script =
              document.querySelector<HTMLScriptElement>('#pannellum-js');

            if (script) {
              script.addEventListener('load', () => resolve(), { once: true });
              script.addEventListener('error', () => reject(), { once: true });

              if (window.pannellum) resolve();
              return;
            }

            script = document.createElement('script');
            script.id = 'pannellum-js';
            script.src = PANNELLUM_JS;
            script.onload = () => resolve();
            script.onerror = () => reject();
            document.body.appendChild(script);
          });
        }

        if (cancelled || !containerRef.current || !window.pannellum) {
          return;
        }

        viewerRef.current?.destroy();

        viewerRef.current = window.pannellum.viewer(
          containerRef.current,
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
          setError('Impossible de charger le moteur panoramique 360°.');
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [panoramaUrl, farmName]);

  // Importer et enregistrer une nouvelle image
  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Choisis un fichier image valide.');
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
      setReady(false);
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
  async function handleDelete() {
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-forest-100 p-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-forest-600">
            AGRONOVA IMMERSIVE
          </span>

          <h2 className="mt-2 text-xl font-semibold text-brand-forest-900">
            Exploration panoramique 360°
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Explorez votre exploitation agricole en immersion.
          </p>
        </div>

        <span className="rounded-full bg-brand-forest-50 px-3 py-2 text-xs font-semibold text-brand-forest-800">
          ● Vue 360°
        </span>
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-stone-500">
          Chargement du panorama...
        </div>
      ) : panoramaUrl ? (
        <div>
          <div className="relative">
            {!ready && (
              <div className="flex h-[350px] items-center justify-center text-sm text-stone-500">
                Préparation de la vue immersive...
              </div>
            )}

            <div
              ref={containerRef}
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
              {uploading ? 'Envoi en cours...' : 'Changer le panorama'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center bg-brand-forest-50/50 p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-forest-100 text-3xl">
            🌍
          </div>

          <h3 className="text-lg font-semibold text-brand-forest-900">
            Votre exploitation en 360°
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
            Importez une photographie panoramique 360° pour commencer
            l'exploration immersive de votre exploitation.
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
        Pour une véritable immersion, utilisez une image panoramique
        équirectangulaire au format 2:1.
      </div>
    </section>
  );
}
