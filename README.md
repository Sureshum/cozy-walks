# Cozy Walks 🌿

Una aplicación de caminatas **PWA** con estética acogedora ("cozy"), construida con React, TypeScript, Tailwind CSS y Google Maps API.

## ✨ Características

- 🗺️ **Rutas circulares dinámicas** - Generadas con Google Maps Directions API
- 🎲 **Aleatoriedad diaria** - Mismo distancia = ruta diferente cada día (semilla determinística)
- 🛡️ **Zonas de exclusión** - Evita automáticamente áreas inseguras (polígonos personalizables)
- 👟 **Avatar en tiempo real** - Seguimiento GPS con `navigator.geolocation.watchPosition`
- 📱 **PWA completa** - Instalable, offline-ready, notificaciones push
- 🎨 **UI "Cozy"** - Paleta cálida, bordes redondeados, animaciones suaves, mobile-first
- ♿ **Accesible** - ARIA, focus visible, prefers-reduced-motion, safe areas

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Una **Google Maps JavaScript API Key** con estas APIs habilitadas:
  - Maps JavaScript API
  - Directions API
  - Places API (opcional, para autocompletado futuro)

### Instalación

```bash
# Clonar/entrar al proyecto
cd cozy-walks

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env y añade tu VITE_GOOGLE_MAPS_API_KEY

# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview
```

## 📁 Estructura del Proyecto

```
cozy-walks/
├── public/
│   ├── avatar-walker.svg      # Avatar personalizado (SVG)
│   ├── manifest.json          # PWA Manifest
│   ├── sw.js                  # Service Worker
│   └── icons/                 # Iconos PWA
├── src/
│   ├── components/            # Componentes React
│   │   ├── MapScreen.tsx      # Componente principal del mapa
│   │   ├── DistanceSlider.tsx # Slider flotante de distancia
│   │   ├── MapControls.tsx    # Controles (pausar, completar, etc.)
│   │   ├── AvatarMarker.tsx   # Marcador avatar personalizado
│   │   ├── RouteInfoPanel.tsx # Panel info ruta
│   │   ├── ExclusionZoneLegend.tsx # Leyenda zonas
│   │   └── CozyLoader.tsx     # Loader animado
│   ├── hooks/
│   │   ├── useGeolocation.ts  # GPS watchPosition + suavizado
│   │   └── useRouting.ts      # DirectionsService + lógica rutas
│   ├── utils/
│   │   ├── routeUtils.ts      # Geometría, Haversine, polígonos
│   │   └── constants.ts       # Config, distancias, zonas, mensajes
│   ├── types/
│   │   └── index.ts           # Types TypeScript
│   ├── context/
│   │   └── AppContext.tsx     # Estado global (Reducer)
│   ├── App.tsx                # App root + providers
│   ├── main.tsx               # Entry point
│   ├── index.css              # Tailwind + estilos base
│   └── App.css                # Estilos adicionales
├── index.html                 # HTML con PWA meta tags
├── tailwind.config.js         # Config Tailwind (tema cozy)
├── tsconfig.json              # Config TypeScript
├── vite.config.ts             # Config Vite + PWA
└── .env.example               # Variables de entorno ejemplo
```

## 🎯 Uso

1. **Abrir la app** - Se centra en tu ubicación (pide permiso GPS)
2. **Elegir distancia** - Desliza el slider flotante (2-10 km)
3. **Iniciar caminata** - Pulsa "Iniciar caminata de X km"
4. **¡A caminar!** - Tu avatar te sigue en tiempo real
5. **Pausar/Reanudar** - Controles flotantes durante la caminata
6. **Finalizar** - Ver resumen y celebrar 🎉

## 🛠️ Tecnologías

| Tecnología | Uso |
|------------|-----|
| React 18 + TypeScript | Framework base |
| Vite | Build tool & dev server |
| Tailwind CSS | Estilos utility-first + tema cozy |
| @react-google-maps/api | Wrapper oficial Google Maps |
| Google Maps Directions API | Cálculo de rutas |
| navigator.geolocation | GPS nativo del navegador |
| Service Worker + Workbox | PWA / Offline |
| Mulberry32 PRNG | Aleatoriedad determinística diaria |

## 🎨 Personalización

### Colores (tailwind.config.js)
```js
colors: {
  cozy: { 50: '#fdf8f3', 500: '#c8754a', 900: '#613228' },
  terracotta: { 500: '#ef6f22' },
  sage: { 500: '#5e8f5a' },
  warm: { 500: '#eca522' },
}
```

### Zonas de exclusión (src/utils/constants.ts)
```ts
export const EXCLUSION_ZONES = [
  {
    id: 'mi-zona',
    name: 'Zona Peligrosa',
    coordinates: [
      { lat: 40.123, lng: -3.456 },
      { lat: 40.123, lng: -3.450 },
      { lat: 40.118, lng: -3.450 },
      { lat: 40.118, lng: -3.456 },
    ],
    riskLevel: 'high',
    color: '#ef4444',
  },
];
```

### Distancias del slider
```ts
export const DISTANCE_OPTIONS = [
  { value: 2, label: '2 km', icon: '🌱' },
  { value: 5, label: '5 km', icon: '🌳' },
  // ...
];
```

## 📱 PWA Features

- **Instalable** - `beforeinstallprompt` + manifest.json
- **Offline-first** - Cache First (assets) / Network First (HTML)
- **Standalone mode** - Sin barra de navegador
- **Shortcuts** - Acceso rápido a 3km / 5km
- **Push notifications** - Preparado (requiere backend)
- **Background sync** - Para subir rutas offline

## ♿ Accesibilidad

- Semántica HTML5 + ARIA labels
- Focus visible en todos los interactivos
- `prefers-reduced-motion` respetado
- Safe-area insets (notch/Dynamic Island)
- Contraste AA en tema cozy
- Navegación por teclado completa

## 🔧 Scripts Disponibles

```bash
npm run dev        # Servidor desarrollo (HMR)
npm run build      # Build producción (dist/)
npm run preview    # Preview build local
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## 🗺️ Google Maps API Setup

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita APIs:
   - **Maps JavaScript API**
   - **Directions API**
   - **Places API** (opcional)
4. Crea credenciales → **API Key**
5. Restringe la key:
   - **HTTP referrers**: `localhost:5173/*`, `tudominio.com/*`
   - **APIs**: Maps JavaScript API, Directions API
6. Añade a `.env`: `VITE_GOOGLE_MAPS_API_KEY=tu_key`

## 📄 Licencia

MIT - Libre para uso personal y comercial.

---

Hecho con 💚 para caminantes soñadores.