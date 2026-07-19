import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { FirestoreUser, UserProduct, UserRole } from "@/types";
import type { User } from "firebase/auth";

export async function getUserDoc(uid: string): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as FirestoreUser;
}

export async function upsertUserOnLogin(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  const data: FirestoreUser = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL,
    role: "common" as UserRole,
    metadata: {
      creationTime: user.metadata.creationTime ?? undefined,
      lastSignInTime: user.metadata.lastSignInTime ?? undefined,
    },
    providerData: user.providerData.map((p) => ({
      providerId: p.providerId,
      displayName: p.displayName,
      photoURL: p.photoURL,
      uid: p.uid,
    })),
  };

  await setDoc(ref, data);
}

export function subscribeToUser(
  uid: string,
  callback: (user: FirestoreUser | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ uid, ...snap.data() } as FirestoreUser);
  });
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<FirestoreUser, "displayName" | "phoneNumber" | "photoURL">>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}

export async function getAllUsers(): Promise<FirestoreUser[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as FirestoreUser);
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}

export async function updateUserDisabled(uid: string, disabled: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), { disabled });
}

export async function getUserProducts(uid: string): Promise<UserProduct[]> {
  const snap = await getDocs(collection(db, "users", uid, "products"));
  return snap.docs.map((d) => d.data() as UserProduct);
}

export async function saveUserProduct(uid: string, product: UserProduct): Promise<void> {
  const { product: _, ...data } = product as UserProduct & { product?: unknown };
  void _;
  await setDoc(doc(db, "users", uid, "products", product.serial), data);
}

export async function removeUserProduct(uid: string, serial: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "products", serial));
}

export async function getUserFavouritePostIds(uid: string): Promise<Set<string>> {
  const snap = await getDocs(collection(db, "users", uid, "posts"));
  return new Set(snap.docs.map((d) => d.id));
}

export async function toggleFavouritePost(
  uid: string,
  postId: string | number
): Promise<boolean> {
  const id = String(postId);
  const ref = doc(db, "users", uid, "posts", id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { post_id: id });
  return true;
}

export async function getPostLikesMap(): Promise<Record<string, { likes: string[] }>> {
  const snap = await getDocs(collection(db, "post_likes"));
  const map: Record<string, { likes: string[] }> = {};
  snap.docs.forEach((d) => {
    map[d.id] = d.data() as { likes: string[] };
  });
  return map;
}

export async function togglePostLike(
  postId: string | number,
  uid: string
): Promise<number> {
  const id = String(postId);
  const ref = doc(db, "post_likes", id);
  const snap = await getDoc(ref);
  let likes: string[] = [];

  if (snap.exists()) {
    likes = [...(snap.data().likes ?? [])];
    const idx = likes.indexOf(uid);
    if (idx >= 0) {
      likes.splice(idx, 1);
    } else {
      likes.push(uid);
    }
    await setDoc(ref, { likes });
  } else {
    likes = [uid];
    await setDoc(ref, { likes });
  }

  return likes.length;
}
