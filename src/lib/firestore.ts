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

export async function getLeaderboard(limitCount = 100) {
  checkConfig();
  const usersRef = collection(db!, 'users');
  const q = query(usersRef, where('settings.shareStats', '==', true), where('stats.totalKm', '>', 0), orderBy('stats.totalKm', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(doc => {
    const data = doc.data();
    return { userId: doc.id, username: data.username, totalKm: data.stats?.totalKm || 0, totalWalks: data.stats?.totalWalks || 0, lastWalk: data.stats?.lastWalkDate || data.createdAt, avatar: data.photoURL };
  });
}

export function subscribeLeaderboard(callback: (entries: any[]) => void, limitCount = 50) {
  checkConfig();
  const usersRef = collection(db!, 'users');
  const q = query(usersRef, where('settings.shareStats', '==', true), where('stats.totalKm', '>', 0), orderBy('stats.totalKm', 'desc'), limit(limitCount));
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map(doc => {
      const data = doc.data();
      return { userId: doc.id, username: data.username, totalKm: data.stats?.totalKm || 0, totalWalks: data.stats?.totalWalks || 0, lastWalk: data.stats?.lastWalkDate || data.createdAt, avatar: data.photoURL };
    });
    callback(entries);
  }, (error) => console.error('Error en suscripción leaderboard:', error));
}

export async function getUserRank(userId: string): Promise<number | null> {
  checkConfig();
  const usersRef = collection(db!, 'users');
  const q = query(usersRef, where('settings.shareStats', '==', true), where('stats.totalKm', '>', 0), orderBy('stats.totalKm', 'desc'));
  const snap = await getDocs(q);
  const rank = snap.docs.findIndex(doc => doc.id === userId);
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