// Panel de información de la ruta activa

import { clsx } from 'clsx';
import type { RouteResult } from '../types';

interface RouteInfoPanelProps {
  route: RouteResult;
  mapMode: 'idle' | 'routing' | 'walking' | 'paused' | 'completed';
  targetDistance: number;
}

const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({
  route,
  mapMode,
  targetDistance,
}) => {
  const actualDistanceKm = Math.round(route.distance / 100) / 10;
  const targetDistanceKm = targetDistance;
  const difference = Math.abs(actualDistanceKm - targetDistanceKm);
  const isClose = difference <= 0.5;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes} min`;
  };

  const getWalkingPace = (distanceKm: number, durationSec: number) => {
    if (durationSec === 0) return '—';
    const paceMinPerKm = durationSec / 60 / distanceKm;
    const min = Math.floor(paceMinPerKm);
    const sec = Math.round((paceMinPerKm - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')} min/km`;
  };

  const pace = getWalkingPace(actualDistanceKm, route.duration);

  return (
    <div
      className={clsx(
        'absolute bottom-4 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-80',
        'z-20 animate-slide-up pointer-events-auto'
      )}
      role="region"
      aria-label="Información de la ruta"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-cozy-lg border border-cozy-200 overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white p-4 md:p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" aria-hidden="true">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
              <path d="M0,50 Q25,30 50,50 T100,50 V100 H0 Z" />
            </svg>
          </div>
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tu ruta de hoy</h3>
                <p className="text-xs opacity-90">Distancia objetivo: {targetDistanceKm} km</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{actualDistanceKm} km</div>
              <div className="text-xs opacity-90">Distancia real</div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 md:p-5 space-y-4">
          {/* Indicador de precisión de distancia */}
          <div
            className={clsx(
              'rounded-2xl p-4 flex items-center justify-center gap-3',
              'transition-all duration-300',
              isClose
                ? 'bg-sage-50 border border-sage-200'
                : 'bg-warm-50 border border-warm-200'
            )}
          >
            <div
              className={clsx(
                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                isClose ? 'bg-sage-100 text-sage-600' : 'bg-warm-100 text-warm-600'
              )}
            >
              {isClose ? '✨' : '🎯'}
            </div>
            <div className="flex-1 text-center">
              <p className="text-sm font-medium text-cozy-700">
                {isClose
                  ? '¡Distancia casi perfecta!'
                  : `Diferencia: ${difference.toFixed(1)} km`}
              </p>
              <p className="text-xs text-cozy-500 mt-0.5">
                {isClose
                  ? 'La ruta se ajusta muy bien a tu objetivo'
                  : 'Cada ruta es única, ¡disfruta el camino!'}
              </p>
            </div>
          </div>

          {/* Grid de estadísticas */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="⏱️"
              label="Tiempo estimado"
              value={formatDuration(route.duration)}
              color="cozy"
            />
            <StatCard
              icon="👟"
              label="Ritmo medio"
              value={pace}
              color="sage"
            />
            <StatCard
              icon="📍"
              label="Puntos de ruta"
              value={route.path.length}
              color="terracotta"
            />
            <StatCard
              icon="🔄"
              label="Tipo"
              value="Circular"
              color="warm"
            />
          </div>

          {/* Información adicional en modo walking */}
          {(mapMode === 'walking' || mapMode === 'paused') && (
            <div className="pt-2 border-t border-cozy-100">
              <p className="text-xs text-cozy-500 text-center mb-2">
                Mantén el teléfono a la vista para mejor seguimiento GPS
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-cozy-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-500 animate-pulse-soft" />
                  GPS activo
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cozy-500" />
                  Ruta cargada
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500" />
                  {route.path.length} waypoints
                </span>
              </div>
            </div>
          )}

          {/* Mensaje motivacional al completar */}
          {mapMode === 'completed' && (
            <div className="bg-gradient-to-r from-sage-50 to-cozy-50 rounded-2xl p-4 border border-sage-200 text-center animate-fade-in">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-semibold text-sage-800">¡Caminata completada!</p>
              <p className="text-sm text-sage-600 mt-1">
                Recorriste {actualDistanceKm} km en {formatDuration(route.duration)}.
                <br />Tu avatar descansa feliz 🌿
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: 'cozy' | 'sage' | 'terracotta' | 'warm';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    cozy: 'bg-cozy-50 border-cozy-200 text-cozy-700',
    sage: 'bg-sage-50 border-sage-200 text-sage-700',
    terracotta: 'bg-terracotta-50 border-terracotta-200 text-terracotta-700',
    warm: 'bg-warm-50 border-warm-200 text-warm-700',
  };

  return (
    <div className={clsx('rounded-2xl p-3 border text-center', colorClasses[color])}>
      <div className="text-2xl mb-1" aria-hidden="true">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-70 mt-0.5">{label}</div>
    </div>
  );
};

export default RouteInfoPanel;