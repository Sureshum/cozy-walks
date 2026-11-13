// Mapa con Leaflet + OpenStreetMap (100% gratis, sin API key, sin límites)

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Circle,
  Polygon,
  useMapEvents,
  useMap,
  Marker,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { clsx } from 'clsx';
import type { Coordinate, RouteResult, ExclusionZone, UserLocation, MapMode } from '../types';
import { haversineDistance, calculateBearing, calculateBounds, generateDailyWaypoints, routeCrossesExclusionZones, avoidExclusionZones, smoothPath } from '../utils/routeUtils';
import { ROUTE_CONFIG } from '../utils/constants';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useGeolocation, useSmoothedLocation } from '../hooks/useGeolocation';
import { persistWalk, type PersistWalkResult } from '../lib/walkStore';
import DistanceSlider from './DistanceSlider';
import MapControls from './MapControls';
import RouteInfoPanel from './RouteInfoPanel';
import ExclusionZoneLegend from './ExclusionZoneLegend';
import Leaderboard from './Leaderboard';

// Icono personalizado para el avatar.
// Se cachea por modo + rumbo (redondeado) para que Leaflet no reemplace el DOM
// del marcador en cada render y el "monito" no parpadee al caminar.
const avatarIconCache = new Map<string, L.DivIcon>();

