// Contexto de autenticación HÍBRIDO - Firebase (global) + localStorage (local/offline)

import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { hashPassword, verifyPassword, generateId } from '../types/auth';
import { auth, isConfigured } from '../lib/firebase';

const DEFAULT_SETTINGS = {
  defaultDistance: 3,
  units: 'km' as const,
  theme: 'cozy' as const,
  notifications: true,
  shareStats: true,
};

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null as string | null,
  needsApiKey: false,
};

function authReducer(s: any, a: any) {
  switch (a.type) {
    case 'AUTH_START':
      return { ...s, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...s, isLoading: false, isAuthenticated: true, user: a.payload, error: null, needsApiKey: false };
    case 'AUTH_ERROR':
      return { ...s, isLoading: false, error: a.payload, isAuthenticated: false };
    case 'AUTH_LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false, error: null, needsApiKey: false };
    case 'SET_NEEDS_API_KEY':
      return { ...s, needsApiKey: a.payload };
    case 'UPDATE_SETTINGS':
      return s.user ? { ...s, user: { ...s.user, settings: { ...s.user.settings, ...a.payload } } } : s;
    case 'SET_FIREBASE_USER':
      return a.payload
        ? { ...s, isLoading: false, isAuthenticated: true, user: a.payload.profile, error: null, needsApiKey: false }
        : { ...s, isLoading: false };
    default:
      return s;
  }
}

const AuthContext = createContext<any>(undefined);

function readLocalUsers(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem('cozy-walks-users') || '{}');
  } catch {
    return {};
  }
}

function profileFromFirebase(fu: any, profile?: any) {
  return {
    id: fu.uid,
    username: profile?.username || fu.displayName || fu.email?.split('@')[0] || 'Walker',
    email: fu.email || '',
    passwordHash: '',
    createdAt: profile?.createdAt || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    settings: profile?.settings || { ...DEFAULT_SETTINGS },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Firebase listener + fallback a sesión local
  useEffect(() => {
    if (!isConfigured || !auth) {
      const id = localStorage.getItem('cozy-walks-session');
      if (id) {
        const user = readLocalUsers()[id];
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
          return;
        }
      }
      dispatch({ type: 'AUTH_ERROR', payload: '' });
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth!, async (fu) => {
        if (fu) {
          try {
            const { getUserProfile } = await import('../lib/firestore');
            const profile = await getUserProfile(fu.uid);
            dispatch({ type: 'SET_FIREBASE_USER', payload: { firebaseUser: fu, profile: profileFromFirebase(fu, profile) } });
          } catch {
            dispatch({ type: 'AUTH_ERROR', payload: 'Error cargando perfil' });
          }
        } else {
          dispatch({ type: 'SET_FIREBASE_USER', payload: null });
        }
        setIsFirebaseReady(true);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // Si Firebase tarda demasiado, intentar restaurar la sesión local
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isFirebaseReady && state.isLoading) {
        const id = localStorage.getItem('cozy-walks-session');
        if (id) {
          const user = readLocalUsers()[id];
          if (user) {
            dispatch({ type: 'AUTH_SUCCESS', payload: user });
            return;
          }
        }
        dispatch({ type: 'AUTH_ERROR', payload: '' });
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [isFirebaseReady, state.isLoading]);

  const clearError = useCallback(() => dispatch({ type: 'AUTH_ERROR', payload: '' }), []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      if (isConfigured && auth) {
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: username });
        const { upsertUserProfile } = await import('../lib/firestore');
        await upsertUserProfile(cred.user.uid, { username, email });
        const up = profileFromFirebase(cred.user, { username });
        dispatch({ type: 'AUTH_SUCCESS', payload: up });
        return true;
      }

      const users = readLocalUsers();
      if (Object.values(users).some((u: any) => u.email === email)) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Este email ya está registrado' });
        return false;
      }
      const passwordHash = await hashPassword(password);
      const newUser = {
        id: generateId(),
        username,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        settings: { ...DEFAULT_SETTINGS },
      };
      users[newUser.id] = newUser;
      localStorage.setItem('cozy-walks-users', JSON.stringify(users));
      localStorage.setItem('cozy-walks-session', newUser.id);
      dispatch({ type: 'AUTH_SUCCESS', payload: newUser });
      return true;
    } catch (e: any) {
      const m = e.code === 'auth/email-already-in-use'
        ? 'Este email ya está registrado'
        : e.code === 'auth/weak-password'
          ? 'La contraseña es muy débil (mínimo 6 caracteres)'
          : e.code === 'auth/invalid-email'
            ? 'Email inválido'
            : 'Error al registrar usuario';
      dispatch({ type: 'AUTH_ERROR', payload: m });
      return false;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      if (isConfigured && auth) {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, email, password);
        return true;
      }

      const users = readLocalUsers();
      const user: any = Object.values(users).find((x: any) => x.email === email);
      if (!user) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Usuario no encontrado' });
        return false;
      }
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Contraseña incorrecta' });
        return false;
      }
      user.lastLogin = new Date().toISOString();
      users[user.id] = user;
      localStorage.setItem('cozy-walks-users', JSON.stringify(users));
      localStorage.setItem('cozy-walks-session', user.id);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      return true;
    } catch (e: any) {
      const m = e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password'
        ? 'Email o contraseña incorrectos'
        : e.code === 'auth/invalid-email'
          ? 'Email inválido'
          : e.code === 'auth/too-many-requests'
            ? 'Demasiados intentos. Intenta más tarde.'
            : 'Error al iniciar sesión';
      dispatch({ type: 'AUTH_ERROR', payload: m });
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (isConfigured && auth) {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } else {
      localStorage.removeItem('cozy-walks-session');
    }
    dispatch({ type: 'AUTH_LOGOUT' });
    window.dispatchEvent(new CustomEvent('cozy-logout'));
  }, []);

  const updateSettings = useCallback(async (s: any) => {
    try {
      if (isConfigured && auth?.currentUser) {
        const { updateUserSettings } = await import('../lib/firestore');
        await updateUserSettings(auth.currentUser.uid, s);
      } else {
        const id = localStorage.getItem('cozy-walks-session');
        if (id) {
          const users = readLocalUsers();
          if (users[id]) {
            users[id].settings = { ...users[id].settings, ...s };
            localStorage.setItem('cozy-walks-users', JSON.stringify(users));
          }
        }
      }
      dispatch({ type: 'UPDATE_SETTINGS', payload: s });
    } catch (e) {
      console.error('Error actualizando settings:', e);
    }
  }, []);

  const ctx = {
    ...state,
    register,
    login,
    logout,
    updateSettings,
    clearError,
    isUsingFirebase: isConfigured && !!auth,
  };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used within an AuthProvider');
  return c;
}
