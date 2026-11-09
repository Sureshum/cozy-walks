// Componente principal del mapa - Integración con @react-google-maps/api

import { useRef, useEffect, useCallback, useState, Suspense } from 'react';
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
  Polygon,
  Circle,
} from '@react-google-maps/api';
import type { Coordinate, RouteResult, ExclusionZone, UserLocation } from '../types';
import { ROUTE_CONFIG, MAP_CONFIG, COZY_MESSAGES } from '../utils/constants';
import { useApp } from '../context/AppContext';
import { useGeolocation, useSmoothedLocation } from '../hooks/useGeolocation';
import { useRouting } from '../hooks/useRouting';
import DistanceSlider from './DistanceSlider';
import MapControls from './MapControls';
import AvatarMarker from './AvatarMarker';
import RouteInfoPanel from './RouteInfoPanel';
import ExclusionZoneLegend from './ExclusionZoneLegend';
import CozyLoader from './CozyLoader';

interface MapScreenProps {
  apiKey: string;
}

function MapComponent({
  center,
  zoom,
  route,
  userLocation,
  exclusionZones,
  mapMode,
  onMapLoad,
  onMapClick,
}: {
  center: Coordinate;
  zoom: number;
  route: RouteResult | null;
  userLocation: UserLocation | null;
  exclusionZones: ExclusionZone[];
  mapMode: 'idle' | 'routing' | 'walking' | 'paused' | 'completed';
  onMapLoad: (map: google.maps.Map) => void;
  onMapClick: (e: google.maps.MapMouseEvent) => void;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    onMapLoad(map);
  }, [onMapLoad]);

  // Centrar el mapa en la ubicación del usuario cuando está caminando
  useEffect(() => {
    if (mapRef.current && userLocation && mapMode === 'walking') {
      mapRef.current.panTo({
        lat: userLocation.coordinate.lat,
        lng: userLocation.coordinate.lng,
      });
    }
  }, [userLocation, mapMode]);

  return (
    <GoogleMap
      mapContainerStyle={{
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
      }}
      center={center}
      zoom={zoom}
      onLoad={handleLoad}
      onClick={onMapClick}
      options={{
        styles: MAP_CONFIG.styles,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        clickableIcons: false,
        disableDefaultUI: true,
        gestureHandling: 'cooperative',
      }}
    >
      {/* Zonas de exclusión */}
      {exclusionZones.map((zone) => (
        <Polygon
          key={zone.id}
          paths={zone.coordinates.map((c) => ({ lat: c.lat, lng: c.lng }))}
          options={{
            fillColor: zone.color,
            fillOpacity: 0.15,
            strokeColor: zone.color,
            strokeOpacity: 0.6,
            strokeWeight: 2,
            clickable: false,
            zIndex: 1,
          }}
        />
      ))}

      {/* Ruta calculada */}
      {route && (
        <Polyline
          path={route.path.map((c) => ({ lat: c.lat, lng: c.lng }))}
          options={{
            strokeColor: mapMode === 'walking' || mapMode === 'paused'
              ? ROUTE_CONFIG.strokeColorActive
              : ROUTE_CONFIG.strokeColor,
            strokeOpacity: mapMode === 'walking' || mapMode === 'paused'
              ? ROUTE_CONFIG.strokeOpacityActive
              : ROUTE_CONFIG.strokeOpacity,
            strokeWeight: mapMode === 'walking' || mapMode === 'paused'
              ? ROUTE_CONFIG.strokeWeightActive
              : ROUTE_CONFIG.strokeWeight,
            geodesic: true,
            clickable: false,
            zIndex: 2,
          }}
        />
      )}

      {/* Círculo de distancia objetivo (cuando no hay ruta) */}
      {!route && mapMode !== 'idle' && userLocation && (
        <Circle
          center={{ lat: userLocation.coordinate.lat, lng: userLocation.coordinate.lng }}
          radius={1000} // placeholder
          options={{
            fillColor: 'transparent',
            strokeColor: '#c8754a',
            strokeOpacity: 0.3,
            strokeWeight: 2,
            clickable: false,
            zIndex: 1,
          }}
        />
      )}

      {/* Avatar del usuario */}
      {userLocation && (
        <AvatarMarker
          position={userLocation.coordinate}
          heading={userLocation.heading}
          mapMode={mapMode}
        />
      )}

      {/* Marcador de inicio de ruta */}
      {route && route.path.length > 0 && (
        <Marker
          position={{ lat: route.path[0].lat, lng: route.path[0].lng }}
          options={{
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#5e8f5a',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
            zIndex: 10,
            clickable: false,
          }}
        />
      )}

      {/* Precisión GPS */}
      {userLocation && userLocation.accuracy > 0 && mapMode === 'walking' && (
        <Circle
          center={{ lat: userLocation.coordinate.lat, lng: userLocation.coordinate.lng }}
          radius={userLocation.accuracy}
          options={{
            fillColor: '#c8754a',
            fillOpacity: 0.1,
            strokeColor: 'transparent',
            clickable: false,
            zIndex: 0,
          }}
        />
      )}
    </GoogleMap>
  );
}

