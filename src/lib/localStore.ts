// Almacenamiento local (fallback sin Firebase) para paseos, estadísticas y ranking

import type { Coordinate } from '../types';

export interface LocalWalk {
  id: string;
  userId: string;
  username: string;
  startTime: string;
  endTime: string;
  targetDistance: number;
  actualDistance: number;
  duration: number;
  route: Coordinate[];
  completed: boolean;
  createdAt: string;
}

export interface LocalLeaderboardEntry {
  userId: string;
  username: string;
  totalKm: number;
  totalWalks: number;
  lastWalk: string;
  avatar?: string;
}

export interface LocalStats {
  totalKm: number;
  totalWalks: number;
  totalTime: number;
  longestWalk: number;
  streakDays: number;
  lastWalkDate?: string;
}

const WALKS_KEY = 'cozy-walks-walks';
const LEADERBOARD_KEY = 'cozy-walks-leaderboard';
const USERS_KEY = 'cozy-walks-users';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function getLocalWalks(userId?: string): LocalWalk[] {
  const walks = readJson<LocalWalk[]>(WALKS_KEY, []);
  const sorted = [...walks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return userId ? sorted.filter((w) => w.userId === userId) : sorted;
}

export function getLocalLeaderboard(): LocalLeaderboardEntry[] {
  return readJson<LocalLeaderboardEntry[]>(LEADERBOARD_KEY, [])
    .filter((entry) => entry.totalKm > 0)
    .sort((a, b) => b.totalKm - a.totalKm);
}

// Elimina a un usuario del ranking local y borra sus paseos guardados
export function deleteLocalLeaderboardEntry(userId: string): void {
  const leaderboard = readJson<LocalLeaderboardEntry[]>(LEADERBOARD_KEY, [])
    .filter((entry) => entry.userId !== userId);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));

  const walks = readJson<LocalWalk[]>(WALKS_KEY, [])
    .filter((walk) => walk.userId !== userId);
  localStorage.setItem(WALKS_KEY, JSON.stringify(walks));
}

export function getLocalStats(userId: string): LocalStats {
  const walks = getLocalWalks(userId).filter((w) => w.completed);
  return {
    totalKm: round1(walks.reduce((sum, w) => sum + w.actualDistance, 0)),
    totalWalks: walks.length,
    totalTime: walks.reduce((sum, w) => sum + w.duration, 0),
    longestWalk: walks.reduce((max, w) => Math.max(max, w.actualDistance), 0),
    streakDays: calculateStreak(walks),
    lastWalkDate: walks[0]?.createdAt,
  };
}

function calculateStreak(walks: LocalWalk[]): number {
  const days = new Set(
    walks.map((w) => {
      const d = new Date(w.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  let streak = 0;
  const cursor = new Date();
  while (days.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function saveLocalWalk(
  input: Omit<LocalWalk, 'id' | 'createdAt'>
): LocalWalk {
  const walks = readJson<LocalWalk[]>(WALKS_KEY, []);
  const walk: LocalWalk = {
    ...input,
    id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  walks.push(walk);
  localStorage.setItem(WALKS_KEY, JSON.stringify(walks.slice(-500)));

  // Actualizar ranking local
  const leaderboard = readJson<LocalLeaderboardEntry[]>(LEADERBOARD_KEY, []);
  const existing = leaderboard.find((entry) => entry.userId === walk.userId);
  if (existing) {
    existing.totalKm = round1(existing.totalKm + walk.actualDistance);
    existing.totalWalks += 1;
    existing.lastWalk = walk.createdAt;
    existing.username = walk.username;
  } else {
    leaderboard.push({
      userId: walk.userId,
      username: walk.username,
      totalKm: round1(walk.actualDistance),
      totalWalks: 1,
      lastWalk: walk.createdAt,
    });
  }
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));

  // Actualizar stats del perfil local (si existe)
  const users = readJson<Record<string, any>>(USERS_KEY, {});
  if (users[walk.userId]) {
    const stats = getLocalStats(walk.userId);
    users[walk.userId].stats = stats;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  return walk;
}
