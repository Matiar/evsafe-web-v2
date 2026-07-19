import { create } from "zustand";
import type { User } from "firebase/auth";
import type { FirestoreUser } from "@/types";
import type { UserRole } from "@/lib/constants";

interface AuthStore {
  user: User | null;
  firestoreUser: FirestoreUser | null;
  loading: boolean;
  odooReady: boolean;
  messageCount: string;
  setUser: (user: User | null) => void;
  setFirestoreUser: (user: FirestoreUser | null) => void;
  setLoading: (loading: boolean) => void;
  setOdooReady: (ready: boolean) => void;
  setMessageCount: (count: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  firestoreUser: null,
  loading: true,
  odooReady: false,
  messageCount: "0",
  setUser: (user) => set({ user }),
  setFirestoreUser: (firestoreUser) => set({ firestoreUser }),
  setLoading: (loading) => set({ loading }),
  setOdooReady: (odooReady) => set({ odooReady }),
  setMessageCount: (messageCount) => set({ messageCount }),
}));

export function useCurrentRole(): UserRole {
  const firestoreUser = useAuthStore((s) => s.firestoreUser);
  return firestoreUser?.role ?? "common";
}

export function useIsAdministrator(): boolean {
  return useCurrentRole() === "administrator";
}

export function useIsDisabled(): boolean {
  const firestoreUser = useAuthStore((s) => s.firestoreUser);
  return firestoreUser?.disabled === true;
}
