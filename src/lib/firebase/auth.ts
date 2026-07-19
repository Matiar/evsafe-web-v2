"use client";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  deleteUser,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, fetchRemoteConfig, getRemoteConfigValue, isFirebaseConfigured } from "@/lib/firebase/config";
import { upsertUserOnLogin, subscribeToUser } from "@/lib/firebase/firestore";
import { authenticateOdoo, initOdooFromRemoteConfig } from "@/lib/odoo/client";
import { useAuthStore } from "@/stores/auth-store";

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

export async function initAuthServices(): Promise<void> {
  if (!isFirebaseConfigured()) {
    useAuthStore.getState().setLoading(false);
    return;
  }

  try {
    // Remote Config still fetched for parity; Odoo credentials stay server-side.
    try {
      await fetchRemoteConfig();
      initOdooFromRemoteConfig({
        baseUrl: getRemoteConfigValue("baseUrl"),
        db: getRemoteConfigValue("db"),
        user_id: getRemoteConfigValue("user_id"),
        id: getRemoteConfigValue("id"),
        password: getRemoteConfigValue("password"),
      });
    } catch (err) {
      console.warn("Remote Config fetch skipped:", err);
    }

    // Warm Odoo session via same-origin proxy (avoids browser CORS).
    await authenticateOdoo();
    useAuthStore.getState().setOdooReady(true);
  } catch (err) {
    console.error("Failed to init Odoo:", err);
    // Allow app to continue — feed/products will retry on demand.
    useAuthStore.getState().setOdooReady(true);
  }
}

export function subscribeAuthState(
  onUser: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, onUser);
}

export async function handleLogin(user: User): Promise<void> {
  await upsertUserOnLogin(user);
  useAuthStore.getState().setUser(user);
}

export async function signInEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await handleLogin(cred.user);
  return cred.user;
}

export async function signUpEmail(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await handleLogin(cred.user);
  return cred.user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function signInGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  await handleLogin(cred.user);
  return cred.user;
}

export async function signInApple(): Promise<User> {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  const cred = await signInWithPopup(auth, provider);
  if (cred.user.displayName) {
    await updateProfile(cred.user, { displayName: cred.user.displayName });
  }
  await handleLogin(cred.user);
  return cred.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
  useAuthStore.getState().setUser(null);
  useAuthStore.getState().setFirestoreUser(null);
}

export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user");
  await deleteUser(user);
  useAuthStore.getState().setUser(null);
  useAuthStore.getState().setFirestoreUser(null);
}

export function subscribeFirestoreUser(uid: string): () => void {
  return subscribeToUser(uid, (user) => {
    useAuthStore.getState().setFirestoreUser(user);
  });
}

export function isAppleSignInAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod|Macintosh/.test(ua) && /Safari/.test(ua);
}
