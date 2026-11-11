// Panel de información de la ruta activa

import { clsx } from 'clsx';
import type { RouteResult } from '../types';

interface RouteInfoPanelProps {
  route: RouteResult;
  mapMode: 'idle' | 'routing' | 'walking' | 'paused' | 'completed';
  targetDistance: number;
  walkedDistance?: number;
  elapsedSeconds?: number;
  savedTo?: 'firebase' | 'local' | null;
}

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes} min`;
  return `${total} s`;
};

const getWalkingPace = (distanceKm: number, durationSec: number) => {
  if (durationSec <= 0 || distanceKm <= 0) return '—';
  const paceMinPerKm = durationSec / 60 / distanceKm;
  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')} min/km`;
};

const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({
  route,
  mapMode,
  targetDistance,
  walkedDistance = 0,
  elapsedSeconds = 0,
  savedTo,
}) => {
  const routeKm = Math.round(route.distance / 100) / 10;
  const walkedKm = walkedDistance / 1000;
  const difference = Math.abs(routeKm - targetDistance);
  const isClose = difference <= 0.5;
  const isCompleted = mapMode === 'completed';
  const isWalking = mapMode === 'walking' || mapMode === 'paused';
  const hasWalkedEnough = walkedKm >= 0.05;
  const pace = hasWalkedEnough
    ? getWalkingPace(walkedKm, elapsedSeconds)
    : getWalkingPace(routeKm, route.duration);

  return (
    <div
      className="rounded-3xl bg-white/95 backdrop-blur-sm shadow-cozy-lg border border-cozy-200 overflow-hidden"
      role="region"
      aria-label="Informacion de la ruta"
    >
      {/* Header */}
      <div className={clsx('bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white relative overflow-hidden', isWalking ? 'p-3' : 'p-4')}>
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">
                {isCompleted ? '¡Paseo completado!' : 'Tu ruta de hoy'}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] md:text-[11px]">
                <span className="rounded-full bg-white/20 px-2 py-0.5 font-medium whitespace-nowrap">
                  Objetivo {targetDistance} km
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 font-medium whitespace-nowrap">
                  Ruta {routeKm} km
                </span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold">{isCompleted ? walkedKm.toFixed(1) : routeKm}</div>
            <div className="text-[10px] opacity-90">{isCompleted ? 'km andados' : 'km ruta'}</div>
          </div>
        </div>
      </div>

      <div className={clsx(isWalking ? 'p-3 space-y-2' : 'p-4 space-y-3')}>
        {/* Precisión de distancia */}
        <div
          className={clsx(
            'rounded-2xl px-3 py-2 flex items-center gap-2 text-xs',
            isClose
              ? 'bg-sage-50 border border-sage-200 text-sage-700'
              : 'bg-warm-50 border border-warm-200 text-warm-700'
          )}
        >
          <span className="text-base font-mono" aria-hidden="true">{isClose ? '+' : '*'}</span>
          <span className="font-medium">
            {isClose
              ? 'Distancia casi perfecta'
              : `Diferencia de ${difference.toFixed(1)} km con tu objetivo`}
          </span>
        </div>

        {/* Estadísticas: compactas mientras se camina (los datos en vivo están en los controles) */}
        {isWalking ? (
          <div className="hidden md:flex items-center justify-between gap-2 text-[11px] text-cozy-600">
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="font-mono">@</span> {formatDuration(route.duration)}
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="font-mono">{'>'}</span> {pace}
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="font-mono">#</span> {route.path.length} pts
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <StatCard icon="@" label="Tiempo ruta" value={formatDuration(route.duration)} />
            <StatCard icon=">" label="Ritmo medio" value={pace} />
            <StatCard icon="#" label="Puntos" value={route.path.length} />
            <StatCard icon="~" label="Tipo" value="Circular" />
          </div>
        )}

        {isCompleted && (
          <div className="rounded-2xl p-3 bg-gradient-to-r from-sage-50 to-cozy-50 border border-sage-200 text-center">
            <div className="text-2xl mb-1 font-mono">+</div>
            <p className="text-sm font-semibold text-sage-800">¡Buen trabajo!</p>
            <p className="text-xs text-sage-600 mt-0.5">
              {walkedKm.toFixed(1)} km en {formatDuration(elapsedSeconds)}.
            </p>
            {savedTo && (
              <p className="text-[10px] text-sage-500 mt-1">
                {savedTo === 'firebase' ? 'Guardado en la nube' : 'Guardado en este dispositivo'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value }) => (
  <div className="rounded-xl p-2.5 border bg-cozy-50 border-cozy-200 text-cozy-700 text-center">
    <div className="text-lg mb-0.5 font-mono" aria-hidden="true">{icon}</div>
    <div className="text-sm font-bold">{value}</div>
    <div className="text-[10px] opacity-70">{label}</div>
  </div>
);

export default RouteInfoPanel;