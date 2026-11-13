// Panel de administración del ranking: borrar las carreras de un usuario

import { useState } from 'react';
import { deleteLeaderboardEntry } from '../lib/firestore';
import { deleteLocalLeaderboardEntry } from '../lib/localStore';

interface AdminEntry {
  userId: string;
  username: string;
  totalKm: number;
  totalWalks: number;
}

interface AdminPanelProps {
  entries: AdminEntry[];
  isUsingFirebase: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ entries, isUsingFirebase, onClose }) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const handleDelete = async (entry: AdminEntry) => {
    setBusyId(entry.userId);
    setError(null);
    setDone(null);

    try {
      if (isUsingFirebase) {
        await deleteLeaderboardEntry(entry.userId);
      } else {
        deleteLocalLeaderboardEntry(entry.userId);
      }
      setDone(`Se borraron las carreras de ${entry.username}`);
      setConfirmId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        /permission|insufficient/i.test(message)
          ? 'Firestore rechazo la operacion. Publica las reglas de admin (docs/FIREBASE_SETUP.md) o anade tu UID en la coleccion "admins".'
          : 'No se pudo borrar la entrada. Intentalo de nuevo.'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <div className="w-full max-w-lg max-h-[90dvh] bg-white rounded-3xl shadow-cozy-xl border border-cozy-200 overflow-hidden flex flex-col animate-slide-up">
        <div className="p-4 sm:p-6 border-b border-cozy-100 bg-gradient-to-r from-cozy-50 to-terracotta-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="admin-title" className="text-xl sm:text-2xl font-bold text-cozy-800">Administracion</h2>
              <p className="text-cozy-500 text-xs sm:text-sm mt-0.5">
                Borra las carreras de un caminante y sacalo del ranking
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/60 hover:bg-white text-cozy-500 hover:text-cozy-700 transition-colors"
              aria-label="Cerrar administracion"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-[11px] text-cozy-500">
            {isUsingFirebase ? 'Ranking global (Firestore)' : 'Ranking local (este dispositivo)'} · Esta accion no se puede deshacer
          </p>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-2">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm" role="alert">
              {error}
            </div>
          )}
          {done && (
            <div className="p-3 rounded-xl bg-sage-50 border border-sage-200 text-sage-700 text-xs sm:text-sm" role="status">
              {done}
            </div>
          )}

          {entries.length === 0 ? (
            <p className="text-center py-10 text-cozy-500 text-sm">No hay entradas en el ranking.</p>
          ) : (
            entries.map((entry, index) => (
              <div key={entry.userId} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-cozy-50 border border-cozy-100">
                <div className="w-8 h-8 shrink-0 rounded-full bg-cozy-200 text-cozy-600 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-cozy-800 truncate text-sm sm:text-base">{entry.username}</p>
                  <p className="text-[11px] sm:text-xs text-cozy-500">
                    {entry.totalKm} km · {entry.totalWalks} paseos
                  </p>
                </div>

                {confirmId === entry.userId ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(entry)}
                      disabled={busyId === entry.userId}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                      aria-busy={busyId === entry.userId}
                    >
                      {busyId === entry.userId ? 'Borrando...' : 'Si, borrar'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      disabled={busyId === entry.userId}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-cozy-200 text-cozy-600 text-xs font-medium transition-colors disabled:opacity-60"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setConfirmId(entry.userId); setDone(null); setError(null); }}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                    aria-label={`Eliminar carreras de ${entry.username}`}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-cozy-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white font-medium shadow-cozy hover:shadow-cozy-lg transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;