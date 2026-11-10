# Configurar Firebase (base de datos global)

Cozy Walks funciona **sin Firebase** usando `localStorage` (datos por dispositivo).
Para tener **ranking y estadísticas globales** entre todos los usuarios hay que conectar un proyecto de Firebase.

## 1. Crear el proyecto

1. Entra en <https://console.firebase.google.com/> y crea un proyecto.
2. En **Build → Authentication → Sign-in method**, activa **Email/Password**.
3. En **Build → Firestore Database**, crea la base de datos (modo producción).
4. En **Project settings → General → Your apps**, añade una app **Web** (`</>`) y copia su configuración.

## 2. Variables de entorno en local

Copia `.env.example` a `.env` y rellena:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> `.env` está en `.gitignore`: nunca se sube al repositorio.

## 3. Secrets en GitHub (para la web publicada)

En el repositorio: **Settings → Secrets and variables → Actions → New repository secret**.
Crea un secret por cada variable con el **mismo nombre**:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

El workflow `.github/workflows/deploy.yml` los inyecta en el build de GitHub Pages.
Si no existen, la app se publica igualmente y usa `localStorage`.

## 4. Publicar reglas e índices

Instala la CLI y entra en tu cuenta:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # selecciona tu proyecto
```

Despliega las reglas de seguridad y los índices incluidos en el repo:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

- `firestore.rules`: cada usuario solo escribe su perfil (`users/{uid}`) y sus paseos (`walks/{id}`); cualquier usuario autenticado puede leer perfiles para el ranking.
- `firestore.indexes.json`: índices compuestos para el ranking (`settings.shareStats` + `stats.totalKm`) y el historial de paseos (`userId` + `createdAt`).

## 5. Emuladores (opcional, desarrollo)

```bash
firebase emulators:start --only auth,firestore
```

Y en `.env`:

```env
VITE_USE_FIREBASE_EMULATORS=true
```

## Estructura de datos

```
users/{uid}
  uid, username, email, displayName, photoURL
  createdAt, lastLoginAt
  settings: { defaultDistance, units, theme, notifications, shareStats }
  stats:    { totalKm, totalWalks, totalTime, longestWalk, streakDays, lastWalkDate }

walks/{walkId}
  id, userId, username
  startTime, endTime, duration, createdAt
  targetDistance, actualDistance, completed
  route: [{ lat, lng }, ...]
```

## Comportamiento híbrido

- Si Firebase está configurado **y** hay sesión de Firebase → los paseos se guardan en Firestore.
- En cualquier otro caso → se guardan en `localStorage` (`cozy-walks-walks`, `cozy-walks-leaderboard`).
- El ranking muestra 🌍 cuando usa Firestore y 💾 cuando usa datos locales.
