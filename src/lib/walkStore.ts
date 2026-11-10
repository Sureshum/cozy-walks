// Guarda un paseo completado en Firestore (si está configurado) o en localStorage

import { Timestamp } from 'firebase/firestore';
import { auth, isConfigured } from './firebase';
import { saveWalk } from './firestore';
import { saveLocalWalk } from './localStore';
import type { Coordinate } from '../types';

interface PersistWalkInput {
  user: { id: string; username: string } | null;
  routePath: Coordinate[];
  targetDistance: number;
  actualDistance: number;
  durationSeconds: number;
  startedAt: Date;
  completed: boolean;
}

export type PersistWalkResult = 'firebase' | 'local';

export async function persistWalk(input: PersistWalkInput): Promise<PersistWalkResult> {
  const {
    user,
    routePath,
    targetDistance,
    actualDistance,
    durationSeconds,
    startedAt,
    completed,
  } = input;

  const userId = user?.id || 'local-walker';
  const username = user?.username || 'Caminante';
  const endTime = new Date();

  const canUseFirebase =
    isConfigured &&
    !!auth?.currentUser &&
    !!user &&
    auth.currentUser.uid === user.id;

  if (canUseFirebase) {
    try {
      await saveWalk({
        userId,
        username,
        startTime: Timestamp.fromDate(startedAt),
        endTime: Timestamp.fromDate(endTime),
        targetDistance,
        actualDistance: Math.round(actualDistance * 10) / 10,
        duration: Math.round(durationSeconds),
        route: routePath,
        completed,
      });
      return 'firebase';
    } catch (error) {
      console.warn('No se pudo guardar en Firestore, usando almacenamiento local:', error);
    }
  }

  saveLocalWalk({
    userId,
    username,
    startTime: startedAt.toISOString(),
    endTime: endTime.toISOString(),
    targetDistance,
    actualDistance: Math.round(actualDistance * 10) / 10,
    duration: Math.round(durationSeconds),
    route: routePath,
    completed,
  });
  return 'local';
}
