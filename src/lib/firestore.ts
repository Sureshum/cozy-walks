// Firestore services - Cozy Walks Global
// Operaciones CRUD para usuarios, walks, leaderboard

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  Timestamp,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';

function checkConfig() {
  if (!isConfigured || !db) {
    throw new Error('Firebase no está configurado. Configura variables VITE_FIREBASE_* en .env');
  }
  return db;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  settings: UserSettings;
  stats: UserStats;
}

export interface UserSettings {
  defaultDistance: number;
  units: 'km' | 'mi';
  theme: 'cozy' | 'dark' | 'light';
  notifications: boolean;
  shareStats: boolean;
}

export interface UserStats {
  totalKm: number;
  totalWalks: number;
  totalTime: number;
  longestWalk: number;
  streakDays: number;
  lastWalkDate?: Timestamp;
}

export interface WalkRecord {
  id: string;
  userId: string;
  username: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  targetDistance: number;
  actualDistance: number;
  duration: number;
  route: { lat: number; lng: number }[];
  completed: boolean;
  createdAt: Timestamp;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalKm: number;
  totalWalks: number;
  lastWalk: Timestamp;
  avatar?: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultDistance: 3,
  units: 'km',
  theme: 'cozy',
  notifications: true,
  shareStats: true,
};

const DEFAULT_STATS: UserStats = {
  totalKm: 0,
  totalWalks: 0,
  totalTime: 0,
  longestWalk: 0,
  streakDays: 0,
};

