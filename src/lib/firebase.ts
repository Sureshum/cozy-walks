// Configuración de Firebase - Cozy Walks Global
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un proyecto nuevo
// 3. Habilita Authentication (Email/Password)
// 4. Habilita Firestore Database
// 5. Copia la configuración y ponla en .env

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validar configuración
const isConfigured = firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'tu-api-key-aqui' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'tu-project-id';

// Inicializar Firebase solo si está configurado
let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // En desarrollo, opcionalmente conectar a emuladores
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    
    console.log('✅ Firebase inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
  }
} else {
  console.warn('[!] Firebase no configurado. Usa variables de entorno VITE_FIREBASE_*');
  console.log('Variables necesarias:');
  console.log('  VITE_FIREBASE_API_KEY');
  console.log('  VITE_FIREBASE_AUTH_DOMAIN');
  console.log('  VITE_FIREBASE_PROJECT_ID');
  console.log('  VITE_FIREBASE_STORAGE_BUCKET');
  console.log('  VITE_FIREBASE_MESSAGING_SENDER_ID');
  console.log('  VITE_FIREBASE_APP_ID');
}

export { app, auth, db, isConfigured };
export type { FirebaseApp } from 'firebase/app';
export type { Auth } from 'firebase/auth';
export type { Firestore } from 'firebase/firestore';