// Controles del mapa (pausar, reanudar, completar, cancelar, otra ruta)

import React from 'react';
import { clsx } from 'clsx';
import type { MapMode, RouteResult } from '../types';

interface MapControlsProps {
  mapMode: MapMode;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onReroll: () => void;
  isRerolling?: boolean;
  currentRoute: RouteResult | null;
  targetDistance: number;
  walkedDistance: number;
  elapsedSeconds: number;
}

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const MapControls: React.FC<MapControlsProps> = ({
  mapMode,
  onPause,
  onResume,
  onComplete,
  onCancel,
  onReroll,
  isRerolling = false,
  currentRoute,
  targetDistance,
  walkedDistance,
  elapsedSeconds,
}) => {
  const isActive = mapMode === 'walking' || mapMode === 'paused';
  if (!isActive) return null;

  const isWalking = mapMode === 'walking';
  const isPaused = mapMode === 'paused';

  const targetMeters = Math.max(1, targetDistance * 1000);
  const progress = Math.min(100, Math.round((walkedDistance / targetMeters) * 100));
  const remainingKm = Math.max(0, targetDistance - walkedDistance / 1000);
  const walkedKm = walkedDistance / 1000;
  const speedKmh = elapsedSeconds > 5 ? (walkedKm / elapsedSeconds) * 3600 : 0;

  return (
    <div className="rounded-3xl bg-white/95 backdrop-blur-sm shadow-cozy-lg border border-cozy-200 p-3 md:p-5">
      {/* Estado + progreso */}
      <div className="flex items-center justify-between gap-3 mb-1.5 md:mb-2">
        <div className="hidden md:flex items-center gap-2">
          <span
            className={clsx(
              'w-2.5 h-2.5 rounded-full',
              isWalking && 'bg-sage-500 animate-pulse-soft',
              isPaused && 'bg-warm-500'
            )}
          />
          <span className="text-sm font-semibold text-cozy-700">
            {isWalking ? 'Caminando' : 'En pausa'}
          </span>
        </div>
        <span className="text-xs font-mono text-cozy-500 ml-auto tabular-nums">{progress}%</span>
      </div>

      <div className="h-2 md:h-2.5 bg-cozy-100 rounded-full overflow-hidden mb-3 md:mb-4">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #5e8f5a, #7db078)',
          }}
        />
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-1.5 md:gap-2 text-center mb-3 md:mb-4">
        <div className="p-1.5 md:p-2 bg-cozy-50 rounded-xl">
          <div className="text-sm md:text-lg font-bold text-cozy-700 tabular-nums">{walkedKm.toFixed(1)}</div>
          <div className="text-[9px] md:text-xs text-cozy-500">km andados</div>
        </div>
        <div className="p-1.5 md:p-2 bg-cozy-50 rounded-xl">
          <div className="text-sm md:text-lg font-bold text-cozy-700 tabular-nums">{formatDuration(elapsedSeconds)}</div>
          <div className="text-[9px] md:text-xs text-cozy-500">tiempo</div>
        </div>
        <div className="p-1.5 md:p-2 bg-cozy-50 rounded-xl">
          <div className="text-sm md:text-lg font-bold text-cozy-700 tabular-nums">
            {speedKmh > 0 ? speedKmh.toFixed(1) : '—'}
          </div>
          <div className="text-[9px] md:text-xs text-cozy-500">km/h</div>
        </div>
      </div>

      <p className="text-[10px] md:text-[11px] text-cozy-400 text-center mb-2.5 md:mb-3 tabular-nums">
        Te quedan ~{remainingKm.toFixed(1)} km
        {currentRoute ? ` · ruta de ${(currentRoute.distance / 1000).toFixed(1)} km` : ''}
      </p>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-1.5 md:gap-2">
        <button
          onClick={onReroll}
          disabled={isRerolling}
          className={clsx(
            'py-2.5 md:py-3 rounded-2xl font-semibold text-sm transition-all duration-200',
            'flex items-center justify-center gap-2',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-400 focus-visible:ring-offset-2',
            'bg-white border border-cozy-200 text-cozy-700',
            'hover:bg-cozy-50 active:scale-[0.98] shadow-cozy',
            isRerolling && 'opacity-60 cursor-wait'
          )}
          aria-label="Generar otra ruta"
        >
          <svg className={clsx('w-4 h-4', isRerolling && 'animate-spin')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRerolling ? 'Buscando...' : 'Otra ruta'}
        </button>

        <button
          onClick={onCancel}
          className={clsx(
            'py-2.5 md:py-3 rounded-2xl font-semibold text-sm transition-all duration-200',
            'flex items-center justify-center gap-2',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-400 focus-visible:ring-offset-2',
            'bg-white border border-cozy-200 text-cozy-600',
            'hover:bg-cozy-50 active:scale-[0.98] shadow-cozy'
          )}
          aria-label="Cancelar caminata"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancelar
        </button>

        {isWalking ? (
          <button
            onClick={onPause}
            className={clsx(
              'py-2.5 md:py-3 rounded-2xl font-semibold text-sm transition-all duration-200',
              'flex items-center justify-center gap-2',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-400 focus-visible:ring-offset-2',
              'bg-gradient-to-r from-warm-400 to-warm-500 text-white',
              'hover:from-warm-500 hover:to-warm-600 active:scale-[0.98] shadow-cozy'
            )}
            aria-label="Pausar caminata"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            Pausar
          </button>
        ) : (
          <button
            onClick={onResume}
            className={clsx(
              'py-2.5 md:py-3 rounded-2xl font-semibold text-sm transition-all duration-200',
              'flex items-center justify-center gap-2',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2',
              'bg-gradient-to-r from-sage-500 to-sage-600 text-white',
              'hover:from-sage-600 hover:to-sage-700 active:scale-[0.98] shadow-cozy'
            )}
            aria-label="Reanudar caminata"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Continuar
          </button>
        )}

        <button
          onClick={onComplete}
          className={clsx(
            'py-2.5 md:py-3 rounded-2xl font-semibold text-sm transition-all duration-200',
            'flex items-center justify-center gap-2',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2',
            'bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white',
            'hover:from-cozy-600 hover:to-terracotta-600 active:scale-[0.98] shadow-cozy'
          )}
          aria-label="Finalizar caminata"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Finalizar
        </button>
      </div>
    </div>
  );
};

export default MapControls;
