// Hook para cálculo de rutas con Google Maps DirectionsService

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Coordinate, RouteResult, ExclusionZone, MapMode } from '../types';
import {
  generateDailyWaypoints,
  routeCrossesExclusionZones,
  avoidExclusionZones,
  smoothPath,
  calculateBounds,
  haversineDistance,
} from '../utils/routeUtils';
import { ROUTE_CONFIG } from '../utils/constants';

interface UseRoutingOptions {
  apiKey: string;
  exclusionZones: ExclusionZone[];
  onRouteCalculated?: (route: RouteResult) => void;
  onError?: (error: Error) => void;
}

export function useRouting(options: UseRoutingOptions) {
  const { exclusionZones, onRouteCalculated, onError } = options;

  const [mapMode, setMapMode] = useState<MapMode>('idle');
  const [currentRoute, setCurrentRoute] = useState<RouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const mountedRef = useRef(true);

  // Inicializar DirectionsService
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }

    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Calcula una ruta circular basada en la distancia objetivo
   */
  const calculateCircularRoute = useCallback(
    async (center: Coordinate, targetDistanceKm: number): Promise<RouteResult | null> => {
      if (!directionsServiceRef.current || !mountedRef.current) return null;

      setMapMode('routing');
      setIsCalculating(true);

      try {
        const targetDistanceMeters = targetDistanceKm * 1000;

        // Generar waypoints determinísticos para el día
        const waypoints = generateDailyWaypoints(
          center,
          targetDistanceMeters,
          ROUTE_CONFIG.defaultWaypoints,
          ROUTE_CONFIG.variance
        );

        // Crear waypoints para DirectionsService (formato Google Maps)
        const gmWaypoints = waypoints.map((wp) => ({
          location: new window.google.maps.LatLng(wp.lat, wp.lng),
          stopover: true,
        }));

        // Añadir el punto de inicio al final para hacer la ruta circular
        const startLocation = new window.google.maps.LatLng(center.lat, center.lng);
        gmWaypoints.push({ location: startLocation, stopover: true });

        // Solicitar ruta a Google Maps
        const request: google.maps.DirectionsRequest = {
          origin: startLocation,
          destination: startLocation,
          waypoints: gmWaypoints.slice(0, -1), // Excluir el último (duplicado)
          travelMode: window.google.maps.TravelMode.WALKING,
          optimizeWaypoints: false,
          avoidHighways: true,
          avoidTolls: true,
          provideRouteAlternatives: false,
        };

        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsServiceRef.current!.route(request, (response, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && response) {
              resolve(response);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          });
        });

        if (!mountedRef.current) return null;

        // Extraer la ruta (overview_path)
        const route = result.routes[0];
        const path: Coordinate[] = route.overview_path.map((point) => ({
          lat: point.lat(),
          lng: point.lng(),
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
          duration: route.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0),
          bounds: calculateBounds(finalPath),
        };

        if (mountedRef.current) {
          setCurrentRoute(routeResult);
          setMapMode('walking');
          onRouteCalculated?.(routeResult);
        }

        return routeResult;
      } catch (err) {
        console.error('Error calculating route:', err);
        if (mountedRef.current) {
          setMapMode('idle');
          onError?.(err as Error);
        }
        return null;
      } finally {
        if (mountedRef.current) {
          setIsCalculating(false);
        }
      }
    },
    [exclusionZones, onRouteCalculated, onError]
  );

  const clearRoute = useCallback(() => {
    setCurrentRoute(null);
    setMapMode('idle');
  }, []);

  const pauseWalk = useCallback(() => {
    if (mapMode === 'walking') setMapMode('paused');
  }, [mapMode]);

  const resumeWalk = useCallback(() => {
    if (mapMode === 'paused') setMapMode('walking');
  }, [mapMode]);

  const completeWalk = useCallback(() => {
    setMapMode('completed');
  }, []);

  return {
    mapMode,
    currentRoute,
    isCalculating,
    calculateCircularRoute,
    clearRoute,
    pauseWalk,
    resumeWalk,
    completeWalk,
  };
}