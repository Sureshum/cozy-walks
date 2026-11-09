// Hook para gestionar el estado de la aplicación

import { createContext, useContext, useReducer, type ReactNode, useCallback } from 'react';
import type { AppState, MapMode, WalkSession } from '../types';
import { EXCLUSION_ZONES } from '../utils/constants';

type Action =
  | { type: 'SET_MAP_MODE'; payload: MapMode }
  | { type: 'SET_SELECTED_DISTANCE'; payload: number }
  | { type: 'SET_CURRENT_ROUTE'; payload: AppState['currentRoute'] }
  | { type: 'SET_USER_LOCATION'; payload: AppState['userLocation'] }
  | { type: 'SET_WALK_SESSION'; payload: WalkSession | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MAP_LOADED'; payload: boolean }
  | { type: 'RESET_APP' };

const initialState: AppState = {
  mapMode: 'idle',
  selectedDistance: 3,
  currentRoute: null,
  userLocation: null,
  exclusionZones: EXCLUSION_ZONES,
  walkSession: null,
  error: null,
  isMapLoaded: false,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MAP_MODE':
      return { ...state, mapMode: action.payload };
    case 'SET_SELECTED_DISTANCE':
      return { ...state, selectedDistance: action.payload };
    case 'SET_CURRENT_ROUTE':
      return { ...state, currentRoute: action.payload };
    case 'SET_USER_LOCATION':
      return { ...state, userLocation: action.payload };
    case 'SET_WALK_SESSION':
      return { ...state, walkSession: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_MAP_LOADED':
      return { ...state, isMapLoaded: action.payload };
    case 'RESET_APP':
      return initialState;
    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  setMapMode: (mode: MapMode) => void;
  setSelectedDistance: (distance: number) => void;
  setCurrentRoute: (route: AppState['currentRoute']) => void;
  setUserLocation: (location: AppState['userLocation']) => void;
  setWalkSession: (session: WalkSession | null) => void;
  setError: (error: string | null) => void;
  setMapLoaded: (loaded: boolean) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setMapMode = useCallback((mode: MapMode) => dispatch({ type: 'SET_MAP_MODE', payload: mode }), []);
  const setSelectedDistance = useCallback((distance: number) => dispatch({ type: 'SET_SELECTED_DISTANCE', payload: distance }), []);
  const setCurrentRoute = useCallback((route: AppState['currentRoute']) => dispatch({ type: 'SET_CURRENT_ROUTE', payload: route }), []);
  const setUserLocation = useCallback((location: AppState['userLocation']) => dispatch({ type: 'SET_USER_LOCATION', payload: location }), []);
  const setWalkSession = useCallback((session: WalkSession | null) => dispatch({ type: 'SET_WALK_SESSION', payload: session }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }), []);
  const setMapLoaded = useCallback((loaded: boolean) => dispatch({ type: 'SET_MAP_LOADED', payload: loaded }), []);
  const resetApp = useCallback(() => dispatch({ type: 'RESET_APP' }), []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setMapMode,
        setSelectedDistance,
        setCurrentRoute,
        setUserLocation,
        setWalkSession,
        setError,
        setMapLoaded,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}