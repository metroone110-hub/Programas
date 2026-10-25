import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Explicitly pass firestoreDatabaseId if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const AUTH_DOMAIN = firebaseConfig.authDomain;

// The exact domains for developer and shared preview
export const DEV_DOMAIN = 'ais-dev-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app';
export const SHARED_DOMAIN = 'ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app';

export default app;
