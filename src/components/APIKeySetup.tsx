// Pantalla de configuración de API Key - antes del login

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AsciiBackground from './AsciiBackground';
import { validateGoogleApiKey } from '../types/auth';

const APIKeySetup: React.FC = () => {
  const { setApiKey } = useAuth();
  const [apiKey, setApiKeyState] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = apiKey.trim();
    
    if (!validateGoogleApiKey(trimmedKey)) {
      setValidationError('Formato inválido. Debe ser: AIza... (39 caracteres)');
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    
    try {
      await setApiKey(trimmedKey);
    } catch (error) {
      setValidationError('Error al guardar la API Key');
    } finally {
      setIsValidating(false);
    }
  }, [apiKey, setApiKey]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (validateGoogleApiKey(pasted)) {
      setApiKeyState(pasted);
      setValidationError(null);
    }
  }, []);

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      <AsciiBackground />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Card principal */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cozy-500 to-terracotta-500 flex items-center justify-center text-3xl shadow-lg">
              🌿
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Cozy Walks</h1>
            <p className="text-cozy-300">Configura tu API Key de Google Maps para comenzar</p>
          </div>

          {/* Tutorial compacto */}
          <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/5">
            <h3 className="text-cozy-200 font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">🔑</span>
              Cómo obtener tu API Key
            </h3>
            <ol className="space-y-2 text-cozy-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cozy-500/20 flex items-center justify-center text-xs font-mono text-cozy-100">1</span>
                <span>Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-cozy-300 hover:text-white underline">Google Cloud Console</a></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cozy-500/20 flex items-center justify-center text-xs font-mono text-cozy-100">2</span>
                <span>Crea un proyecto nuevo o selecciona uno existente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cozy-500/20 flex items-center justify-center text-xs font-mono text-cozy-100">3</span>
                <span>Habilita <strong>Maps JavaScript API</strong> y <strong>Directions API</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cozy-500/20 flex items-center justify-center text-xs font-mono text-cozy-100">4</span>
                <span>Ve a <strong>Credenciales → Crear credenciales → Clave de API</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cozy-500/20 flex items-center justify-center text-xs font-mono text-cozy-100">5</span>
                <span>Restringe la clave: <strong>HTTP referrers</strong> (tu dominio) y <strong>APIs: Maps JavaScript API, Directions API</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cozy-500/20 flex items-center justify-center text-xs font-mono text-cozy-100">6</span>
                <span>Copia la clave (empieza con <code className="text-cozy-200 bg-white/5 px-1 rounded">AIza...</code>) y pégala abajo</span>
              </li>
            </ol>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="apiKey" className="block text-cozy-200 text-sm font-medium mb-2">
                Google Maps API Key
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKeyState(e.target.value);
                    setValidationError(null);
                  }}
                  onPaste={handlePaste}
                  placeholder="AIzaSy..."
                  className={`w-full px-4 py-3.5 rounded-xl bg-white/5 border transition-all duration-200
                    text-white placeholder:text-cozy-500
                    ${validationError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-cozy-400'}
                    focus:outline-none focus:ring-2 focus:ring-cozy-400/30`}
                  disabled={isValidating}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cozy-400 hover:text-white transition-colors"
                  aria-label={showKey ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {validationError && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L10.586 10l-3.293 3.293a1 1 0 101.414 1.414L12 11.414l3.293 3.293a1 1 0 001.414-1.414L13.414 10l3.293-3.293a1 1 0 00-1.414-1.414L12 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  {validationError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isValidating || !apiKey.trim()}
              className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-all duration-200
                flex items-center justify-center gap-2
                ${isValidating || !apiKey.trim()
                  ? 'bg-white/5 text-cozy-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white hover:from-cozy-600 hover:to-terracotta-600 shadow-lg shadow-cozy-500/25'}`}
            >
              {isValidating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Continuar al login
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-cozy-500">
            Tu clave se guarda localmente en el navegador (localStorage).
            <br />Nunca se envía a servidores externos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default APIKeySetup;