const createAvatarIcon = (mapMode: string, heading?: number) => {
  const isWalking = mapMode === 'walking';
  const isPaused = mapMode === 'paused';
  const roundedHeading = heading === undefined || Number.isNaN(heading)
    ? undefined
    : (Math.round(heading / 15) * 15 + 360) % 360;
  const cacheKey = `${mapMode}|${roundedHeading ?? 'none'}`;
  const cached = avatarIconCache.get(cacheKey);
  if (cached) return cached;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64">
      <!-- Sombra -->
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#944831" opacity="0.15"/>

      ${isWalking ? `
        <!-- Pulso cuando camina -->
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

      ${roundedHeading !== undefined ? `
        <!-- Flecha de dirección -->
        <g transform="rotate(${roundedHeading} 32 32)">
          <path d="M32 6 L28 14 L32 10 L36 14 Z" fill="#c8754a" stroke="#b55e3a" stroke-width="1.5"/>
        </g>
      ` : ''}
    </svg>
  `;

  const icon = L.divIcon({
    className: 'custom-avatar-icon',
    html: svg,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });

  avatarIconCache.set(cacheKey, icon);
  return icon;
};

// Icono para el inicio de ruta
const startIcon = L.divIcon({
  className: 'start-marker',
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#5e8f5a;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Flechas de guía a lo largo de la ruta (una cada ~120-200 m según la longitud).
const routeArrowIconCache = new Map<number, L.DivIcon>();

const createRouteArrowIcon = (bearing: number) => {
  const degrees = ((Math.round(bearing / 5) * 5) % 360 + 360) % 360;
  const cached = routeArrowIconCache.get(degrees);
  if (cached) return cached;

  const icon = L.divIcon({
    className: 'route-arrow-icon',
    html: `
      <div style="width:20px;height:20px;transform:rotate(${degrees}deg);transform-origin:50% 50%;filter:drop-shadow(0 1px 1px rgba(118,60,45,0.45));">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
          <path d="M5 15.5 L12 6 L19 15.5" fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
          <path d="M5 15.5 L12 6 L19 15.5" fill="none" stroke="#b55e3a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  routeArrowIconCache.set(degrees, icon);
  return icon;
};

interface RouteArrow {
  coordinate: Coordinate;
  bearing: number;
}

const buildRouteArrows = (path: Coordinate[], totalDistance: number): RouteArrow[] => {
  if (path.length < 2) return [];

  const spacing = Math.min(200, Math.max(120, totalDistance / 60));
  const arrows: RouteArrow[] = [];
  let sincePrevious = 0;

  for (let i = 0; i < path.length - 1 && arrows.length < 120; i++) {
    const from = path[i];
    const to = path[i + 1];
    const segment = haversineDistance(from, to);
    if (segment < 0.5) continue;

    let travelled = 0;
    while (sincePrevious + (segment - travelled) >= spacing && arrows.length < 120) {
      const step = spacing - sincePrevious;
      const t = (travelled + step) / segment;
      if (t > 1) break;

      arrows.push({
        coordinate: {
          lat: from.lat + (to.lat - from.lat) * t,
          lng: from.lng + (to.lng - from.lng) * t,
        },
        bearing: calculateBearing(from, to),
      });

      travelled += step;
      sincePrevious = 0;
    }

    sincePrevious += segment - travelled;
  }

  return arrows;
};

// Puente fiable con la instancia del mapa.
// No usamos el evento "load" porque en react-leaflet 5 se dispara antes de
// que los hijos se monten y la instancia se quedaba en null (por eso "Mi
// ubicación" y el encuadre de la ruta no hacían nada).
const MapInstanceBridge = ({ onReady }: { onReady: (map: L.Map) => void }) => {
  const map = useMap();

  useEffect(() => {
    if (map) onReady(map);
  }, [map, onReady]);

  return null;
};

// Sigue al usuario mientras camina (sin marear) y avisa si el usuario mueve el mapa
const MapFollowController = ({
  userLocation,
  mapMode,
  follow,
  onUserInteract,
}: {
  userLocation: UserLocation | null;
  mapMode: string;
  follow: boolean;
  onUserInteract: () => void;
}) => {
  const map = useMap();

  useMapEvents({
    dragstart: () => onUserInteract(),
  });

  useEffect(() => {
    if (!map || !userLocation || !follow) return;
    if (mapMode !== 'walking' && mapMode !== 'paused') return;

    const target = L.latLng(userLocation.coordinate.lat, userLocation.coordinate.lng);
    // Zona muerta: solo recentra cuando el avatar se acerca al borde.
    // Así el mapa no "tiembla" con cada lectura del GPS.
    const safeArea = map.getBounds().pad(-0.2);
    if (!safeArea.contains(target)) {
      map.panTo(target, { animate: true, duration: 0.6 });
    }
  }, [map, userLocation, mapMode, follow]);

  return null;
};

// Avatar del usuario: se crea una sola vez y se desliza suavemente hasta cada
// lectura del GPS. Así el monito sigue al usuario sin parpadeos ni saltos.
const AvatarMarker = ({
  userLocation,
  mapMode,
}: {
  userLocation: UserLocation;
  mapMode: string;
}) => {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const currentRef = useRef<L.LatLng | null>(null);
  const frameRef = useRef<number | null>(null);
  const headingRef = useRef<number | undefined>(userLocation.heading);

  headingRef.current = userLocation.heading;
  const headingKey = userLocation.heading === undefined || userLocation.heading === null
    ? 'none'
    : Math.round(userLocation.heading / 15) * 15;

  useEffect(() => {
    const start = L.latLng(userLocation.coordinate.lat, userLocation.coordinate.lng);
    const marker = L.marker(start, {
      icon: createAvatarIcon(mapMode, userLocation.heading),
      zIndexOffset: 1000,
      keyboard: false,
      alt: 'Tu posición',
    });

    marker.bindPopup(
      '<div style="text-align:center;padding:2px;font-family:inherit;">' +
        '<div style="font-weight:600;color:#763c2d;"># Tu posición</div>' +
        '<div style="font-size:11px;color:#c8754a;">Precisión: ~' + Math.round(userLocation.accuracy) + 'm</div>' +
      '</div>'
    );
    marker.addTo(map);
    markerRef.current = marker;
    currentRef.current = start;

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      marker.remove();
      markerRef.current = null;
      currentRef.current = null;
    };
    // Solo se recrea si cambia la instancia del mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // El icono solo se regenera cuando cambia el modo o el rumbo (cada 15°).
  useEffect(() => {
    markerRef.current?.setIcon(createAvatarIcon(mapMode, headingRef.current));
  }, [mapMode, headingKey]);

  // Interpolación suave entre la posición actual y la nueva lectura del GPS.
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const target = L.latLng(userLocation.coordinate.lat, userLocation.coordinate.lng);
    const from = currentRef.current ?? target;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (from.distanceTo(target) < 0.4) {
      marker.setLatLng(target);
      currentRef.current = target;
      return;
    }

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      marker.setLatLng(target);
      currentRef.current = target;
      return;
    }

    const startedAt = performance.now();
    const duration = 600;
    const startLat = from.lat;
    const startLng = from.lng;

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const next = L.latLng(
        startLat + (target.lat - startLat) * eased,
        startLng + (target.lng - startLng) * eased
      );

      marker.setLatLng(next);
      currentRef.current = next;

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        currentRef.current = target;
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [userLocation]);

  return null;
};

// Componente principal del mapa
function MapComponent({
  center,
  zoom,
  route,
  userLocation,
  exclusionZones,
  mapMode,
  followUser,
  onMapReady,
  onUserInteract,
}: {
  center: Coordinate;
  zoom: number;
  route: RouteResult | null;
  userLocation: UserLocation | null;
  exclusionZones: ExclusionZone[];
  mapMode: 'idle' | 'routing' | 'walking' | 'paused' | 'completed';
  followUser: boolean;
  onMapReady: (map: L.Map) => void;
  onUserInteract: () => void;
}) {
  const routeArrows = useMemo(
    () => (route ? buildRouteArrows(route.path, route.distance) : []),
    [route]
  );

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      zoomControl={false}
      scrollWheelZoom={true}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
        zIndex: 1,
      }}
    >
      <MapInstanceBridge onReady={onMapReady} />
      <MapFollowController
        userLocation={userLocation}
        mapMode={mapMode}
        follow={followUser}
        onUserInteract={onUserInteract}
      />

      {/* Capa base OpenStreetMap (100% gratis, sin API key, sin límites) */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        subdomains={['a', 'b', 'c']}
        maxZoom={19}
        minZoom={12}
      />

      {/* Zonas de exclusión */}
      {exclusionZones.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
          color={zone.color}
          fillColor={zone.color}
          fillOpacity={0.15}
          weight={2}
          opacity={0.6}
        />
      ))}

      {/* Ruta calculada */}
      {route && (
        <Polyline
          positions={route.path.map((c) => [c.lat, c.lng] as [number, number])}
          color={mapMode === 'walking' || mapMode === 'paused'
            ? ROUTE_CONFIG.strokeColorActive
            : ROUTE_CONFIG.strokeColor}
          weight={mapMode === 'walking' || mapMode === 'paused'
            ? ROUTE_CONFIG.strokeWeightActive
            : ROUTE_CONFIG.strokeWeight}
          opacity={mapMode === 'walking' || mapMode === 'paused'
            ? ROUTE_CONFIG.strokeOpacityActive
            : ROUTE_CONFIG.strokeOpacity}
          lineCap="round"
          lineJoin="round"
          smoothFactor={1}
        />
      )}

      {/* Flechas que indican el sentido de la ruta */}
      {routeArrows.map((arrow, index) => (
        <Marker
          key={`route-arrow-${index}`}
          position={[arrow.coordinate.lat, arrow.coordinate.lng]}
          icon={createRouteArrowIcon(arrow.bearing)}
          interactive={false}
          keyboard={false}
          zIndexOffset={200}
        />
      ))}

      {/* Marcador de inicio de ruta */}
      {route && route.path.length > 0 && (
        <Marker
          position={[route.path[0].lat, route.path[0].lng]}
          icon={startIcon}
        />
      )}

      {/* Avatar del usuario (sigue la posición GPS con movimiento suave) */}
      {userLocation && (
        <AvatarMarker userLocation={userLocation} mapMode={mapMode} />
      )}

      {/* Círculo de precisión GPS */}
      {userLocation && userLocation.accuracy > 0 && mapMode === 'walking' && (
        <Circle
          center={[userLocation.coordinate.lat, userLocation.coordinate.lng]}
          radius={userLocation.accuracy}
          pathOptions={{
            fillColor: '#c8754a',
            fillOpacity: 0.08,
            color: 'transparent',
            weight: 0,
          }}
        />
      )}
    </MapContainer>
  );
}

// Botón de acción del HUD
interface MapActionButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  accent?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

const MapActionButton: React.FC<MapActionButtonProps> = ({
  label,
  onClick,
  active = false,
  accent = false,
  disabled = false,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={clsx(
      'h-11 w-11 md:h-11 md:w-auto md:px-3 md:py-2 rounded-xl flex items-center justify-center gap-1.5',
      'border shadow-cozy backdrop-blur-sm transition-all duration-200',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-400 focus-visible:ring-offset-2',
      'active:scale-95',
      accent
        ? active
          ? 'bg-gradient-to-br from-cozy-500 to-terracotta-500 border-cozy-500 text-white'
          : 'bg-white/90 border-cozy-200 text-cozy-700 hover:bg-white'
        : 'bg-white/90 border-cozy-200 text-cozy-700 hover:bg-white',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    {children}
    <span className="hidden md:inline text-sm font-medium whitespace-nowrap">{label}</span>
  </button>
);

const MODE_LABEL: Record<MapMode, string> = {
  idle: 'Listo para pasear',
  routing: 'Trazando ruta…',
  walking: 'Caminando',
  paused: 'En pausa',
  completed: 'Paseo completado',
  leaderboard: 'Ranking',
};

const MODE_DOT: Record<MapMode, string> = {
  idle: 'bg-cozy-400',
  routing: 'bg-terracotta-400 animate-pulse',
  walking: 'bg-sage-500 animate-pulse-soft',
  paused: 'bg-warm-500',
  completed: 'bg-sage-500',
  leaderboard: 'bg-cozy-400',
};

function MapScreenContent() {
  const {
    mapMode,
    selectedDistance,
    currentRoute,
    exclusionZones,
    setUserLocation,
    setCurrentRoute,
    setMapMode,
    setSelectedDistance,
  } = useApp();
  const { user, logout } = useAuth();

  const [mapCenter, setMapCenter] = useState<Coordinate>({ lat: 40.4168, lng: -3.7038 });
  const [mapZoom] = useState(15);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Seguimiento del paseo
  const [walkedMeters, setWalkedMeters] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savedTo, setSavedTo] = useState<PersistWalkResult | null>(null);
  const [isRerolling, setIsRerolling] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  const variantRef = useRef(0);
  const startedAtRef = useRef<Date | null>(null);
  const lastTrackedRef = useRef<{ coordinate: Coordinate; timestamp: number } | null>(null);
  const hasCenteredRef = useRef(false);

  // Geolocalización
  const { location: rawLocation, isSupported } = useGeolocation({
    onError: (err) => console.warn('Geolocation error:', err.message),
  });
  const smoothedLocation = useSmoothedLocation(rawLocation, 0.5);

  // Actualizar ubicación en contexto y centrar la primera vez
  useEffect(() => {
    if (!smoothedLocation) return;
    setUserLocation(smoothedLocation);

    if (mapInstance && !hasCenteredRef.current) {
      hasCenteredRef.current = true;
      setMapCenter(smoothedLocation.coordinate);
      mapInstance.setView(
        [smoothedLocation.coordinate.lat, smoothedLocation.coordinate.lng],
        16
      );
    }
  }, [smoothedLocation, setUserLocation, mapInstance]);

  // Acumular distancia real caminada (filtrando ruido GPS)
  useEffect(() => {
    if (mapMode !== 'walking') {
      lastTrackedRef.current = null;
      return;
    }
    if (!rawLocation) return;

    const previous = lastTrackedRef.current;
    if (!previous) {
      lastTrackedRef.current = { coordinate: rawLocation.coordinate, timestamp: rawLocation.timestamp };
      return;
    }

    const delta = haversineDistance(previous.coordinate, rawLocation.coordinate);
    const seconds = (rawLocation.timestamp - previous.timestamp) / 1000;
    // Velocidad implícita: descarta saltos de GPS irreales (andar/correr < 5 m/s)
    const plausibleSpeed = seconds < 0.5 || delta / seconds <= 5;
    const isReliable = rawLocation.accuracy <= 60;

    if (isReliable && plausibleSpeed && delta >= 2 && delta <= 250) {
      setWalkedMeters((meters) => meters + delta);
      lastTrackedRef.current = { coordinate: rawLocation.coordinate, timestamp: rawLocation.timestamp };
    } else if (!isReliable || !plausibleSpeed || delta > 250) {
      // Lectura dudosa: reubicamos la referencia sin sumar distancia
      lastTrackedRef.current = { coordinate: rawLocation.coordinate, timestamp: rawLocation.timestamp };
    }
  }, [rawLocation, mapMode]);

  // Cronómetro del paseo
  useEffect(() => {
    if (mapMode !== 'walking') return;
    const id = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [mapMode]);

  // Calcular ruta circular con OSRM (perfil peatonal de FOSSGIS)
  const calculateCircularRoute = useCallback(
    async (center: Coordinate, targetDistanceKm: number, variant: number): Promise<RouteResult | null> => {
      const targetDistanceMeters = targetDistanceKm * 1000;
      const maxAttempts = 3;
      let radiusScale = 1;
      let rawPath: Coordinate[] | null = null;
      let rawDistance = 0;
      let rawDuration = 0;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const waypoints = generateDailyWaypoints(
            center,
            targetDistanceMeters,
            ROUTE_CONFIG.defaultWaypoints,
            ROUTE_CONFIG.variance,
            new Date(),
            variant,
            radiusScale
          );

          const coords = [center, ...waypoints, center];
          const coordString = coords.map((c) => `${c.lng},${c.lat}`).join(';');
          const osrmUrl = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=false`;

          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 12000);
          let response: Response;
          try {
            response = await fetch(osrmUrl, { signal: controller.signal });
          } finally {
            window.clearTimeout(timeout);
          }

          if (!response.ok) throw new Error(`OSRM respondió ${response.status}`);

          const data = await response.json();
          if (data.code !== 'Ok' || !data.routes?.[0]) {
            throw new Error('No se pudo calcular la ruta');
          }

          const osrmRoute = data.routes[0];
          rawPath = osrmRoute.geometry.coordinates.map((c: [number, number]) => ({
            lat: c[1],
            lng: c[0],
          }));
          rawDistance = osrmRoute.distance;
          rawDuration = osrmRoute.duration;

          // Ajustar el radio para acercarnos a la distancia pedida
          const deviation = Math.abs(rawDistance - targetDistanceMeters) / targetDistanceMeters;
          if (deviation <= 0.2) break;

          const ratio = targetDistanceMeters / Math.max(1, rawDistance);
          radiusScale = Math.min(2.5, Math.max(0.4, radiusScale * ratio));
        } catch (err) {
          console.error('Error calculating route:', err);
          if (!rawPath) return null;
          break;
        }
      }

      if (!rawPath) return null;

      const smoothedPath = smoothPath(rawPath, ROUTE_CONFIG.smoothingTension);
      const { crosses } = routeCrossesExclusionZones(smoothedPath, exclusionZones);
      let finalPath = smoothedPath;

      if (crosses) {
        finalPath = avoidExclusionZones(smoothedPath, exclusionZones, ROUTE_CONFIG.avoidanceMaxAttempts);
      }

      let totalDistance = 0;
      for (let i = 0; i < finalPath.length - 1; i++) {
        totalDistance += haversineDistance(finalPath[i], finalPath[i + 1]);
      }

      const duration = rawDistance > 0
        ? Math.round(rawDuration * (totalDistance / rawDistance))
        : rawDuration;

      return {
        path: finalPath,
        distance: totalDistance,
        duration,
        bounds: calculateBounds(finalPath),
      };
    },
    [exclusionZones]
  );

  const fitRouteOnMap = useCallback(
    (route: RouteResult) => {
      if (!mapInstance) return;
      const bounds = L.latLngBounds(
        [route.bounds.south, route.bounds.west],
        [route.bounds.north, route.bounds.east]
      );
      mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    },
    [mapInstance]
  );

  const nextVariant = useCallback(() => {
    variantRef.current += 1;
    return variantRef.current;
  }, []);

  const resetWalkTracking = useCallback(() => {
    setWalkedMeters(0);
    setElapsedSeconds(0);
    setSavedTo(null);
    lastTrackedRef.current = null;
    startedAtRef.current = null;
  }, []);

  const handleStartWalk = useCallback(async () => {
    if (!smoothedLocation) return;

    resetWalkTracking();
    startedAtRef.current = new Date();
    setFollowUser(true);
    setMapMode('routing');

    const route = await calculateCircularRoute(
      smoothedLocation.coordinate,
      selectedDistance,
      nextVariant()
    );

    if (!route) {
      setMapMode('idle');
      return;
    }

    setCurrentRoute(route);
    fitRouteOnMap(route);
    setMapMode('walking');
  }, [smoothedLocation, selectedDistance, calculateCircularRoute, fitRouteOnMap, nextVariant, resetWalkTracking, setCurrentRoute, setMapMode]);

  const handleReroll = useCallback(async () => {
    if (isRerolling) return;
    // Si ya estamos caminando, la nueva ruta sale desde donde estamos ahora
    const center = smoothedLocation?.coordinate ?? currentRoute?.path[0];
    if (!center) return;

    setIsRerolling(true);
    const route = await calculateCircularRoute(center, selectedDistance, nextVariant());
    setIsRerolling(false);

    if (route) {
      setCurrentRoute(route);
      fitRouteOnMap(route);
    }
  }, [isRerolling, currentRoute, smoothedLocation, selectedDistance, calculateCircularRoute, fitRouteOnMap, nextVariant, setCurrentRoute]);

  const clearRoute = useCallback(() => {
    setCurrentRoute(null);
    resetWalkTracking();
    setMapMode('idle');
  }, [setCurrentRoute, resetWalkTracking, setMapMode]);

  const pauseWalk = useCallback(() => {
    if (mapMode === 'walking') setMapMode('paused');
  }, [mapMode, setMapMode]);

  const resumeWalk = useCallback(() => {
    if (mapMode === 'paused') {
      setFollowUser(true);
      setMapMode('walking');
    }
  }, [mapMode, setMapMode]);

  const completeWalk = useCallback(async () => {
    if (!currentRoute) {
      setMapMode('idle');
      return;
    }

    setMapMode('paused');
    setSavedTo(null);

    const startedAt = startedAtRef.current ?? new Date(Date.now() - elapsedSeconds * 1000);

    try {
      const result = await persistWalk({
        user: user ? { id: user.id, username: user.username } : null,
        routePath: currentRoute.path,
        targetDistance: selectedDistance,
        actualDistance: walkedMeters / 1000,
        durationSeconds: elapsedSeconds,
        startedAt,
        completed: true,
      });
      setSavedTo(result);
    } catch (error) {
      console.warn('No se pudo guardar el paseo:', error);
    }

    setMapMode('completed');
  }, [currentRoute, elapsedSeconds, walkedMeters, selectedDistance, user, setMapMode]);

  const handleLocate = useCallback(() => {
    if (!smoothedLocation || !mapInstance) return;
    const { lat, lng } = smoothedLocation.coordinate;
    mapInstance.flyTo([lat, lng], Math.max(mapInstance.getZoom(), 16), { duration: 1 });
    setFollowUser(true);
  }, [smoothedLocation, mapInstance]);

  const handleMapReady = useCallback((map: L.Map) => {
    setMapInstance(map);
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
  }, []);

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center h-full bg-cozy-50 rounded-3xl p-8 text-center">
        <div className="max-w-sm">
          <div className="text-6xl mb-4 font-mono">#</div>
          <h3 className="text-xl font-semibold text-cozy-800 mb-2">Geolocalización no disponible</h3>
          <p className="text-cozy-600">
            Por favor, activa la ubicación en tu navegador para disfrutar de la experiencia completa.
          </p>
        </div>
      </div>
    );
  }

  const isWalkingMode = mapMode === 'walking' || mapMode === 'paused';
  const accuracy = smoothedLocation ? Math.round(smoothedLocation.accuracy) : null;

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-cozy-50 shadow-cozy-lg" style={{ zIndex: 1 }}>
      <MapComponent
        center={mapCenter}
        zoom={mapZoom}
        route={currentRoute}
        userLocation={smoothedLocation}
        exclusionZones={exclusionZones}
        mapMode={['idle', 'routing', 'walking', 'paused', 'completed'].includes(mapMode) ? (mapMode as 'idle' | 'routing' | 'walking' | 'paused' | 'completed') : 'idle'}
        followUser={followUser}
        onMapReady={handleMapReady}
        onUserInteract={() => setFollowUser(false)}
      />

      {/* Barra superior */}
      <div className="absolute top-0 inset-x-0 z-50 p-3 md:p-4 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 md:gap-3 min-w-0 rounded-2xl bg-white/90 backdrop-blur-sm border border-cozy-200 shadow-cozy px-2.5 py-2 md:px-3">
          <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl bg-gradient-to-br from-cozy-400 to-terracotta-500 flex items-center justify-center text-white text-lg md:text-xl shadow-cozy font-mono">
            (
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-sm md:text-base font-bold text-cozy-800 truncate">Cozy Walks</p>
            <p className="text-[10px] md:text-xs text-cozy-500 flex items-center gap-1.5 min-w-0">
              <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', MODE_DOT[mapMode])} />
              <span className="truncate min-w-0">{MODE_LABEL[mapMode]}</span>
              {isWalkingMode && accuracy !== null && (
                <span className="hidden lg:inline shrink-0 text-cozy-400 tabular-nums whitespace-nowrap">· GPS ±{accuracy}m</span>
              )}
            </p>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 md:gap-2 shrink-0">
          <MapActionButton
            label="Mi ubicación"
            onClick={handleLocate}
            active={followUser}
            accent
            disabled={!smoothedLocation}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
          </MapActionButton>

          <MapActionButton
            label="Ranking"
            onClick={() => setLeaderboardOpen((open) => !open)}
            active={leaderboardOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </MapActionButton>

          <MapActionButton label="Salir" onClick={() => { void logout(); }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </MapActionButton>
        </div>
      </div>

      {/* Spinner de ruta */}
      {mapMode === 'routing' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-cozy-lg text-center max-w-xs mx-4 animate-fade-in">
            <div className="w-10 h-10 mx-auto mb-3 border-4 border-cozy-200 border-t-cozy-500 rounded-full animate-spin" />
            <p className="text-cozy-700 font-medium">Trazando tu ruta…</p>
            <p className="text-xs text-cozy-500 mt-1">Buscando el camino más bonito cerca de ti</p>
          </div>
        </div>
      )}

      {/* Panel inferior (móvil) / panel lateral (PC) */}
      <div className="absolute inset-x-0 bottom-0 z-30 md:top-24 md:bottom-0 md:left-auto md:right-0 md:w-[380px] flex flex-col justify-end md:justify-start pointer-events-none">
        <div className="pointer-events-auto p-3 md:p-4 space-y-2.5 max-h-[72vh] md:max-h-full overflow-y-auto overscroll-contain">
          {mapMode === 'idle' && !smoothedLocation && (
            <div className="rounded-2xl bg-warm-50 border border-warm-200 p-3 text-xs text-warm-800 flex items-start gap-2">
              <span aria-hidden="true" className="font-mono">#</span>
              <span>Permite el acceso a tu ubicacion para que podamos trazar tu paseo.</span>
            </div>
          )}

          {mapMode === 'idle' && (
            <DistanceSlider
              value={selectedDistance}
              onChange={setSelectedDistance}
              onStartWalk={handleStartWalk}
              disabled={!smoothedLocation}
            />
          )}

          {isWalkingMode && currentRoute && (
            <RouteInfoPanel
              route={currentRoute}
              mapMode={mapMode}
              targetDistance={selectedDistance}
              walkedDistance={walkedMeters}
              elapsedSeconds={elapsedSeconds}
            />
          )}

          {isWalkingMode && (
            <MapControls
              mapMode={mapMode}
              onPause={pauseWalk}
              onResume={resumeWalk}
              onComplete={completeWalk}
              onCancel={clearRoute}
              onReroll={handleReroll}
              isRerolling={isRerolling}
              currentRoute={currentRoute}
              targetDistance={selectedDistance}
              walkedDistance={walkedMeters}
              elapsedSeconds={elapsedSeconds}
            />
          )}

          {mapMode === 'completed' && currentRoute && (
            <>
              <RouteInfoPanel
                route={currentRoute}
                mapMode={mapMode}
                targetDistance={selectedDistance}
                walkedDistance={walkedMeters}
                elapsedSeconds={elapsedSeconds}
                savedTo={savedTo}
              />
              <button
                type="button"
                onClick={clearRoute}
                className="w-full py-3 rounded-2xl font-semibold text-sm bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white shadow-cozy hover:from-cozy-600 hover:to-terracotta-600 transition-all active:scale-[0.99]"
              >
                Empezar otro paseo <span className="font-mono">{'>'}</span>
              </button>
              <Leaderboard />
            </>
          )}

          <ExclusionZoneLegend zones={exclusionZones} />
        </div>
      </div>

      {/* Ranking (modal independiente: no interrumpe el paseo en curso) */}
      {leaderboardOpen && (
        <Leaderboard initialOpen onClose={() => setLeaderboardOpen(false)} />
      )}
    </div>
  );
}

export default function MapScreen() {
  return <MapScreenContent />;
}
