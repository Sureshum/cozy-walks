import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Obtener API Key de variable de entorno
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'TU_API_KEY_AQUI';

if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'TU_API_KEY_AQUI') {
  console.warn(
    '⚠️ Google Maps API Key no configurada. Crea un archivo .env con VITE_GOOGLE_MAPS_API_KEY=tu_key'
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App apiKey={GOOGLE_MAPS_API_KEY} />
  </StrictMode>,
)