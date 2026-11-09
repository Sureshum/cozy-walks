// Componente raíz de la aplicación con flujo de autenticación completo

import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { COZY_MESSAGES } from './utils/constants';
import MapScreen from './components/MapScreen';
import AuthScreen from './components/AuthScreen';
import AsciiBackground from './components/AsciiBackground';
import './App.css';

// Componente interno que maneja el estado de autenticación
function AppInner() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  // Si está cargando, mostrar loader
  if (isLoading) {
    return (
      <div className="min-h-screen w-full relative flex items-center justify-center">
        <AsciiBackground />
        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cozy-500 to-terracotta-500 flex items-center justify-center text-3xl shadow-lg animate-bounce-gentle">
            🌿
          </div>
          <div className="w-12 h-12 mx-auto border-4 border-cozy-500/30 border-t-cozy-500 rounded-full animate-spin" />
          <p className="mt-4 text-cozy-300">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login/registro
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Usuario autenticado - mostrar app principal
  return (
    <div className="min-h-screen bg-cozy-50 relative overflow-hidden">
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
                <span className="text-xs font-medium text-cozy-600">📱 PWA Ready · 100% Gratis</span>
              </div>
            </div>
          </header>

          {/* Contenido principal - Mapa a pantalla completa */}
          <div className="flex-1 relative px-4 md:px-6 pb-4 md:pb-6">
            <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] min-h-[500px] max-h-[800px] rounded-3xl overflow-hidden shadow-cozy-lg">
              <MapScreen />
            </div>
          </div>

          {/* Footer sutil */}
          <footer className="relative z-20 px-4 py-3 md:px-6">
            <p className="text-center text-xs text-cozy-400 max-w-4xl mx-auto">
              Hecho con 💚 para caminantes soñadores · Mapas por <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener" className="underline hover:text-cozy-600">OpenStreetMap</a> & <a href="https://carto.com/" target="_blank" rel="noopener" className="underline hover:text-cozy-600">CARTO</a> · Rutas por <a href="https://project-osrm.org/" target="_blank" rel="noopener" className="underline hover:text-cozy-600">OSRM</a>
            </p>
          </footer>
        </main>

        {/* Modal de bienvenida (solo primera vez) */}
        {showWelcome && (
          <WelcomeModal onClose={() => setShowWelcome(false)} />
        )}
      </AppProvider>
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
            <FeatureItem icon="🗺️" text="Rutas circulares únicas cada día (OSRM gratis)" />
            <FeatureItem icon="🛡️" text="Evita zonas inseguras automáticamente" />
            <FeatureItem icon="👟" text="Avatar en tiempo real con GPS nativo" />
            <FeatureItem icon="🌸" text="Estética acogedora y relajante" />
            <FeatureItem icon="💰" text="100% gratis, sin tarjeta, sin API key" />
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

// App principal con providers
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}