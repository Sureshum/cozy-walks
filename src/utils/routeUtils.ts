// Utilidades para cálculo de rutas, zonas de exclusión y aleatoriedad

import type { Coordinate, ExclusionZone, Bounds } from '../types';

/**
 * Calcula la distancia entre dos coordenadas usando la fórmula de Haversine
 */
export function haversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // en metros
}

/**
 * Calcula el bearing (rumbo) entre dos puntos
 */
export function calculateBearing(coord1: Coordinate, coord2: Coordinate): number {
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
}

/**
 * Calcula un punto destino dado un origen, distancia y bearing
 */
export function destinationPoint(
  origin: Coordinate,
  distance: number,
  bearing: number
): Coordinate {
  const R = 6371e3;
  const δ = distance / R;
  const φ1 = (origin.lat * Math.PI) / 180;
  const θ = (bearing * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 =
    (origin.lng * Math.PI) / 180 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  return {
    lat: (φ2 * 180) / Math.PI,
    lng: ((λ2 * 180) / Math.PI + 540) % 360 - 180,
  };
}

/**
 * Verifica si un punto está dentro de un polígono (algoritmo ray-casting)
 */
export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Verifica si una línea (segmento) intersecta con un polígono
 */
export function doesLineIntersectPolygon(
  start: Coordinate,
  end: Coordinate,
  polygon: Coordinate[]
): boolean {
  // Verificar si alguno de los puntos está dentro
  if (isPointInPolygon(start, polygon) || isPointInPolygon(end, polygon)) {
    return true;
  }

  // Verificar intersección con cada lado del polígono
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (doSegmentsIntersect(start, end, polygon[i], polygon[j])) {
      return true;
    }
  }
  return false;
}

/**
 * Verifica si dos segmentos de línea se intersectan
 */
function doSegmentsIntersect(
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  p4: Coordinate
): boolean {
  const orientation = (a: Coordinate, b: Coordinate, c: Coordinate) => {
    const val = (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
    if (val === 0) return 0;
    return val > 0 ? 1 : 2;
  };

  const onSegment = (a: Coordinate, b: Coordinate, c: Coordinate) => {
    return (
      c.lng <= Math.max(a.lng, b.lng) &&
      c.lng >= Math.min(a.lng, b.lng) &&
      c.lat <= Math.max(a.lat, b.lat) &&
      c.lat >= Math.min(a.lat, b.lat)
    );
  };

  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, p3)) return true;
  if (o2 === 0 && onSegment(p1, p2, p4)) return true;
  if (o3 === 0 && onSegment(p3, p4, p1)) return true;
  if (o4 === 0 && onSegment(p3, p4, p2)) return true;

  return false;
}

/**
 * Verifica si una ruta cruza alguna zona de exclusión
 */
export function routeCrossesExclusionZones(
  path: Coordinate[],
  exclusionZones: ExclusionZone[]
): { crosses: boolean; zones: ExclusionZone[] } {
  const crossedZones: ExclusionZone[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    for (const zone of exclusionZones) {
      if (doesLineIntersectPolygon(path[i], path[i + 1], zone.coordinates)) {
        if (!crossedZones.find((z) => z.id === zone.id)) {
          crossedZones.push(zone);
        }
      }
    }
  }

  return { crosses: crossedZones.length > 0, zones: crossedZones };
}

/**
 * Genera waypoints aleatorios alrededor de un punto central para crear rutas circulares
 */
export function generateRandomWaypoints(
  center: Coordinate,
  targetDistance: number, // en metros
  numWaypoints: number = 4,
  variance: number = 0.3 // 0-1, qué tan aleatorios son los waypoints
): Coordinate[] {
  const waypoints: Coordinate[] = [];
  const radius = targetDistance / (2 * Math.PI * numWaypoints); // radio aproximado

  for (let i = 0; i < numWaypoints; i++) {
    const baseAngle = (i / numWaypoints) * 360;
    const randomAngle = baseAngle + (Math.random() - 0.5) * 360 * variance;
    const randomDistance = radius * (0.7 + Math.random() * 0.6); // 70%-130% del radio

    const waypoint = destinationPoint(center, randomDistance, randomAngle);
    waypoints.push(waypoint);
  }

  return waypoints;
}

/**
 * Genera una semilla determinística basada en la fecha para rutas "del día"
 */
export function getDailySeed(date: Date = new Date()): number {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  return dayStart.getTime();
}

/**
 * Generador pseudoaleatorio determinístico (Mulberry32)
 */
