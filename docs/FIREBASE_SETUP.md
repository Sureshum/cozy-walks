# Configurar Firebase (base de datos global)

Cozy Walks funciona **sin Firebase** usando `localStorage` (datos por dispositivo).
Para tener **ranking y estadísticas globales** entre todos los usuarios hay que conectar un proyecto de Firebase.

Este repositorio ya está preparado para el proyecto **`cozy-walk`**:

- Los 6 secretos `VITE_FIREBASE_*` están creados en GitHub Actions.
- `.firebaserc` apunta al proyecto `cozy-walk`.
- El código usa Firestore si detecta la configuración y, si no, cae a `localStorage`.

## Pasos que hay que hacer una sola vez en la consola

### 1. Activar el acceso con email

<https://console.firebase.google.com/project/cozy-walk/authentication/providers>

- **Authentication → Sign-in method** → activa **Correo electrónico/Contraseña**.
- Si no lo activas, el registro falla con `auth/operation-not-allowed`.

### 2. Autorizar el dominio de GitHub Pages

<https://console.firebase.google.com/project/cozy-walk/authentication/settings>

- **Authentication → Settings → Dominios autorizados** → **Añadir dominio** → `sureshum.github.io`.
- Sin esto el login falla con `auth/unauthorized-domain`.

### 3. Publicar las reglas de seguridad

<https://console.firebase.google.com/project/cozy-walk/firestore/rules>

Copia el contenido de `firestore.rules` y pulsa **Publicar**:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read: if signedIn();
      allow create, update: if isOwner(uid);
      allow delete: if isOwner(uid);
    }

    match /walks/{walkId} {
      allow read: if signedIn() && resource.data.userId == request.auth.uid;
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if signedIn() && resource.data.userId == request.auth.uid;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Mientras no las publiques, Firestore rechaza todo y verás `Missing or insufficient permissions` en la consola del navegador.

> Alternativa por CLI: `npm install -g firebase-tools && firebase login && firebase deploy --only firestore:rules`

### 4. Índices (opcional)

Las consultas del ranking y del historial **no necesitan índices compuestos**: se filtran por un solo campo y se ordenan en el cliente.
`firestore.indexes.json` queda como referencia por si en el futuro quieres ordenar en el servidor:

```bash
firebase deploy --only firestore:indexes
```

## Variables de entorno en local

`.env` (ignorado por git) ya contiene la configuración. Para otro equipo:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Secrets en GitHub (para la web publicada)

**Settings → Secrets and variables → Actions** (en español: **Configuración → Seguridad → Secretos y variables → Acciones**).
Enlace directo: <https://github.com/Sureshum/cozy-walks/settings/secrets/actions>

Un secret por variable, con el mismo nombre:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

El workflow `.github/workflows/deploy.yml` los inyecta en el build de GitHub Pages.
Si no existen, la app se publica igualmente y usa `localStorage`.

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
