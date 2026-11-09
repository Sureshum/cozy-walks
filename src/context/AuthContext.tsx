// Contexto de autenticación con "base de datos" en localStorage
// Simplificado: sin API key (Leaflet + OSRM son gratis)

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { User, UserSettings, AuthState, AuthAction } from '../types/auth';
import { hashPassword, verifyPassword, generateId } from '../types/auth';

const STORAGE_KEY = 'cozy-walks-users';
const SESSION_KEY = 'cozy-walks-session';

const defaultSettings: UserSettings = {
  defaultDistance: 3,
  units: 'km',
  theme: 'cozy',
  notifications: true,
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  needsApiKey: false, // Ya no necesario con Leaflet
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
        needsApiKey: false,
      };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, error: action.payload, isAuthenticated: false };
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_SETTINGS':
      if (state.user) {
        return {
          ...state,
          user: {
            ...state.user,
            settings: { ...state.user.settings, ...action.payload },
          },
        };
      }
      return state;
    default:
      return state;
  }
}

// Leer "base de datos" de localStorage
function getUsers(): Record<string, User> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, User>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// Obtener sesión guardada
function getSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function setSession(userId: string): void {
  localStorage.setItem(SESSION_KEY, userId);
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

interface AuthContextValue extends AuthState {
  register: (username: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar sesión al cargar
  useEffect(() => {
    const initAuth = async () => {
      const userId = getSession();
      if (userId) {
        const users = getUsers();
        const user = users[userId];
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
          return;
        }
      }
      dispatch({ type: 'AUTH_ERROR', payload: '' }); // Solo para quitar loading
    };
    initAuth();
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'AUTH_ERROR', payload: '' }), []);

  const register = useCallback(async (username: string, email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const users = getUsers();
      
      // Verificar si email ya existe
      const exists = Object.values(users).some(u => u.email === email);
      if (exists) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Este email ya está registrado' });
        return false;
      }

      const passwordHash = await hashPassword(password);
      const newUser: User = {
        id: generateId(),
        username,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        settings: defaultSettings,
      };

      users[newUser.id] = newUser;
      saveUsers(users);
      setSession(newUser.id);
      dispatch({ type: 'AUTH_SUCCESS', payload: newUser });
      return true;
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Error al registrar usuario' });
      return false;
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const users = getUsers();
      const user = Object.values(users).find(u => u.email === email);

      if (!user) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Usuario no encontrado' });
        return false;
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Contraseña incorrecta' });
        return false;
      }

      // Actualizar último login
      user.lastLogin = new Date().toISOString();
      users[user.id] = user;
      saveUsers(users);
      setSession(user.id);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      return true;
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Error al iniciar sesión' });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    // Disparar evento personalizado para que otros componentes reaccionen
    window.dispatchEvent(new CustomEvent('cozy-logout'));
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const updateSettings = useCallback(async (settings: Partial<UserSettings>): Promise<void> => {
    if (!state.user) return;
    
    const users = getUsers();
    const updatedUser = {
      ...state.user,
      settings: { ...state.user.settings, ...settings },
    };
    users[updatedUser.id] = updatedUser;
    saveUsers(users);
    setSession(updatedUser.id);
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        updateSettings,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}