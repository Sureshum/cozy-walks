// Configuración de distancias predefinidas para el slider

import type { DistanceOption, SliderConfig } from '../types';

export const DISTANCE_OPTIONS: DistanceOption[] = [
  { value: 2, label: '2 km', icon: '🌱' },
  { value: 3, label: '3 km', icon: '🌿' },
  { value: 4, label: '4 km', icon: '🍃' },
  { value: 5, label: '5 km', icon: '🌳' },
  { value: 7, label: '7 km', icon: '🏞️' },
  { value: 10, label: '10 km', icon: '⛰️' },
];

export const SLIDER_CONFIG: SliderConfig = {
  min: 2,
  max: 10,
  step: 0.5,
  marks: DISTANCE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
};

// Configuración del mapa
export const MAP_CONFIG = {
  defaultCenter: { lat: 40.4168, lng: -3.7038 }, // Madrid por defecto
  defaultZoom: 15,
  minZoom: 12,
  maxZoom: 19,
  mapId: 'cozy-walks-map',
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#fdf8f3' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c8e6f0' }],
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry',
      stylers: [{ color: '#e8f5e9' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#d4edda' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#f9efe4' }, { weight: 0.8 }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#944831' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#f0d9c4' }, { weight: 1.2 }],
    },
  ] as google.maps.MapTypeStyle[],
};

// Zonas de exclusión de ejemplo (Madrid - zonas ficticias)
export const EXCLUSION_ZONES = [
  {
    id: 'zone-1',
    name: 'Zona Industrial Norte',
    coordinates: [
      { lat: 40.4800, lng: -3.6800 },
      { lat: 40.4800, lng: -3.6600 },
      { lat: 40.4700, lng: -3.6600 },
      { lat: 40.4700, lng: -3.6800 },
    ],
    riskLevel: 'high' as const,
    color: '#ef4444',
  },
  {
    id: 'zone-2',
    name: 'Autopista M-30',
    coordinates: [
      { lat: 40.4300, lng: -3.7200 },
      { lat: 40.4300, lng: -3.6800 },
      { lat: 40.4100, lng: -3.6800 },
      { lat: 40.4100, lng: -3.7200 },
    ],
    riskLevel: 'medium' as const,
    color: '#f97316',
  },
  {
    id: 'zone-3',
    name: 'Área en Construcción',
    coordinates: [
      { lat: 40.4000, lng: -3.7100 },
      { lat: 40.4000, lng: -3.6950 },
      { lat: 40.3900, lng: -3.6950 },
      { lat: 40.3900, lng: -3.7100 },
    ],
    riskLevel: 'high' as const,
    color: '#ef4444',
  },
  {
    id: 'zone-4',
    name: 'Parque Cerrado Nocturno',
    coordinates: [
      { lat: 40.4200, lng: -3.6700 },
      { lat: 40.4200, lng: -3.6550 },
      { lat: 40.4100, lng: -3.6550 },
      { lat: 40.4100, lng: -3.6700 },
    ],
    riskLevel: 'low' as const,
    color: '#eab308',
  },
];

// Configuración del avatar
export const AVATAR_CONFIG = {
  imageUrl: `${import.meta.env.BASE_URL}avatar-walker.svg`, // Se creará después
  size: { width: 48, height: 48 },
  anchor: { x: 24, y: 48 },
  animationDuration: 300,
};

// Configuración de la ruta
export const ROUTE_CONFIG = {
  defaultWaypoints: 4,
  variance: 0.3,
  smoothingTension: 0.5,
  avoidanceMaxAttempts: 3,
  safetyBuffer: 100, // metros
  strokeColor: '#c8754a',
  strokeOpacity: 0.8,
  strokeWeight: 4,
  strokeColorActive: '#b55e3a',
  strokeOpacityActive: 1,
  strokeWeightActive: 5,
};

// Mensajes cozy para la UI
export const COZY_MESSAGES = {
  welcome: [
    "🌿 ¡Hola! ¿A dónde te apetece pasear hoy?",
    "🍃 El aire huele a aventura. ¿Nos vamos?",
    "🌱 Cada paso cuenta. Elige tu camino.",
    "🌸 Un paseo alegra el alma. ¿Distancia?",
  ],
  routing: [
    "🗺️ Trazando tu camino entre flores...",
    "🌿 Buscando la ruta más bonita...",
    "🍃 Calculando senderos secretos...",
  ],
  walking: [
    "👟 ¡Vamos! Un paso a la vez.",
    "🌸 Disfruta el camino, no solo la meta.",
    "🍃 Respira hondo, camina suave.",
  ],
  completed: [
    "🎉 ¡Lo lograste! Qué paseo tan bonito.",
    "🌟 Cada kilómetro cuenta una historia.",
    "🌿 Volverás a caminar pronto, ¿verdad?",
  ],
  error: [
    "🍂 Ups, algo salió mal. Intentémoslo de nuevo.",
    "🌧️ El mapa se nubló un momento. Recalculando...",
  ],
};