export async function upsertUserProfile(uid: string, data: Partial<UserProfile> & { username: string; email: string }): Promise<void> {
  checkConfig();
  const userRef = doc(db!, 'users', uid);
  await setDoc(userRef, {
    uid,
    username: data.username,
    email: data.email,
    displayName: data.displayName || data.username,
    photoURL: data.photoURL || null,
    createdAt: data.createdAt || Timestamp.now(),
    lastLoginAt: Timestamp.now(),
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
    stats: { ...DEFAULT_STATS, ...data.stats },
  }, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  checkConfig();
  const userRef = doc(db!, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export async function updateLastLogin(uid: string): Promise<void> {
  checkConfig();
  const userRef = doc(db!, 'users', uid);
  await updateDoc(userRef, { lastLoginAt: Timestamp.now() });
}

export async function updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
  checkConfig();
  const userRef = doc(db!, 'users', uid);
  await updateDoc(userRef, { settings: settings });
}

export async function saveWalk(walk: Omit<WalkRecord, 'id' | 'createdAt'>): Promise<string> {
  checkConfig();
  const walksRef = collection(db!, 'walks');
  const walkRef = doc(walksRef);
  const walkData: WalkRecord = { ...walk, id: walkRef.id, createdAt: Timestamp.now() };
  await setDoc(walkRef, walkData);
  
  await runTransaction(db!, async (transaction) => {
    const userRef = doc(db!, 'users', walk.userId);
    const userDoc = await transaction.get(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data() as any;
      const newStats = {
        totalKm: (userData.stats?.totalKm || 0) + walk.actualDistance,
        totalWalks: (userData.stats?.totalWalks || 0) + 1,
        totalTime: (userData.stats?.totalTime || 0) + walk.duration,
        longestWalk: Math.max(userData.stats?.longestWalk || 0, walk.actualDistance),
        streakDays: userData.stats?.streakDays || 0,
        lastWalkDate: Timestamp.now(),
      };
      transaction.update(userRef, { 'stats': newStats });
    }
  });
  return walkRef.id;
}

export async function getUserWalks(userId: string, limitCount = 50) {
  checkConfig();
  const walksRef = collection(db!, 'walks');
  const q = query(walksRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Normaliza y ordena el ranking en el cliente para no exigir índices compuestos
function mapLeaderboardDocs(docs: any[], limitCount: number) {
  return docs
    .map((doc) => {
      const data = doc.data();
      return {
        userId: doc.id,
        username: data.username,
        totalKm: data.stats?.totalKm || 0,
        totalWalks: data.stats?.totalWalks || 0,
        lastWalk: data.stats?.lastWalkDate || data.createdAt,
        avatar: data.photoURL,
      };
    })
    .filter((entry) => entry.totalKm > 0)
    .sort((a, b) => b.totalKm - a.totalKm)
    .slice(0, limitCount);
}

export async function getLeaderboard(limitCount = 100) {
  checkConfig();
  const usersRef = collection(db!, 'users');
  const q = query(usersRef, where('settings.shareStats', '==', true), limit(200));
  const snap = await getDocs(q);
  return mapLeaderboardDocs(snap.docs, limitCount);
}

export function subscribeLeaderboard(
  callback: (entries: any[]) => void,
  limitCount = 50,
  onError?: (error: unknown) => void
) {
  checkConfig();
  const usersRef = collection(db!, 'users');
  const q = query(usersRef, where('settings.shareStats', '==', true), limit(200));
  return onSnapshot(q, (snap) => {
    callback(mapLeaderboardDocs(snap.docs, limitCount));
  }, (error) => {
    // Reglas sin publicar, sin red, etc. El componente decide el fallback.
    console.warn('No se pudo leer el ranking global:', error);
    onError?.(error);
  });
}

export async function getUserRank(userId: string): Promise<number | null> {
  checkConfig();
  const usersRef = collection(db!, 'users');
  const q = query(usersRef, where('settings.shareStats', '==', true), limit(200));
  const snap = await getDocs(q);
  const entries = mapLeaderboardDocs(snap.docs, 200);
  const rank = entries.findIndex((entry) => entry.userId === userId);
  return rank >= 0 ? rank + 1 : null;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  checkConfig();
  const usersRef = collection(db!, 'users');
  const q = query(usersRef, where('username', '==', username), limit(1));
  const snap = await getDocs(q);
  return snap.empty;
}

export async function findUserByEmail(email: string) {
  checkConfig();
  const usersRef = collection(db!, 'users');
  const q = query(usersRef, where('email', '==', email), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { uid: doc.id, ...doc.data() };
}

export async function deleteUserAccount(uid: string): Promise<void> {
  checkConfig();
  const batch = writeBatch(db!);
  const walksRef = collection(db!, 'walks');
  const walksQuery = query(walksRef, where('userId', '==', uid));
  const walksSnap = await getDocs(walksQuery);
  walksSnap.docs.forEach(doc => batch.delete(doc.ref));
  const userRef = doc(db!, 'users', uid);
  batch.delete(userRef);
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Administración
// ---------------------------------------------------------------------------

// Admin = email listado en VITE_ADMIN_EMAILS o documento en `admins/{uid}`.
// El documento se crea a mano desde la consola de Firebase (nadie puede
// autoasignarse el rol desde el navegador).
export async function isAdminUser(uid: string, email?: string | null): Promise<boolean> {
  const envAdmins = ((import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (email && envAdmins.includes(email.toLowerCase())) return true;
  if (!isConfigured || !db) return false;

  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch (error) {
    console.warn('No se pudo comprobar el rol de administrador:', error);
    return false;
  }
}

// Borra las carreras de un usuario y lo saca del ranking.
// Requiere reglas de Firestore que permitan a un admin escribir en users/walks.
export async function deleteLeaderboardEntry(userId: string): Promise<void> {
  checkConfig();
  const batch = writeBatch(db!);

  const walksRef = collection(db!, 'walks');
  const walksSnap = await getDocs(query(walksRef, where('userId', '==', userId)));
  walksSnap.docs.forEach((walkDoc) => batch.delete(walkDoc.ref));

  batch.update(doc(db!, 'users', userId), {
    'stats.totalKm': 0,
    'stats.totalWalks': 0,
    'stats.totalTime': 0,
    'stats.longestWalk': 0,
    'stats.streakDays': 0,
    'settings.shareStats': false,
  });

  await batch.commit();
}