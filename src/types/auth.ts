// Tipos extendidos para autenticación y API Key

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // En producción: hash real con bcrypt/scrypt
  createdAt: string;
  lastLogin: string;
  settings: UserSettings;
}

export interface UserSettings {
  apiKey: string;
  defaultDistance: number;
  units: 'km' | 'mi';
  theme: 'cozy' | 'dark' | 'light';
  notifications: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsApiKey: boolean;
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_NEEDS_API_KEY'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> };

// Utilidades simples de "hash" para demo (en producción usar crypto.subtle o backend)
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

// Generar ID único simple
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Validar formato API Key de Google
export function validateGoogleApiKey(key: string): boolean {
  return /^AIza[0-9A-Za-z_-]{35}$/.test(key.trim());
}