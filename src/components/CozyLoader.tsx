// Loader cozy con animaciones suaves

import React from 'react';
import { clsx } from 'clsx';

interface CozyLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CozyLoader: React.FC<CozyLoaderProps> = ({
  message = 'Cargando...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-4',
        'bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-cozy',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative" aria-hidden="true">
        {/* Anillos rotatorios */}
        <div className={clsx('absolute inset-0 border-3 border-cozy-200 rounded-full', sizeClasses[size])} />
        <div
          className={clsx(
            'absolute inset-0 border-3 border-transparent border-t-cozy-500 rounded-full animate-spin',
            sizeClasses[size]
          )}
        />
        <div
          className={clsx(
            'absolute inset-2 border-2 border-transparent border-b-terracotta-400 rounded-full animate-spin reverse',
            sizeClasses[size]
          )}
        />
        {/* Icono central */}
        <div
          className={clsx(
            'absolute inset-0 flex items-center justify-center text-2xl md:text-3xl lg:text-4xl animate-bounce-gentle',
            sizeClasses[size]
          )}
        >
          🌿
        </div>
      </div>

      <div className="text-center">
        <p className={clsx('font-medium text-cozy-700', textSizeClasses[size])}>
          {message}
        </p>
        <p className={clsx('text-cozy-400 mt-1', textSizeClasses[size])}>
          Preparando tu paseo perfecto...
        </p>
      </div>

      {/* Decoraciones */}
      <div className="flex gap-2 mt-2" aria-hidden="true">
        <span className="text-lg animate-float" style={{ animationDelay: '0s' }}>🍃</span>
        <span className="text-lg animate-float" style={{ animationDelay: '0.5s' }}>🌸</span>
        <span className="text-lg animate-float" style={{ animationDelay: '1s' }}>🌱</span>
      </div>
    </div>
  );
};

export default CozyLoader;