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

Copia **todo** el contenido de `firestore.rules` (incluye ya las reglas de
administrador) y pulsa **Publicar**. El archivo es la única fuente de verdad:
si cambia, vuelve a copiarlo aquí.

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

## Administrar el ranking (borrar carreras)

El botón **Admin** aparece dentro del ranking solo para administradores. Desde ahí
puedes borrar las carreras de un caminante y sacarlo del ranking. La operación:

1. Borra todos los documentos de `walks` de ese usuario.
2. Pone sus estadísticas a cero y `settings.shareStats: false` en `users/{uid}`.

Para ser administrador hay dos caminos:

### Opción A (recomendada): documento `admins/{uid}`

1. Entra en la app con tu cuenta y abre la consola del navegador. Copia tu UID con:

   ```js
   // En la consola del navegador, con la app abierta y sesión iniciada
   await window.firebase?.auth?.().currentUser?.uid
   ```

   Si no está expuesto, míralo en **Authentication → Users** de Firebase.

2. En Firestore, crea la colección **`admins`** y un documento cuyo **ID sea tu UID**
   (el contenido da igual, por ejemplo `{ "note": "owner" }`).
3. Publica las reglas actualizadas de `firestore.rules` (paso 3 de arriba).

Con eso ya puedes entrar al ranking y ver el botón **Admin**.

### Opción B: variable `VITE_ADMIN_EMAILS`

En GitHub: **Settings → Secrets and variables → Actions → Variables** y crea
`VITE_ADMIN_EMAILS` con los correos separados por comas, por ejemplo
`yo@correo.com,otra@correo.com`. Requiere volver a desplegar (push a `main`).

> Esta variable solo controla **qué se ve en la interfaz**. Para que Firestore
> acepte los borrados, tu UID debe existir igualmente en `admins/{uid}` (Opción A),
> porque las reglas de seguridad no pueden leer variables de entorno.

Si al borrar ves un error de permisos, casi siempre es que falta publicar
`firestore.rules` o que no existe tu documento en `admins`.

