// Controles del mapa (pausar, reanudar, completar, cancelar)

import React from 'react';
import { clsx } from 'clsx';
import type { MapMode, RouteResult, UserLocation } from '../types';

interface MapControlsProps {
  mapMode: MapMode;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onCancel: () => void;
  userLocation: UserLocation | null;
  currentRoute: RouteResult | null;
}

const MapControls: React.FC<MapControlsProps> = ({
  mapMode,
  onPause,
  onResume,
  onComplete,
  onCancel,
  userLocation,
  currentRoute,
}) => {
  const isActive = mapMode === 'walking' || mapMode === 'paused' || mapMode === 'completed';

  if (!isActive) return null;

  const getProgress = () => {
    if (!currentRoute || !userLocation) return 0;
    // Cálculo simplificado: distancia recorrida / distancia objetivo
    // En producción se usaría el progreso real a lo largo de la ruta
    return Math.min(100, Math.random() * 100); // Placeholder
  };

  const progress = getProgress();

  const isWalking = mapMode === 'walking';
  const isPaused = mapMode === 'paused';
  const isCompleted = mapMode === 'completed';

  return (
    <>
      {/* Barra de progreso superior */}
      <div className="absolute top-4 left-4 right-4 md:top-8 md:left-auto md:right-8 md:w-80 z-30 animate-slide-down">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-cozy-lg border border-cozy-200 p-4">
          {/* Header con estado */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-3 h-3 rounded-full',
                  isWalking && 'bg-sage-500 animate-pulse-soft',
                  isPaused && 'bg-warm-500',
                  isCompleted && 'bg-cozy-500'
                )}
              />
              <span className="text-sm font-semibold text-cozy-700 capitalize">
                {isWalking && 'Caminando'}
                {isPaused && 'Pausado'}
                {isCompleted && 'Completado'}
              </span>
            </div>
            <span className="text-xs text-cozy-500 font-mono">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="h-2.5 bg-cozy-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #5e8f5a, #7db078)',
              }}
            />
          </div>

          {/* Stats en fila */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-cozy-50 rounded-xl">
              <div className="text-lg font-bold text-cozy-700">{currentRoute ? Math.round(currentRoute.distance / 1000 * 10) / 10 : 0} km</div>
              <div className="text-xs text-cozy-500">Total</div>
            </div>
            <div className="p-2 bg-cozy-50 rounded-xl">
              <div className="text-lg font-bold text-cozy-700">{currentRoute ? Math.round(currentRoute.duration / 60) : 0} min</div>
              <div className="text-xs text-cozy-500">Estimado</div>
            </div>
            <div className="p-2 bg-cozy-50 rounded-xl">
              <div className="text-lg font-bold text-cozy-700">
                {userLocation?.speed ? Math.round(userLocation.speed * 3.6 * 10) / 10 : '—'} km/h
              </div>
              <div className="text-xs text-cozy-500">Ritmo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción flotantes */}
      <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-80 z-30 animate-slide-up">
        <div className="flex gap-3">
          {/* Botón cancelar */}
          <button
            onClick={onCancel}
            className={clsx(
              'flex-1 py-3 rounded-2xl font-semibold transition-all duration-200',
              'flex items-center justify-center gap-2',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-400 focus-visible:ring-offset-2',
              'bg-white/90 backdrop-blur-sm border border-cozy-200 text-cozy-600',
              'hover:bg-cozy-50 hover:border-cozy-300 active:scale-[0.98]',
              'shadow-cozy'
            )}
            aria-label="Cancelar caminata"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Cancelar</span>
          </button>

          {isWalking && (
            <>
              {/* Botón pausar */}
              <button
                onClick={onPause}
                className={clsx(
                  'flex-1 py-3 rounded-2xl font-semibold transition-all duration-200',
                  'flex items-center justify-center gap-2',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-400 focus-visible:ring-offset-2',
                  'bg-gradient-to-r from-warm-400 to-warm-500 text-white',
                  'hover:from-warm-500 hover:to-warm-600 active:scale-[0.98]',
                  'shadow-cozy'
                )}
                aria-label="Pausar caminata"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                <span>Pausar</span>
              </button>

              {/* Botón completar */}
              <button
                onClick={onComplete}
                className={clsx(
                  'flex-1 py-3 rounded-2xl font-semibold transition-all duration-200',
                  'flex items-center justify-center gap-2',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2',
                  'bg-gradient-to-r from-sage-500 to-sage-600 text-white',
                  'hover:from-sage-600 hover:to-sage-700 active:scale-[0.98]',
                  'shadow-cozy'
                )}
                aria-label="Completar caminata"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Finalizar</span>
              </button>
            </>
          )}

          {isPaused && (
            <>
              {/* Botón reanudar */}
              <button
                onClick={onResume}
                className={clsx(
                  'flex-1 py-3 rounded-2xl font-semibold transition-all duration-200',
                  'flex items-center justify-center gap-2',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2',
                  'bg-gradient-to-r from-sage-500 to-sage-600 text-white',
                  'hover:from-sage-600 hover:to-sage-700 active:scale-[0.98]',
                  'shadow-cozy'
                )}
                aria-label="Reanudar caminata"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Continuar</span>
              </button>

              {/* Botón finalizar */}
              <button
                onClick={onComplete}
                className={clsx(
                  'flex-1 py-3 rounded-2xl font-semibold transition-all duration-200',
                  'flex items-center justify-center gap-2',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-400 focus-visible:ring-offset-2',
                  'bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white',
                  'hover:from-cozy-600 hover:to-terracotta-600 active:scale-[0.98]',
                  'shadow-cozy'
                )}
                aria-label="Finalizar caminata"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Finalizar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MapControls;