// Marcador de avatar personalizado para la posición del usuario (usando Marker legacy)

import { useEffect, useRef, useMemo } from 'react';
import { Marker } from '@react-google-maps/api';
import type { Coordinate } from '../types';
import { AVATAR_CONFIG } from '../utils/constants';

interface AvatarMarkerProps {
  position: Coordinate;
  heading?: number;
  mapMode: 'idle' | 'routing' | 'walking' | 'paused' | 'completed';
}

const AvatarMarker: React.FC<AvatarMarkerProps> = ({
  position,
  heading,
  mapMode,
}) => {
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Crear el icono personalizado como data URL SVG
  const customIcon = useMemo(() => {
    const size = AVATAR_CONFIG.size.width;
    const isWalking = mapMode === 'walking';
    const isPaused = mapMode === 'paused';

    // SVG del avatar como string
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
        <!-- Sombra -->
        <ellipse cx="32" cy="58" rx="18" ry="4" fill="#944831" opacity="0.15"/>
        
        <!-- Pulso cuando camina -->
        ${isWalking ? `
          <circle cx="32" cy="32" r="28" fill="#c8754a" opacity="0.15">
            <animate attributeName="r" from="20" to="32" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="32" cy="32" r="24" fill="#ef6f22" opacity="0.1">
            <animate attributeName="r" from="16" to="28" dur="2s" repeatCount="indefinite" begin="1s" />
            <animate attributeName="opacity" from="0.2" to="0" dur="2s" repeatCount="indefinite" begin="1s" />
          </circle>
        ` : ''}
        
        <!-- Cuerpo -->
        <circle cx="32" cy="42" r="16" fill="#f9efe4" stroke="#d69068" stroke-width="2"/>
        
        <!-- Cabeza -->
        <circle cx="32" cy="22" r="14" fill="#fdf3e7" stroke="#d69068" stroke-width="2"/>
        
        <!-- Orejas -->
        <ellipse cx="19" cy="22" rx="3" ry="5" fill="#fdf3e7" stroke="#d69068" stroke-width="2"/>
        <ellipse cx="45" cy="22" rx="3" ry="5" fill="#fdf3e7" stroke="#d69068" stroke-width="2"/>
        
        <!-- Cabello -->
        <path d="M20 10 Q25 5 32 8 Q39 5 44 10 Q46 14 42 16 Q38 12 32 14 Q26 12 22 16 Q18 14 20 10" fill="#8b6914" opacity="0.9"/>
        
        <!-- Gorro -->
        <path d="M20 10 Q25 0 32 -2 Q39 0 44 10" fill="#c8754a" stroke="#b55e3a" stroke-width="1.5"/>
        <circle cx="32" cy="-4" r="4" fill="#e4b896"/>
        
        <!-- Ojos -->
        <circle cx="26" cy="19" r="2.5" fill="#4a3728"/>
        <circle cx="38" cy="19" r="2.5" fill="#4a3728"/>
        <circle cx="25" cy="18" r="1" fill="white" opacity="0.8"/>
        <circle cx="37" cy="18" r="1" fill="white" opacity="0.8"/>
        
        <!-- Mejillas -->
        <ellipse cx="21" cy="24" rx="3" ry="1.5" fill="#f38d46" opacity="0.4"/>
        <ellipse cx="43" cy="24" rx="3" ry="1.5" fill="#f38d46" opacity="0.4"/>
        
        <!-- Sonrisa -->
        <path d="M26 28 Q32 31 38 28" stroke="#4a3728" stroke-width="2" fill="none" stroke-linecap="round"/>
        
        <!-- Bufanda -->
        <path d="M20 36 Q26 38 32 36 Q38 38 44 36" fill="none" stroke="#ef6f22" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M44 36 Q48 38 50 42 Q48 46 44 44" fill="none" stroke="#ef6f22" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="42" y="42" width="10" height="6" rx="1" fill="#ef6f22"/>
        <rect x="44" y="48" width="6" height="2" rx="1" fill="#d69068"/>
        
        <!-- Brazos -->
        <path d="M16 42 Q10 48 8 52" stroke="#d69068" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M48 42 Q54 48 56 52" stroke="#d69068" stroke-width="6" fill="none" stroke-linecap="round"/>
        
        <!-- Manos -->
        <circle cx="8" cy="54" r="4" fill="#fdf3e7" stroke="#d69068" stroke-width="1.5"/>
        <circle cx="56" cy="54" r="4" fill="#fdf3e7" stroke="#d69068" stroke-width="1.5"/>
        
        <!-- Botones -->
        <circle cx="32" cy="40" r="2" fill="#8b6914"/>
        <circle cx="32" cy="46" r="2" fill="#8b6914"/>
        <circle cx="32" cy="52" r="2" fill="#8b6914"/>
        
        <!-- Zapatos -->
        <ellipse cx="26" cy="60" rx="6" ry="4" fill="#4a3728"/>
        <ellipse cx="38" cy="60" rx="6" ry="4" fill="#4a3728"/>
        <ellipse cx="26" cy="58" rx="5" ry="1.5" fill="#5d4037"/>
        <ellipse cx="38" cy="58" rx="5" ry="1.5" fill="#5d4037"/>
        
        ${isPaused ? `
          <!-- Icono pausa -->
          <rect x="26" y="16" width="4" height="14" fill="#ef6f22" opacity="0.8" rx="1"/>
          <rect x="34" y="16" width="4" height="14" fill="#ef6f22" opacity="0.8" rx="1"/>
        ` : ''}
      </svg>
    `;

    // Convertir a data URL
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }, [heading, mapMode]);

  // Actualizar rotación del marker nativo si hay heading
  useEffect(() => {
    if (markerRef.current && heading !== undefined && window.google?.maps) {
      // El Marker legacy no soporta rotación nativa del icono
      // Podríamos usar un icono rotado generando diferentes SVGs
    }
  }, [heading]);

  const handleLoad = (marker: google.maps.Marker) => {
    markerRef.current = marker;
  };

  return (
    <Marker
      position={{ lat: position.lat, lng: position.lng }}
      icon={{
        url: customIcon,
        scaledSize: new window.google.maps.Size(AVATAR_CONFIG.size.width, AVATAR_CONFIG.size.height),
        anchor: new window.google.maps.Point(AVATAR_CONFIG.anchor.x, AVATAR_CONFIG.anchor.y),
      }}
      onLoad={handleLoad}
      clickable={false}
      zIndex={100}
    />
  );
};

export default AvatarMarker;