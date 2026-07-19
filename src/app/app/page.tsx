"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/providers/auth-provider";
import { AppShell } from "@/components/shell/app-shell";
import { useAppStore } from "@/stores/app-store";
import type { AppTab } from "@/lib/constants";

function AppContent() {
  const searchParams = useSearchParams();
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setScrollToPostId = useAppStore((s) => s.setScrollToPostId);
  const postId = searchParams.get("post");

  useEffect(() => {
    const tab = searchParams.get("tab") as AppTab | null;
    if (tab && ["home", "product", "favorite", "account"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, setActiveTab]);

  useEffect(() => {
    if (postId) {
      setActiveTab("home");
      setScrollToPostId(postId);
    }
  }, [postId, setActiveTab, setScrollToPostId]);

  return <AppShell deepLinkPostId={postId} />;
}

export default function AppPage() {
  return (
    <AuthGuard requireAuth>
      <Suspense fallback={null}>
        <AppContent />
      </Suspense>
    </AuthGuard>
  );
}
