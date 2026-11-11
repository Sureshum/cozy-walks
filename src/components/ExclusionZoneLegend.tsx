// Leyenda de zonas de exclusión (plegable, sin posicionamiento absoluto)

import React from 'react';
import { clsx } from 'clsx';
import type { ExclusionZone } from '../types';

interface ExclusionZoneLegendProps {
  zones: ExclusionZone[];
}

const riskLabels = {
  high: { label: 'Alto riesgo', icon: '#' },
  medium: { label: 'Precaucion', icon: '!' },
  low: { label: 'Bajo riesgo', icon: '*' },
};

const riskOrder = { high: 0, medium: 1, low: 2 };

const ExclusionZoneLegend: React.FC<ExclusionZoneLegendProps> = ({ zones }) => {
  if (zones.length === 0) return null;

  const sortedZones = [...zones].sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

  return (
    <details
      className="group rounded-2xl bg-white/95 backdrop-blur-sm shadow-cozy-lg border border-cozy-200 overflow-hidden"
      aria-label="Zonas de exclusion"
    >
      <summary className="flex items-center justify-between gap-2 p-3 cursor-pointer list-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-400">
        <span className="flex items-center gap-2 text-sm font-semibold text-cozy-800">
          <span aria-hidden="true" className="font-mono">+</span>
          Zonas a evitar
          <span className="text-[10px] font-medium text-cozy-500 bg-cozy-100 rounded-full px-1.5 py-0.5">
            {zones.length}
          </span>
        </span>
        <svg
          className="w-4 h-4 text-cozy-500 transition-transform duration-200 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>

      <div className="px-3 pb-3">
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {sortedZones.map((zone) => {
            const risk = riskLabels[zone.riskLevel];
            return (
              <div
                key={zone.id}
                className="flex items-center gap-2 p-2 rounded-xl transition-all duration-200 hover:bg-cozy-50"
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
                  <p className={clsx('text-[10px] flex items-center gap-1', 'text-cozy-500')}>
                    <span aria-hidden="true" className="font-mono">{risk.icon}</span>
                    {risk.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-cozy-400 text-center mt-2 pt-2 border-t border-cozy-100">
          La ruta evita automaticamente estas areas
        </p>
      </div>
    </details>
  );
};

export default ExclusionZoneLegend;