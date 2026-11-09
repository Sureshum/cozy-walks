// Leyenda de zonas de exclusión

import React from 'react';
import { clsx } from 'clsx';
import type { ExclusionZone } from '../types';

interface ExclusionZoneLegendProps {
  zones: ExclusionZone[];
}

const ExclusionZoneLegend: React.FC<ExclusionZoneLegendProps> = ({ zones }) => {
  if (zones.length === 0) return null;

  const riskLabels = {
    high: { label: 'Alto riesgo', icon: '🚫', color: 'red' },
    medium: { label: 'Precaución', icon: '⚠️', color: 'orange' },
    low: { label: 'Bajo riesgo', icon: '📍', color: 'yellow' },
  };

  const riskOrder = { high: 0, medium: 1, low: 2 };
  const sortedZones = [...zones].sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

  return (
    <div
      className="absolute top-4 right-4 md:top-8 md:right-8 z-20 pointer-events-auto animate-fade-in"
      role="region"
      aria-label="Zonas de exclusión"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-cozy-lg border border-cozy-200 p-3 min-w-[180px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🗺️</span>
          <h4 className="font-semibold text-cozy-800 text-sm">Zonas a evitar</h4>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {sortedZones.map((zone) => {
            const risk = riskLabels[zone.riskLevel];
            return (
              <div
                key={zone.id}
                className={clsx(
                  'flex items-center gap-2 p-2 rounded-xl transition-all duration-200',
                  'hover:bg-cozy-50'
                )}
                title={`${zone.name} - ${risk.label}`}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                  style={{
                    borderColor: zone.color,
                    backgroundColor: zone.riskLevel === 'high' ? zone.color : 'transparent',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-cozy-700 truncate">{zone.name}</p>
                  <p className="text-[10px] text-cozy-500 flex items-center gap-1">
                    <span aria-hidden="true">{risk.icon}</span>
                    {risk.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-cozy-400 text-center mt-2 pt-2 border-t border-cozy-100">
          La ruta evita automáticamente estas áreas
        </p>
      </div>
    </div>
  );
};

export default ExclusionZoneLegend;