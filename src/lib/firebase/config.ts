import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  type RemoteConfig,
} from "firebase/remote-config";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function createFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  if (!isFirebaseConfigured()) {
    // Placeholder config for build/development without env vars
    return initializeApp({
      apiKey: "placeholder",
      authDomain: "placeholder.firebaseapp.com",
      projectId: "placeholder",
    });
  }
  return initializeApp(firebaseConfig);
}

export const firebaseApp = createFirebaseApp();
export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

let analyticsInstance: Analytics | null = null;
let remoteConfigInstance: RemoteConfig | null = null;

export async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  const supported = await isSupported();
  if (supported) {
    analyticsInstance = getAnalytics(firebaseApp);
  }
  return analyticsInstance;
}

export function getRemoteConfigInstance(): RemoteConfig {
  if (!remoteConfigInstance) {
    remoteConfigInstance = getRemoteConfig(firebaseApp);
    remoteConfigInstance.settings = {
      fetchTimeoutMillis: 8000,
      minimumFetchIntervalMillis: 24 * 60 * 60 * 1000,
    };
  }
  return remoteConfigInstance;
}

export async function fetchRemoteConfig(): Promise<void> {
  const rc = getRemoteConfigInstance();
  await fetchAndActivate(rc);
}

export function getRemoteConfigValue(key: string): string {
  const rc = getRemoteConfigInstance();
  return getValue(rc, key).asString();
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}
