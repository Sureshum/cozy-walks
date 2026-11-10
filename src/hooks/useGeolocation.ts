// Hook para geolocalización en tiempo real

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserLocation } from '../types';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
  onError?: (error: GeolocationPositionError) => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    maximumAge = 1000,
    timeout = 10000,
    onError,
  } = options;

  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [isSupported, setIsSupported] = useState(
    () => typeof navigator !== 'undefined' && !!navigator.geolocation
  );
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const newLocation: UserLocation = {
      coordinate: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      heading: position.coords.heading ?? undefined,
      speed: position.coords.speed ?? undefined,
    };
    setLocation(newLocation);
    setError(null);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(err);
    onError?.(err);
  }, [onError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // Obtener posición inicial
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      maximumAge,
      timeout,
    });

    // Iniciar watchPosition para actualizaciones continuas
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        maximumAge,
        timeout,
      }
    );
  }, [handleSuccess, handleError, enableHighAccuracy, maximumAge, timeout]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  return {
    location,
    error,
    isSupported,
    startWatching,
    stopWatching,
  };
}

/**
 * Hook para suavizar la posición del avatar (interpolación)
 */
export function useSmoothedLocation(
  rawLocation: UserLocation | null,
  smoothingFactor: number = 0.3
): UserLocation | null {
  const [smoothed, setSmoothed] = useState<UserLocation | null>(null);
  const prevRef = useRef<UserLocation | null>(null);

  useEffect(() => {
    if (!rawLocation) {
      setSmoothed(null);
      prevRef.current = null;
      return;
    }

    if (!prevRef.current) {
      // Primera posición, sin suavizar
      setSmoothed(rawLocation);
      prevRef.current = rawLocation;
      return;
    }

    // Interpolar entre posición anterior y nueva
    const interpolated: UserLocation = {
      coordinate: {
        lat: prevRef.current.coordinate.lat +
          (rawLocation.coordinate.lat - prevRef.current.coordinate.lat) * smoothingFactor,
        lng: prevRef.current.coordinate.lng +
          (rawLocation.coordinate.lng - prevRef.current.coordinate.lng) * smoothingFactor,
      },
      accuracy: rawLocation.accuracy,
      timestamp: rawLocation.timestamp,
      heading: rawLocation.heading,
      speed: rawLocation.speed,
    };

    setSmoothed(interpolated);
    prevRef.current = interpolated;
  }, [rawLocation, smoothingFactor]);

  return smoothed;
}