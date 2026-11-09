// Componente raíz de la aplicación

import { useState } from 'react';
import MapScreen from './components/MapScreen';
import { AppProvider } from './context/AppContext';
import { COZY_MESSAGES } from './utils/constants';
import './App.css';

interface AppProps {
  apiKey: string;
}

function AppContent({ apiKey }: AppProps) {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <div className="min-h-screen bg-cozy-50 relative overflow-hidden">
      {/* Fondo decorativo animado */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-cozy-200/50 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-terracotta-200/30 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-sage-200/20 blur-3xl animate-pulse-soft" />
      </div>

      {/* Partículas flotantes */}
      <FloatingParticles count={8} />

      <AppProvider>
        <main className="relative z-10 min-h-screen flex flex-col">
          {/* Header minimalista */}
          <header className="relative z-20 px-4 py-4 md:px-6 md:py-5">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cozy-400 to-terracotta-500 flex items-center justify-center text-white text-xl shadow-cozy">
                  🌿
                </div>
                <div>
                  <h1 className="font-bold text-xl md:text-2xl text-cozy-800 tracking-tight">
                    Cozy Walks
                  </h1>
                  <p className="text-xs text-cozy-500 hidden sm:block">
                    Tu compañero de paseos acogedores
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-cozy-200 shadow-cozy">
                <span className="text-xs font-medium text-cozy-600">📱 PWA Ready</span>
              </div>
            </div>
          </header>

          {/* Contenido principal - Mapa a pantalla completa */}
          <div className="flex-1 relative px-4 md:px-6 pb-4 md:pb-6">
            <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] min-h-[500px] max-h-[800px] rounded-3xl overflow-hidden shadow-cozy-lg">
              <MapScreen apiKey={apiKey} />
            </div>
          </div>

          {/* Footer sutil */}
          <footer className="relative z-20 px-4 py-3 md:px-6">
            <p className="text-center text-xs text-cozy-400 max-w-4xl mx-auto">
              Hecho con 💚 para caminantes soñadores · Datos de mapa © Google Maps
            </p>
          </footer>
        </main>

        {/* Modal de bienvenida */}
        {showWelcome && (
          <WelcomeModal onClose={() => setShowWelcome(false)} />
        )}
      </AppProvider>
    </div>
  );
}

// Partículas flotantes decorativas
function FloatingParticles({ count }: { count: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 20 + 10,
    delay: Math.random() * 6,
    duration: Math.random() * 4 + 4,
    emoji: ['🍃', '🌸', '🌱', '🌿', '🍂', '🌼'][Math.floor(Math.random() * 6)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute text-2xl opacity-20 animate-float"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

// Modal de bienvenida cozy
function WelcomeModal({ onClose }: { onClose: () => void }) {
  const messages = COZY_MESSAGES.welcome;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-cozy-xl border border-cozy-200 overflow-hidden animate-slide-up">
        <div className="p-6 md:p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cozy-100 to-terracotta-100 flex items-center justify-center text-4xl animate-bounce-gentle">
            🌿
          </div>
          <h2 id="welcome-title" className="text-2xl font-bold text-cozy-800 mb-2">
            ¡Bienvenido a Cozy Walks!
          </h2>
          <p className="text-cozy-600 mb-6 leading-relaxed">
            {messages[Math.floor(Math.random() * messages.length)]}
          </p>

          <div className="space-y-3 mb-6 text-left">
            <FeatureItem icon="🗺️" text="Rutas circulares únicas cada día" />
            <FeatureItem icon="🛡️" text="Evita zonas inseguras automáticamente" />
            <FeatureItem icon="👟" text="Avatar en tiempo real con GPS" />
            <FeatureItem icon="🌸" text="Estética acogedora y relajante" />
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-semibold text-lg bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white shadow-cozy hover:shadow-cozy-lg hover:from-cozy-600 hover:to-terracotta-600 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-400 focus-visible:ring-offset-2"
          >
            Empezar a caminar 👟
          </button>

          <p className="mt-4 text-xs text-cozy-400">
            Activa la geolocalización para la mejor experiencia
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-cozy-50 border border-cozy-100">
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <span className="text-sm text-cozy-700">{text}</span>
    </div>
  );
}

export default function App({ apiKey }: AppProps) {
  return <AppContent apiKey={apiKey} />;
}