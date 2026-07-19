import { useAppStore } from "@/stores/app-store";
import type { useRouter } from "next/navigation";

export interface PushPayload {
  title?: string;
  body?: string;
  event?: string;
  stream_post_id?: string;
  live_post_id?: string;
  post_id?: string;
  target_url?: string;
}

function resolvePostId(data: PushPayload): string | null {
  if (data.event === "social.stream.post.notify" && data.stream_post_id) {
    return data.stream_post_id;
  }
  if (data.event === "social.post.published") {
    return data.live_post_id ?? data.post_id ?? null;
  }
  return data.stream_post_id ?? data.live_post_id ?? data.post_id ?? null;
}

export function handleNotificationNavigation(
  data: PushPayload,
  router: ReturnType<typeof useRouter>
): void {
  const postId = resolvePostId(data);

  if (postId) {
    useAppStore.getState().setActiveTab("home");
    useAppStore.getState().setScrollToPostId(postId);
    router.push(`/app?tab=home&post=${postId}`);
    return;
  }

  if (
    data.event === "social.stream.post.notify" ||
    data.event === "social.post.published"
  ) {
    useAppStore.getState().setActiveTab("home");
    router.push("/app?tab=home");
    return;
  }

  if (data.target_url) {
    window.open(data.target_url, "_blank");
  }
}

export function scrollToPost(postId: string, maxRetries = 5): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;

    const tryScroll = () => {
      const el = document.getElementById(`post-${postId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        resolve(true);
        return;
      }
      attempts++;
      if (attempts >= maxRetries) {
        resolve(false);
        return;
      }
      setTimeout(tryScroll, 500);
    };

    tryScroll();
  });
}

export async function handleDeepLinkPost(postId: string): Promise<void> {
  useAppStore.getState().setActiveTab("home");
  useAppStore.getState().setScrollToPostId(postId);
  const found = await scrollToPost(postId);
  if (!found) {
    const { Snack } = await import("@/stores/toast-store");
    Snack.error("Post not found");
  }
  useAppStore.getState().setScrollToPostId(null);
}
