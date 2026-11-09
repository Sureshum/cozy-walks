// Mapa con Leaflet + CartoDB (gratis, sin API key)

import { useEffect, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Polygon,
  useMapEvents,
  Marker,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinate, RouteResult, ExclusionZone, UserLocation } from '../types';
import { haversineDistance, calculateBounds, generateDailyWaypoints, routeCrossesExclusionZones, avoidExclusionZones, smoothPath } from '../utils/routeUtils';
import { ROUTE_CONFIG, COZY_MESSAGES } from '../utils/constants';
import { useApp } from '../context/AppContext';
import { useGeolocation, useSmoothedLocation } from '../hooks/useGeolocation';
import DistanceSlider from './DistanceSlider';
import MapControls from './MapControls';
import RouteInfoPanel from './RouteInfoPanel';
import ExclusionZoneLegend from './ExclusionZoneLegend';

// Icono personalizado para el avatar
const createAvatarIcon = (mapMode: string, heading?: number) => {
  const isWalking = mapMode === 'walking';
  const isPaused = mapMode === 'paused';
  
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
      
      ${heading !== undefined ? `
        <!-- Flecha de dirección -->
        <g transform="rotate(${heading} 32 32)">
          <path d="M32 6 L28 14 L32 10 L36 14 Z" fill="#c8754a" stroke="#b55e3a" stroke-width="1.5"/>
        </g>
      ` : ''}
    </svg>
  `;

  return L.divIcon({
    className: 'custom-avatar-icon',
    html: svg,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
};

// Icono para el inicio de ruta
const startIcon = L.divIcon({
  className: 'start-marker',
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#5e8f5a;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Componente wrapper para manejar whenReady correctamente
const MapReadyHandler = ({ onReady }: { onReady: (map: L.Map) => void }) => {
  useMapEvents({
    load: (e) => onReady(e.target),
  });
  return null;
};

// Componente para centrar mapa en usuario
const UserLocationTracker = ({ 
  userLocation, 
  mapMode 
}: { 
  userLocation: UserLocation | null; 
  mapMode: string;
}) => {
  const map = useMapEvents({});

  useEffect(() => {
    if (map && userLocation && mapMode === 'walking') {
      map.panTo([userLocation.coordinate.lat, userLocation.coordinate.lng], { animate: true, duration: 0.5 });
    }
  }, [map, userLocation, mapMode]);

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
  onMapReady,
}: {
  center: Coordinate;
  zoom: number;
  route: RouteResult | null;
  userLocation: UserLocation | null;
  exclusionZones: ExclusionZone[];
  mapMode: 'idle' | 'routing' | 'walking' | 'paused' | 'completed';
  onMapReady: (map: L.Map) => void;
}) {
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
      }}
      whenReady={() => {}} // whenReady vacío, usamos MapReadyHandler interno
    >
      <MapReadyHandler onReady={onMapReady} />
      <UserLocationTracker userLocation={userLocation} mapMode={mapMode} />

      {/* Capa base CartoDB Positron (gratis, sin API key) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains={['a', 'b', 'c', 'd']}
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

      {/* Marcador de inicio de ruta */}
      {route && route.path.length > 0 && (
        <Marker
          position={[route.path[0].lat, route.path[0].lng]}
          icon={startIcon}
        />
      )}

      {/* Avatar del usuario */}
      {userLocation && (
        <Marker
          position={[userLocation.coordinate.lat, userLocation.coordinate.lng]}
          icon={createAvatarIcon(mapMode, userLocation.heading)}
          zIndexOffset={1000}
        >
          <Popup>
            <div className="text-center p-1">
              <div className="font-semibold text-cozy-800">📍 Tu posición</div>
              <div className="text-xs text-cozy-500">
                Precisión: ~{Math.round(userLocation.accuracy)}m
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Círculo de precisión GPS */}
      {userLocation && userLocation.accuracy > 0 && mapMode === 'walking' && (
        <CircleMarker
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

function MapScreenContent() {
  const {
    mapMode,
    selectedDistance,
    currentRoute,
    userLocation,
    exclusionZones,
    setUserLocation,
    setCurrentRoute,
    setMapMode,
    setSelectedDistance,
  } = useApp();

  const [mapCenter, setMapCenter] = useState<Coordinate>({ lat: 40.4168, lng: -3.7038 });
  const [mapZoom, setMapZoom] = useState(15);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Geolocalización
  const { location: rawLocation, isSupported } = useGeolocation({
    onError: (err) => console.warn('Geolocation error:', err.message),
  });
  const smoothedLocation = useSmoothedLocation(rawLocation);

  // Actualizar ubicación en contexto
  useEffect(() => {
    if (smoothedLocation) {
      setUserLocation(smoothedLocation);
      // Centrar mapa en la primera ubicación
      if (mapMode === 'idle' && mapInstance) {
        setMapCenter(smoothedLocation.coordinate);
        setMapZoom(16);
        mapInstance.setView([smoothedLocation.coordinate.lat, smoothedLocation.coordinate.lng], 16);
      }
    }
  }, [smoothedLocation, setUserLocation, mapMode, mapInstance]);

  // Routing con Leaflet (usando OSRM gratis para direcciones)
  const calculateCircularRoute = useCallback(
    async (center: Coordinate, targetDistanceKm: number): Promise<RouteResult | null> => {
      setMapMode('routing');
      
      try {
        const targetDistanceMeters = targetDistanceKm * 1000;

        // Generar waypoints determinísticos para el día
        const waypoints = generateDailyWaypoints(
          center,
          targetDistanceMeters,
          ROUTE_CONFIG.defaultWaypoints,
          ROUTE_CONFIG.variance
        );

        // Construir ruta usando OSRM (gratis, sin API key)
        // OSRM: http://router.project-osrm.org/
        const coords = [center, ...waypoints, center];
        const coordString = coords.map(c => `${c.lng},${c.lat}`).join(';');
        
        const osrmUrl = `https://router.project-osrm.org/route/v1/walking/${coordString}?overview=full&geometries=geojson&steps=false`;
        
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes?.[0]) {
          throw new Error('No se pudo calcular la ruta');
        }

        const osrmRoute = data.routes[0];
        const path: Coordinate[] = osrmRoute.geometry.coordinates.map((c: [number, number]) => ({
          lat: c[1],
          lng: c[0],
        }));

        // Suavizar la ruta
        const smoothedPath = smoothPath(path, ROUTE_CONFIG.smoothingTension);

        // Verificar y evitar zonas de exclusión
        const { crosses } = routeCrossesExclusionZones(smoothedPath, exclusionZones);
        let finalPath = smoothedPath;

        if (crosses) {
          finalPath = avoidExclusionZones(smoothedPath, exclusionZones, ROUTE_CONFIG.avoidanceMaxAttempts);
        }

        // Calcular distancia total
        let totalDistance = 0;
        for (let i = 0; i < finalPath.length - 1; i++) {
          totalDistance += haversineDistance(finalPath[i], finalPath[i + 1]);
        }

        const routeResult: RouteResult = {
          path: finalPath,
          distance: totalDistance,
          duration: osrmRoute.duration,
          bounds: calculateBounds(finalPath),
        };

        setCurrentRoute(routeResult);
        setMapMode('walking');

        // Ajustar bounds del mapa
        if (mapInstance && routeResult.bounds) {
          const bounds = L.latLngBounds(
            [routeResult.bounds.south, routeResult.bounds.west],
            [routeResult.bounds.north, routeResult.bounds.east]
          );
          mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
        }

        return routeResult;
      } catch (err) {
        console.error('Error calculating route:', err);
        setMapMode('idle');
        return null;
      }
    },
    [exclusionZones, setCurrentRoute, setMapMode]
  );

  const clearRoute = useCallback(() => {
    setCurrentRoute(null);
    setMapMode('idle');
  }, [setCurrentRoute, setMapMode]);

  const pauseWalk = useCallback(() => {
    if (mapMode === 'walking') setMapMode('paused');
  }, [mapMode]);

  const resumeWalk = useCallback(() => {
    if (mapMode === 'paused') setMapMode('walking');
  }, [mapMode]);

  const completeWalk = useCallback(() => {
    setMapMode('completed');
  }, [setMapMode]);

  const handleMapReady = useCallback((map: L.Map) => {
    setMapInstance(map);
    // Desactivar zoom con doble click
    map.doubleClickZoom.disable();
    // Desactivar zoom con caja
    map.boxZoom.disable();
  }, []);

  const handleStartWalk = useCallback(async () => {
    if (!userLocation) return;

    const sessionId = `walk-${Date.now()}`;
    const walkSession = {
      id: sessionId,
      startTime: new Date(),
      targetDistance: selectedDistance,
      actualDistance: 0,
      route: currentRoute?.path || [],
      completed: false,
    };

    console.log('Starting walk session:', walkSession);
    await calculateCircularRoute(userLocation.coordinate, selectedDistance);
  }, [userLocation, selectedDistance, currentRoute, calculateCircularRoute]);

  const getCozyMessage = useCallback(() => {
    const messages = COZY_MESSAGES[mapMode as keyof typeof COZY_MESSAGES] || COZY_MESSAGES.welcome;
    return messages[Math.floor(Math.random() * messages.length)];
  }, [mapMode]);

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center h-full bg-cozy-50 rounded-3xl p-8 text-center">
        <div className="max-w-sm">
          <div className="text-6xl mb-4">📍</div>
          <h3 className="text-xl font-semibold text-cozy-800 mb-2">Geolocalización no disponible</h3>
          <p className="text-cozy-600">
            Por favor, activa la ubicación en tu navegador para disfrutar de la experiencia completa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-cozy-50 shadow-cozy-lg">
      <MapComponent
        center={mapCenter}
        zoom={mapZoom}
        route={currentRoute}
        userLocation={smoothedLocation}
        exclusionZones={exclusionZones}
        mapMode={mapMode}
        onMapReady={handleMapReady}
      />

      {/* Overlay de mensaje cozy */}
      {(mapMode === 'idle' || mapMode === 'routing') && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          aria-hidden="true"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-cozy text-center animate-pulse-soft max-w-xs mx-4">
            <p className="text-cozy-700 font-medium">{getCozyMessage()}</p>
            {mapMode === 'routing' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-cozy-500">
                <div className="w-5 h-5 border-2 border-cozy-300 border-t-cozy-500 rounded-full animate-spin" />
                <span className="text-sm">Trazando tu ruta con OSRM...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UI Flotante - Slider de distancia */}
      {mapMode === 'idle' && (
        <DistanceSlider
          value={selectedDistance}
          onChange={setSelectedDistance}
          onStartWalk={handleStartWalk}
          disabled={!userLocation}
        />
      )}

      {/* Controles del mapa */}
      <MapControls
        mapMode={mapMode}
        onPause={pauseWalk}
        onResume={resumeWalk}
        onComplete={completeWalk}
        onCancel={clearRoute}
        userLocation={smoothedLocation}
        currentRoute={currentRoute}
      />

      {/* Panel de info de ruta */}
      {currentRoute && (
        <RouteInfoPanel
          route={currentRoute}
          mapMode={mapMode}
          targetDistance={selectedDistance}
        />
      )}

      {/* Leyenda de zonas de exclusión */}
      <ExclusionZoneLegend zones={exclusionZones} />

      {/* Indicador de precisión GPS */}
      {smoothedLocation && mapMode === 'walking' && (
        <div className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:bottom-32 md:w-64 pointer-events-none z-20">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-cozy border border-cozy-200 flex items-center gap-2 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-sage-500 animate-pulse-soft" />
            <span className="text-xs text-cozy-600 font-medium">
              Precisión GPS: ~{Math.round(smoothedLocation.accuracy)}m
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapScreen() {
  return <MapScreenContent />;
}