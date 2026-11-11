// Slider interactivo flotante para seleccionar distancia de caminata

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { clsx } from 'clsx';
import { DISTANCE_OPTIONS, COZY_MESSAGES } from '../utils/constants';
import type { DistanceOption } from '../types';

interface DistanceSliderProps {
  value: number;
  onChange: (value: number) => void;
  onStartWalk: () => void;
  disabled?: boolean;
}

const DistanceSlider: React.FC<DistanceSliderProps> = ({
  value,
  onChange,
  onStartWalk,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Encontrar la opción más cercana al valor actual
  const closestOption = useCallback(
    (val: number): DistanceOption => {
      return DISTANCE_OPTIONS.reduce((prev, curr) =>
        Math.abs(curr.value - val) < Math.abs(prev.value - val) ? curr : prev
      );
    },
    []
  );

  const currentOption = closestOption(value);

  // Mensaje estable: depende de la distancia elegida, no cambia en cada render
  const welcomeMessage = useMemo(
    () => COZY_MESSAGES.welcome[Math.round(value * 2) % COZY_MESSAGES.welcome.length],
    [value]
  );

  // Calcular posición porcentual en el slider
  const min = DISTANCE_OPTIONS[0].value;
  const max = DISTANCE_OPTIONS[DISTANCE_OPTIONS.length - 1].value;
  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      setIsDragging(true);
      handleDrag(e);
      // Prevenir selección de texto
      e.preventDefault();
    },
    [disabled]
  );

  const handleDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !trackRef.current) return;

      const track = trackRef.current;
      const rect = track.getBoundingClientRect();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const relativeX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newValue = min + relativeX * (max - min);

      // Snap a los valores predefinidos
      const snappedOption = closestOption(newValue);
      onChange(snappedOption.value);
      setHoveredValue(snappedOption.value);
    },
    [isDragging, min, max, closestOption, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setHoveredValue(null);
  }, []);

  // Event listeners globales para drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag as any);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleDrag as any, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag as any);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleDrag as any);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleDrag, handleMouseUp]);

  // Efecto de vibración háptica en móviles (si está disponible)
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Detectar cambios de valor para háptico
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (prevValueRef.current !== value && isDragging) {
      triggerHaptic();
      prevValueRef.current = value;
    }
  }, [value, isDragging, triggerHaptic]);

  return (
    <div
      ref={sliderRef}
      className={clsx(
        'relative w-full pointer-events-auto',
        disabled && 'opacity-50 pointer-events-none'
      )}
      role="slider"
      aria-label="Distancia de caminata"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} km`}
    >
      {/* Tarjeta principal del slider */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-cozy-lg border border-cozy-200 p-4 md:p-5">
        {/* Header con icono y mensaje */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-cozy-100 to-terracotta-100 flex items-center justify-center text-xl font-mono">
              {currentOption.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-cozy-800">Tu paseo de hoy</h3>
              <p className="text-xs md:text-sm text-cozy-500 truncate">{welcomeMessage}</p>
            </div>
          </div>
          {/* Indicador de valor grande */}
          <div
            className={clsx(
              'flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-200',
              'bg-gradient-to-br from-cozy-400 to-terracotta-500 text-white shadow-cozy',
              isDragging && 'scale-110 rotate-1'
            )}
            aria-hidden="true"
          >
            <span className="text-xl md:text-2xl font-bold">{value}</span>
            <span className="text-xs font-medium opacity-90 ml-0.5">km</span>
          </div>
        </div>

        {/* Track del slider */}
        <div
          ref={trackRef}
          className="relative h-3 rounded-full bg-cozy-100 mb-4"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          role="presentation"
        >
          {/* Track relleno */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-200 ease-out"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, #c8754a, #ef6f22)',
              boxShadow: '0 2px 8px rgba(200, 117, 74, 0.3)',
            }}
          />

          {/* Marcas de las opciones */}
          {DISTANCE_OPTIONS.map((option) => {
            const optPercentage = ((option.value - min) / (max - min)) * 100;
            const isActive = option.value === value;
            const isHovered = hoveredValue === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={clsx(
                  'absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-400 focus-visible:ring-offset-2',
                  isActive && 'scale-125 z-10',
                  isHovered && 'scale-115'
                )}
                style={{ left: `${optPercentage}%` }}
                onClick={() => {
                  onChange(option.value);
                  triggerHaptic();
                }}
                onMouseEnter={() => setHoveredValue(option.value)}
                onMouseLeave={() => setHoveredValue(null)}
                aria-label={`${option.label} (${option.icon})`}
                aria-current={isActive ? 'true' : 'false'}
                disabled={disabled}
              >
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full border-4 flex items-center justify-center transition-all duration-200',
                    isActive
                      ? 'bg-white border-cozy-500 shadow-cozy'
                      : 'bg-cozy-50 border-cozy-200 hover:border-cozy-300'
                  )}
                >
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-cozy-500" />
                  )}
                </div>
                <span
                  className={clsx(
                    'absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium transition-all duration-200',
                    isActive || isHovered
                      ? 'text-cozy-700 opacity-100 scale-100'
                      : 'text-cozy-400 opacity-0 scale-90 pointer-events-none'
                  )}
                >
                  {option.label}
                </span>
              </button>
            );
          })}

          {/* Thumb principal (arrastrable) */}
          <div
            className={clsx(
              'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full',
              'bg-white border-4 border-cozy-500 shadow-cozy-lg transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cozy-400 focus-visible:ring-offset-2',
              isDragging && 'scale-125 shadow-cozy-xl',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{ left: `${percentage}%` }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label="Distancia"
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            onKeyDown={(e) => {
              if (disabled) return;
              let newValue = value;
              const step = 0.5;
              switch (e.key) {
                case 'ArrowRight':
                case 'ArrowUp':
                  e.preventDefault();
                  newValue = Math.min(max, value + step);
                  break;
                case 'ArrowLeft':
                case 'ArrowDown':
                  e.preventDefault();
                  newValue = Math.max(min, value - step);
                  break;
                case 'Home':
                  e.preventDefault();
                  newValue = min;
                  break;
                case 'End':
                  e.preventDefault();
                  newValue = max;
                  break;
              }
              const snapped = closestOption(newValue);
              onChange(snapped.value);
              triggerHaptic();
            }}
          >
            <div className="w-full h-full rounded-full bg-cozy-50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cozy-500" />
            </div>
          </div>
        </div>

        {/* Etiquetas de distancia alineadas con cada marca del track */}
        <div className="relative h-5 mb-4 text-[11px] md:text-xs">
          {DISTANCE_OPTIONS.map((option, index) => {
            const optPercentage = ((option.value - min) / (max - min)) * 100;
            const isActive = option.value === value;
            return (
              <span
                key={option.value}
                className={clsx(
                  'absolute top-0 whitespace-nowrap transition-colors duration-200',
                  isActive ? 'text-cozy-700 font-semibold' : 'text-cozy-500'
                )}
                style={{
                  left: `${optPercentage}%`,
                  transform:
                    index === 0
                      ? 'translateX(0)'
                      : index === DISTANCE_OPTIONS.length - 1
                        ? 'translateX(-100%)'
                        : 'translateX(-50%)',
                }}
              >
                {option.value}
              </span>
            );
          })}
        </div>

        {/* Botón de iniciar caminata */}
        <button
          onClick={onStartWalk}
          disabled={disabled || !value}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200',
            'flex items-center justify-center gap-3',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-400 focus-visible:ring-offset-2',
            disabled
              ? 'bg-cozy-200 text-cozy-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white shadow-cozy hover:shadow-cozy-lg hover:from-cozy-600 hover:to-terracotta-600 active:scale-[0.98]'
          )}
          aria-label="Iniciar caminata"
        >
          <span className="text-2xl font-mono">{'>'}</span>
          <span>Iniciar caminata de {value} km</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        {/* Tips cozy */}
        <div className="mt-4 pt-4 border-t border-cozy-100">
          <p className="text-xs text-cozy-500 text-center">
            * La ruta cambia cada dia. Explora nuevos caminos!
          </p>
        </div>
      </div>

      {/* Decoraciones flotantes - ASCII */}
      <div className="absolute -top-3 -right-3 w-8 h-8 opacity-30 animate-float font-mono" aria-hidden="true">
        @
      </div>
      <div className="absolute -top-2 left-2 w-6 h-6 opacity-20 animate-float font-mono" style={{ animationDelay: '2s' }} aria-hidden="true">
        *
      </div>
      <div className="absolute bottom-2 -right-2 w-6 h-6 opacity-20 animate-float font-mono" style={{ animationDelay: '4s' }} aria-hidden="true">
        +
      </div>
    </div>
  );
};

export default DistanceSlider;