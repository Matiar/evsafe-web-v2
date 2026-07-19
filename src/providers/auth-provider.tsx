"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  initAuthServices,
  subscribeAuthState,
  subscribeFirestoreUser,
} from "@/lib/firebase/auth";
import { useAuthStore } from "@/stores/auth-store";
import { LoaderView } from "@/components/ui/loader-view";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    let unsubFirestore: (() => void) | undefined;

    initAuthServices();

    const unsubAuth = subscribeAuthState((user) => {
      setUser(user);
      unsubFirestore?.();
      if (user) {
        unsubFirestore = subscribeFirestoreUser(user.uid);
      } else {
        useAuthStore.getState().setFirestoreUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubFirestore?.();
    };
  }, [setUser, setLoading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderView />
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthGuard({
  children,
  requireAuth = true,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firestoreUser = useAuthStore((s) => s.firestoreUser);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.replace(`/login?redirect=${returnUrl}`);
      return;
    }

    if (!requireAuth && user) {
      router.replace("/app");
    }
  }, [user, loading, requireAuth, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderView />
      </div>
    );
  }

  if (requireAuth && !user) return null;
  if (!requireAuth && user) return null;

  if (requireAuth && firestoreUser?.disabled) {
    return <DisabledScreen />;
  }

  return <>{children}</>;
}

function DisabledScreen() {
  const logOut = async () => {
    const { logOut: logoutFn } = await import("@/lib/firebase/auth");
    await logoutFn();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="mb-4 text-xl font-semibold">Account Disabled</h1>
      <p className="mb-8 max-w-sm text-feed-body">
        Your account has been disabled. Please contact support if you believe this is an error.
      </p>
      <button
        onClick={logOut}
        className="rounded-full bg-brand px-8 py-3 font-semibold text-white"
      >
        Log Out
      </button>
    </div>
  );
}