export function createSeededRandom(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Genera waypoints determinísticos para el día (misma distancia = misma ruta hoy)
 */
export function generateDailyWaypoints(
  center: Coordinate,
  targetDistance: number,
  numWaypoints: number = 4,
  variance: number = 0.3,
  date: Date = new Date(),
  variant: number = 0,
  radiusScale: number = 1
): Coordinate[] {
  const seed = getDailySeed(date) + Math.round(targetDistance / 1000) + variant * 7919;
  const random = createSeededRandom(seed);

  const waypoints: Coordinate[] = [];
  // Radio del bucle: el perímetro de un círculo de radio r es 2πr.
  // Se ajusta con radiusScale para acercarse a la distancia objetivo.
  const radius = (targetDistance / (2 * Math.PI)) * radiusScale;

  for (let i = 0; i < numWaypoints; i++) {
    const baseAngle = (i / numWaypoints) * 360;
    const randomAngle = baseAngle + (random() - 0.5) * 360 * variance;
    const randomDistance = radius * (0.7 + random() * 0.6);

    const waypoint = destinationPoint(center, randomDistance, randomAngle);
    waypoints.push(waypoint);
  }

  return waypoints;
}

/**
 * Intenta ajustar una ruta para evitar zonas de exclusión.
 * Acotado para evitar crecimientos exponenciales del número de puntos.
 */
export function avoidExclusionZones(
  path: Coordinate[],
  exclusionZones: ExclusionZone[],
  maxAttempts: number = 3
): Coordinate[] {
  const MAX_POINTS = 4000;
  let adjustedPath = [...path];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (adjustedPath.length > MAX_POINTS) break;

    const { crosses, zones } = routeCrossesExclusionZones(adjustedPath, exclusionZones);
    if (!crosses) break;

    for (const zone of zones) {
      // Si el paseo empieza dentro de la zona, no se puede "evitar": se deja pasar
      if (path[0] && isPointInPolygon(path[0], zone.coordinates)) continue;
      adjustedPath = detourAroundZone(adjustedPath, zone);
    }
  }

  return adjustedPath;
}

/**
 * Desvía una ruta alrededor de una zona de exclusión.
 * Solo inserta un arco de puntos por cada bloque contiguo que cruza la zona.
 */
function detourAroundZone(path: Coordinate[], zone: ExclusionZone): Coordinate[] {
  if (path.length < 2) return path;

  const centroid = getPolygonCentroid(zone.coordinates);
  const safetyBuffer = 100; // metros
  const maxRadius = zone.coordinates.reduce(
    (max, vertex) => Math.max(max, haversineDistance(centroid, vertex)),
    0
  );
  const radius = maxRadius + safetyBuffer;

  const newPath: Coordinate[] = [];
  let alreadyDetoured = false;

  for (let i = 0; i < path.length - 1; i++) {
    newPath.push(path[i]);

    if (alreadyDetoured) continue;
    if (!doesLineIntersectPolygon(path[i], path[i + 1], zone.coordinates)) continue;

    // Buscar el final del bloque que cruza la zona
    let exitIndex = i + 1;
    while (
      exitIndex < path.length - 1 &&
      doesLineIntersectPolygon(path[exitIndex], path[exitIndex + 1], zone.coordinates)
    ) {
      exitIndex += 1;
    }

    // Arco de puntos fuera de la zona, en el sentido angular más corto
    const entryBearing = calculateBearing(centroid, path[i]);
    const exitBearing = calculateBearing(centroid, path[exitIndex]);
    const delta = ((exitBearing - entryBearing + 540) % 360) - 180;
    const steps = 8;

    for (let step = 1; step <= steps; step++) {
      const bearing = entryBearing + (delta * step) / (steps + 1);
      newPath.push(destinationPoint(centroid, radius, bearing));
    }

    // Saltar los puntos originales que quedan dentro de la zona
    i = exitIndex - 1;
    alreadyDetoured = true;
  }

  newPath.push(path[path.length - 1]);
  return newPath;
}

/**
 * Calcula el centroide de un polígono
 */
function getPolygonCentroid(polygon: Coordinate[]): Coordinate {
  let lat = 0;
  let lng = 0;
  for (const point of polygon) {
    lat += point.lat;
    lng += point.lng;
  }
  return { lat: lat / polygon.length, lng: lng / polygon.length };
}

/**
 * Calcula los bounds de un array de coordenadas
 */
export function calculateBounds(coordinates: Coordinate[]): Bounds {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = coordinates[0].lat;
  let south = coordinates[0].lat;
  let east = coordinates[0].lng;
  let west = coordinates[0].lng;

  for (const coord of coordinates) {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  }

  return { north, south, east, west };
}

/**
 * Suaviza una ruta usando interpolación de Catmull-Rom
 */
export function smoothPath(path: Coordinate[], tension: number = 0.5): Coordinate[] {
  if (path.length < 4) return path;

  const smoothed: Coordinate[] = [path[0]];

  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[Math.max(0, i - 1)];
    const p1 = path[i];
    const p2 = path[i + 1];
    const p3 = path[Math.min(path.length - 1, i + 2)];

    // Generar puntos intermedios
    for (let t = 0; t < 1; t += 0.25) {
      const tt = t * t;
      const ttt = tt * t;

      const q1 = -tension * ttt + 2 * tension * tt - tension * t;
      const q2 = (2 - tension) * ttt + (tension - 3) * tt + 1;
      const q3 = (tension - 2) * ttt + (3 - 2 * tension) * tt + tension * t;
      const q4 = tension * ttt - tension * tt;

      const lat = q1 * p0.lat + q2 * p1.lat + q3 * p2.lat + q4 * p3.lat;
      const lng = q1 * p0.lng + q2 * p1.lng + q3 * p2.lng + q4 * p3.lng;

      smoothed.push({ lat, lng });
    }
  }

  smoothed.push(path[path.length - 1]);
  return smoothed;
}