function MapScreenContent({ apiKey }: { apiKey: string }) {
  const {
    mapMode,
    selectedDistance,
    currentRoute,
    userLocation,
    exclusionZones,
    setUserLocation,
    setMapLoaded,
    setCurrentRoute,
    setMapMode,
    setSelectedDistance,
  } = useApp();

  const [mapCenter, setMapCenter] = useState<Coordinate>(MAP_CONFIG.defaultCenter);
  const [mapZoom, setMapZoom] = useState(MAP_CONFIG.defaultZoom);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

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
      }
    }
  }, [smoothedLocation, setUserLocation, mapMode, mapInstance]);

  // Routing
  const {
    calculateCircularRoute,
    isCalculating,
    clearRoute,
    pauseWalk,
    resumeWalk,
    completeWalk,
  } = useRouting({
    apiKey,
    exclusionZones,
    onRouteCalculated: (route) => {
      setCurrentRoute(route);
      // Ajustar bounds del mapa
      if (mapInstance && route.bounds) {
        mapInstance.fitBounds(route.bounds, { top: 100, bottom: 200, left: 50, right: 50 });
      }
    },
    onError: (err) => {
      console.error('Routing error:', err);
      setMapMode('idle');
    },
  });

  // Manejar clic en el mapa (para centrar)
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMapCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, []);

  // Manejar carga del mapa
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    setMapLoaded(true);
  }, [setMapLoaded]);

  // Iniciar caminata
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

    // Aquí se guardaría la sesión en contexto/storage
    console.log('Starting walk session:', walkSession);

    await calculateCircularRoute(userLocation.coordinate, selectedDistance);
  }, [userLocation, selectedDistance, currentRoute, calculateCircularRoute]);

  // Obtener mensaje cozy aleatorio según el estado
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
      {/* Cargador del mapa */}
      <LoadScript
        googleMapsApiKey={apiKey}
        libraries={['marker']}
        region="ES"
        language="es"
      >
        <Suspense fallback={<CozyLoader message="Cargando mapa..." />}>
          <MapComponent
            center={mapCenter}
            zoom={mapZoom}
            route={currentRoute}
            userLocation={smoothedLocation}
            exclusionZones={exclusionZones}
            mapMode={mapMode}
            onMapLoad={handleMapLoad}
            onMapClick={handleMapClick}
          />
        </Suspense>
      </LoadScript>

      {/* Overlay de mensaje cozy */}
      {(mapMode === 'idle' || isCalculating) && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          aria-hidden="true"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-cozy text-center animate-pulse-soft max-w-xs mx-4">
            <p className="text-cozy-700 font-medium">{getCozyMessage()}</p>
            {isCalculating && (
              <div className="mt-3 flex items-center justify-center gap-2 text-cozy-500">
                <div className="w-5 h-5 border-2 border-cozy-300 border-t-cozy-500 rounded-full animate-spin" />
                <span className="text-sm">Trazando tu ruta...</span>
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
          disabled={!userLocation || isCalculating}
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

export default function MapScreen({ apiKey }: MapScreenProps) {
  return <MapScreenContent apiKey={apiKey} />;
}