// Tipos para la aplicación Cozy Walks

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface DistanceOption {
  value: number;
  label: string;
  icon: string;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RouteResult {
  path: Coordinate[];
  distance: number; // en metros
  duration: number; // en segundos
  bounds: Bounds;
}

export interface ExclusionZone {
  id: string;
  name: string;
  coordinates: Coordinate[];
  riskLevel: 'low' | 'medium' | 'high';
  color: string;
}

export interface UserLocation {
  coordinate: Coordinate;
  accuracy: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

export interface MapViewport {
  center: Coordinate;
  zoom: number;
  bounds?: Bounds;
}

export interface WalkSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  targetDistance: number;
  actualDistance: number;
  duration: number; // segundos caminados
  route: Coordinate[];
  completed: boolean;
}

export interface AvatarConfig {
  imageUrl: string;
  size: { width: number; height: number };
  anchor: { x: number; y: number };
  rotation?: number;
}

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  marks: { value: number; label: string }[];
}

// Tipos para Google Maps extendidos
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

export type MapMode = 'idle' | 'routing' | 'walking' | 'paused' | 'completed' | 'leaderboard';

export interface AppState {
  mapMode: MapMode;
  selectedDistance: number;
  currentRoute: RouteResult | null;
  userLocation: UserLocation | null;
  exclusionZones: ExclusionZone[];
  walkSession: WalkSession | null;
  error: string | null;
  isMapLoaded: boolean;
}