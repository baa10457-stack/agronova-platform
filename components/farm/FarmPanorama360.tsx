'use client';

import { useEffect, useRef, useState } from 'react';

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
  panoramaUrl?: string;
  farmName: string;
};

const PANNELLUM_CSS =
  'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.css';

const PANNELLUM_JS =
  'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.js';

export function FarmPanorama360({
  panoramaUrl,
  farmName,
}: FarmPanorama360Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<{ destroy: () => void } | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!panoramaUrl || !containerRef.current) return;

    let cancelled = false;

    const initialize = async () => {
      try {
        if (!document.querySelector('#pannellum-css')) {
          const link = document.createElement('link');
          link.id = 'pannellum-css';
          link.rel = 'stylesheet';
          link.href = PANNELLUM_CSS;
          document.head.appendChild(link);
        }

        if (!window.pannellum) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>(
              '#pannellum-js'
            );

            if (existing) {
              existing.addEventListener('load', () => resolve(), { once: true });
              existing.addEventListener('error', () => reject(), { once: true });
              if (window.pannellum) resolve();
              return;
            }

            const script = document.createElement('script');
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

      {panoramaUrl ? (
        <div className="relative">
          {!ready && !error && (
            <div className="flex h-[350px] items-center justify-center text-sm text-stone-500">
              Chargement de la vue panoramique...
            </div>
          )}

          <div
            ref={containerRef}
            className="h-[350px] w-full sm:h-[500px]"
            aria-label={`Vue panoramique de ${farmName}`}
          />

          {error && (
            <div className="p-6 text-sm text-red-600">{error}</div>
          )}
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
            Aucun panorama n'est encore disponible. Une photographie
            panoramique 360° sera nécessaire pour commencer l'exploration
            immersive de votre exploitation.
          </p>

          <span className="mt-5 rounded-full border border-brand-forest-200 px-4 py-2 text-xs font-semibold text-brand-forest-700">
            En attente du premier panorama
          </span>
        </div>
      )}
    </section>
  );
}
