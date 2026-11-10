// Tipos para autenticación (híbrido: Firebase + localStorage)

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // Solo en localStorage
  createdAt: string; // ISO string
  lastLogin: string; // ISO string
  settings: UserSettings;
}

export interface UserSettings {
  defaultDistance: number;
  units: 'km' | 'mi';
  theme: 'cozy' | 'dark' | 'light';
  notifications: boolean;
  shareStats: boolean; // Para leaderboard público
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsApiKey: boolean; // Legacy, siempre false
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'SET_NEEDS_API_KEY'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'SET_FIREBASE_USER'; payload: { firebaseUser: any; profile: User } | null };

// Utilidades de hash con Web Crypto API (solo para localStorage fallback)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'cozy-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Validar formato API Key de Google (legacy)
export function validateGoogleApiKey(key: string): boolean {
  return /^AIza[0-9A-Za-z_-]{35}$/.test(key.trim());
}