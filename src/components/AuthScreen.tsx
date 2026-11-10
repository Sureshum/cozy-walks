// Pantalla de Login/Registro con fondo ASCII reactivo

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AsciiBackground from './AsciiBackground';

type AuthMode = 'login' | 'register';

const AuthScreen: React.FC = () => {
  const { login, register, clearError, isLoading, error, isUsingFirebase } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    clearError();
  }, [clearError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        return;
      }
      if (formData.password.length < 6) {
        return;
      }
      await register(formData.username, formData.email, formData.password);
    } else {
      await login(formData.email, formData.password);
    }
  }, [mode, formData, login, register]);

  const switchMode = useCallback(() => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    clearError();
  }, [clearError]);

  const passwordMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const passwordValid = formData.password.length >= 6;

  // Función para renderizar el contenido del botón
  const renderButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {mode === 'login' ? 'Entrando...' : 'Creando cuenta...'}
        </>
      );
    }

    if (mode === 'login') {
      return (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Iniciar sesión
        </>
      );
    }

    return (
      <>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Registrarse
      </>
    );
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      <AsciiBackground />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Card principal con glassmorphism */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cozy-500 to-terracotta-500 flex items-center justify-center text-3xl shadow-lg animate-bounce-gentle">
              🌿
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
            </h1>
            <p className="text-cozy-300">
              {mode === 'login' 
                ? 'Inicia sesión para continuar tus paseos' 
                : 'Únete a la comunidad de caminantes cozy'}
            </p>
          </div>

          {/* Error global */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2 animate-slide-up">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L10.586 10l-3.293 3.293a1 1 0 101.414 1.414L12 11.414l3.293 3.293a1 1 0 001.414-1.414L13.414 10l3.293-3.293a1 1 0 001.414-1.414L12 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username (solo registro) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="username" className="block text-cozy-200 text-sm font-medium mb-1.5">
                  Nombre de usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Tu nombre cozy"
                  autoComplete="username"
                  required={mode === 'register'}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-cozy-500 focus:outline-none focus:ring-2 focus:ring-cozy-400/30 focus:border-cozy-400 transition-all duration-200 disabled:opacity-50"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-cozy-200 text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                autoComplete="email"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-cozy-500 focus:outline-none focus:ring-2 focus:ring-cozy-400/30 focus:border-cozy-400 transition-all duration-200 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-cozy-200 text-sm font-medium mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-cozy-500 focus:outline-none focus:ring-2 focus:ring-cozy-400/30 focus:border-cozy-400 transition-all duration-200 disabled:opacity-50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cozy-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {!passwordValid && formData.password.length > 0 && (
                <p className="mt-1 text-xs text-cozy-400">Mínimo 6 caracteres</p>
              )}
            </div>

            {/* Confirm Password (solo registro) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-cozy-200 text-sm font-medium mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border transition-all duration-200 text-white placeholder:text-cozy-500 focus:outline-none focus:ring-2 focus:ring-cozy-400/30 disabled:opacity-50
                    ${formData.confirmPassword.length > 0 ? (passwordMatch ? 'border-sage-500/50 focus:border-sage-500' : 'border-red-500/50 focus:border-red-500') : 'border-white/10 focus:border-cozy-400'}`}
                />
                {formData.confirmPassword.length > 0 && (
                  <p className="mt-1 text-xs flex items-center gap-1">
                    {passwordMatch ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-sage-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        <span className="text-sage-400">Las contraseñas coinciden</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10.586 10l-3.293 3.293a1 1 0 101.414 1.414L12 11.414l3.293 3.293a1 1 0 001.414-1.414L13.414 10l3.293-3.293a1 1 0 001.414-1.414L12 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        <span className="text-red-400">No coinciden</span>
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Botón principal */}
            <button
              type="submit"
              disabled={isLoading || (mode === 'register' && (!passwordMatch || !passwordValid))}
              className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-all duration-200
                flex items-center justify-center gap-2
                ${isLoading || (mode === 'register' && (!passwordMatch || !passwordValid))
                  ? 'bg-white/5 text-cozy-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cozy-500 to-terracotta-500 text-white hover:from-cozy-600 hover:to-terracotta-600 shadow-lg shadow-cozy-500/25'}`}
            >
              {renderButtonContent()}
            </button>
          </form>

          {/* Cambiar modo */}
          <p className="mt-6 text-center text-cozy-400 text-sm">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'} {' '}
            <button
              onClick={switchMode}
              disabled={isLoading}
              className="text-cozy-300 hover:text-white font-semibold underline underline-offset-2 transition-colors"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-center text-xs text-cozy-500">
              {isUsingFirebase
                ? <>Tus paseos se guardan en la nube para el ranking global ☁️</>
                : <>Tus datos se guardan localmente en tu navegador.<br />Nunca salen de tu dispositivo 🌿</>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;