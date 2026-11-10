// Leaderboard component - usa Firestore en tiempo real (global) + fallback localStorage

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeLeaderboard } from '../lib/firestore';

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalKm: number;
  totalWalks: number;
  lastWalk: any;
  avatar?: string;
}

interface LeaderboardProps {
  initialOpen?: boolean;
  onClose?: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ initialOpen = false, onClose }) => {
  const { logout, isUsingFirebase } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [showModal, setShowModal] = useState(initialOpen);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      const unsubscribe = subscribeLeaderboard(
        (entries: any[]) => {
          setEntries(entries);
          setIsLoading(false);
        },
        100
      );
      
      return () => unsubscribe();
    } catch (err) {
      // Sin Firebase configurado es el caso esperado: se usa localStorage
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Firebase no está configurado')) {
        console.warn('Ranking en modo local (Firebase no configurado)');
      } else {
        console.error('Error loading leaderboard:', err);
        setError('No se pudo cargar el ranking');
      }
      setIsLoading(false);
      
      // Fallback a localStorage
      try {
        const data = localStorage.getItem('cozy-walks-leaderboard');
        if (data) {
          setEntries(JSON.parse(data));
        }
      } catch {}
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = loadLeaderboard();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [loadLeaderboard]);

  const closeModal = () => {
    setShowModal(false);
    onClose?.();
  };

  const handleLogout = () => { void logout(); };

  const top3 = useMemo(() => entries.slice(0, 3), [entries]);

  // Modal para móviles / primera vez
  if (showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-lg max-h-[85vh] bg-white rounded-3xl shadow-cozy-xl border border-cozy-200 overflow-hidden animate-slide-up flex flex-col">
          <div className="p-6 md:p-8 border-b border-cozy-100 bg-gradient-to-r from-cozy-50 to-terracotta-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cozy-400 to-terracotta-500 flex items-center justify-center text-white text-2xl shadow-cozy">🏆</div>
                <div>
                  <h2 className="text-2xl font-bold text-cozy-800">Leaderboard</h2>
                  <p className="text-cozy-500 text-sm">Los caminantes más constantes {isUsingFirebase ? '🌍' : '💾'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl bg-white/50 hover:bg-white text-cozy-500 hover:text-cozy-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {isLoading ? (
              <div className="text-center py-12"><div className="w-12 h-12 mx-auto mb-3 border-4 border-cozy-300 border-t-cozy-500 rounded-full animate-spin" /><p className="text-cozy-500">Cargando ranking...</p></div>
            ) : error ? (
              <div className="text-center py-12 text-cozy-500"><p>{error}</p><button onClick={loadLeaderboard} className="mt-2 text-cozy-500 underline">Reintentar</button></div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12"><div className="text-5xl mb-3">🏃</div><h3 className="text-lg font-semibold text-cozy-700 mb-1">Aún no hay caminantes</h3><p className="text-cozy-500">¡Sé el primero en aparecer en el ranking!</p></div>
            ) : (
              <>
                {top3.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-cozy-500 uppercase tracking-wider mb-3">🏆 Podium</h3>
                    <div className="flex justify-center gap-2 md:gap-4 items-end">
                      {top3.map((entry, index) => {
                        const positions = [1, 0, 2];
                        const icons = ['🥈', '🥇', '🥉'];
                        const heights = ['h-24', 'h-32', 'h-20'];
                        return (
                          <div key={entry.userId} className="flex flex-col items-center">
                            <div className={`relative ${heights[positions[index]]} w-20 md:w-28 flex flex-col items-center justify-end`}>
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-3/4 bg-gradient-to-t from-cozy-100 to-white rounded-t-xl border border-cozy-200 border-b-0 flex items-center justify-center p-2">
                                <span className="text-2xl md:text-3xl">{icons[positions[index]]}</span>
                              </div>
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-cozy-400 to-terracotta-500 flex items-center justify-center text-white font-bold text-lg shadow-cozy z-10">{index + 1}</div>
                            </div>
                            <div className="mt-2 text-center w-28"><p className="font-semibold text-cozy-800 truncate">{entry.username}</p><p className="text-xs text-cozy-500">{entry.totalKm} km · {entry.totalWalks} paseos</p></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-cozy-500 uppercase tracking-wider mb-3">📋 Top 10</h3>
                  <div className="space-y-2">
                    {entries.slice(0, 10).map((entry, index) => (
                      <div key={entry.userId} className="flex items-center gap-3 p-3 rounded-xl bg-cozy-50 border border-cozy-100 hover:bg-cozy-100 transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index < 3 ? 'bg-gradient-to-br from-cozy-400 to-terracotta-500 text-white' : 'bg-cozy-200 text-cozy-600'}`}>{index + 1}</div>
                        <div className="flex-1 min-w-0"><p className="font-medium text-cozy-800 truncate">{entry.username}</p><p className="text-xs text-cozy-500">{entry.totalKm} km · {entry.totalWalks} paseos</p></div>
                        <div className="text-right"><p className="font-semibold text-cozy-700">{entry.totalKm} km</p><p className="text-xs text-cozy-500">{entry.totalWalks} paseos</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t border-cozy-100 flex justify-end gap-2">
            <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm border border-cozy-200 text-cozy-700 font-medium shadow-cozy hover:bg-cozy-50 transition-colors">Cerrar sesión</button>
            <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white font-medium shadow-cozy hover:shadow-cozy-lg transition-all">Continuar</button>
          </div>
        </div>
      </div>
    );
  }

  // Vista compacta para desktop
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-cozy-lg border border-cozy-200 p-4 md:p-6 max-w-sm w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-cozy-800 flex items-center gap-2"><span>🏆</span> Top Caminantes</h3>
        <button onClick={() => setShowModal(true)} className="p-1.5 rounded-lg bg-cozy-100 hover:bg-cozy-200 text-cozy-500 hover:text-cozy-700 transition-colors" aria-label="Ver leaderboard completo"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
      </div>

      {isLoading ? (
        <div className="text-center py-4"><div className="w-8 h-8 mx-auto mb-2 border-3 border-cozy-300 border-t-cozy-500 rounded-full animate-spin" /><p className="text-cozy-500 text-sm">Cargando...</p></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-6 text-cozy-500"><p className="text-sm">No hay datos aún</p><p className="text-xs mt-1">Completa tu primer paseo</p></div>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 5).map((entry, index) => (
            <div key={entry.userId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-cozy-50 transition-colors">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${index < 3 ? 'bg-gradient-to-br from-cozy-400 to-terracotta-500 text-white' : 'bg-cozy-200 text-cozy-600'}`}>{index + 1}</div>
              <div className="flex-1 min-w-0"><p className="font-medium text-cozy-800 truncate text-sm">{entry.username}</p><p className="text-xs text-cozy-500">{entry.totalKm} km · {entry.totalWalks} paseos</p></div>
              <div className="text-right"><p className="font-semibold text-cozy-700 text-sm">{entry.totalKm} km</p><p className="text-[10px] text-cozy-500">{entry.totalWalks} paseos</p></div>
            </div>
          ))}
        </div>
      )}
      
      <button onClick={() => setShowModal(true)} className="w-full mt-4 py-2 rounded-xl bg-cozy-100 hover:bg-cozy-200 text-cozy-600 font-medium text-sm transition-colors">Ver ranking completo 👀</button>
    </div>
  );
};

export default Leaderboard;