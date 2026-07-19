"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { getSocialStreamPosts } from "@/lib/odoo/client";
import {
  getUserFavouritePostIds,
  getPostLikesMap,
  toggleFavouritePost,
  togglePostLike,
} from "@/lib/firebase/firestore";
import { scrollToPost } from "@/lib/firebase/messaging";
import { Snack } from "@/stores/toast-store";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SocialPostCard } from "@/components/feed/social-post-card";
import type { SocialPost } from "@/types";

interface HomeTabProps {
  deepLinkPostId?: string | null;
}

export function HomeTab({ deepLinkPostId }: HomeTabProps) {
  const user = useAuthStore((s) => s.user);
  const odooReady = useAuthStore((s) => s.odooReady);
  const scrollToPostId = useAppStore((s) => s.scrollToPostId);
  const setScrollToPostId = useAppStore((s) => s.setScrollToPostId);
  const deepLinkHandled = useRef(false);

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filtered, setFiltered] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const targetPostId = deepLinkPostId ?? scrollToPostId;

  const loadPosts = useCallback(
    async (forceRefresh = false) => {
      if (!user || !odooReady) return;
      setLoading(true);
      try {
        const [streamPosts, favIds, likesMap] = await Promise.all([
          getSocialStreamPosts(forceRefresh),
          getUserFavouritePostIds(user.uid),
          getPostLikesMap(),
        ]);

        const enriched = streamPosts.map((post) => {
          const id = String(post.id);
          const likes = likesMap[id]?.likes ?? [];
          return {
            ...post,
            favourite: favIds.has(id),
            like: likes.length,
            has_like: likes.includes(user.uid),
          };
        });

        setPosts(enriched);
        setFiltered(enriched);
      } catch (err) {
        console.error("Failed to load feed:", err);
      } finally {
        setLoading(false);
      }
    },
    [user, odooReady]
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(posts);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      posts.filter(
        (p) =>
          (p.display_name ?? "").toLowerCase().includes(q) ||
          (p.message ?? "").toLowerCase().includes(q) ||
          (p.author_name ?? "").toLowerCase().includes(q)
      )
    );
  }, [search, posts]);

  // Deep-link scroll-to-post (notification or ?post= query)
  useEffect(() => {
    if (!targetPostId || loading || deepLinkHandled.current) return;

    const attemptScroll = async () => {
      const found = await scrollToPost(targetPostId, 8);
      if (found) {
        deepLinkHandled.current = true;
        setScrollToPostId(null);
      } else if (!loading && posts.length > 0) {
        deepLinkHandled.current = true;
        Snack.error("Post not found");
        setScrollToPostId(null);
      }
    };

    attemptScroll();
  }, [targetPostId, loading, posts.length, setScrollToPostId]);

  const handleFavourite = async (post: SocialPost) => {
    if (!user) return;
    const added = await toggleFavouritePost(user.uid, post.id);
    Snack.ok(added ? " Added to favourites" : " Removed from favourites");

    const update = (list: SocialPost[]) =>
      list.map((p) =>
        p.id === post.id ? { ...p, favourite: added } : p
      );
    setPosts(update);
    setFiltered(update);
  };

  const handleLike = async (post: SocialPost) => {
    if (!user) return;
    const count = await togglePostLike(post.id, user.uid);
    const hasLike = !post.has_like;
    Snack.ok(hasLike ? "Added to liked post" : "Removed from liked post");

    const update = (list: SocialPost[]) =>
      list.map((p) =>
        p.id === post.id ? { ...p, like: count, has_like: hasLike } : p
      );
    setPosts(update);
    setFiltered(update);
  };

  return (
    <div>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        {searchFocused ? (
          <button
            onClick={() => {
              setSearchFocused(false);
              setSearch("");
            }}
            className="shrink-0 text-brand"
            aria-label="Back"
          >
            &#8592;
          </button>
        ) : (
          <Image
            src="/brand/logo-short.svg"
            alt="eVehicleSafe"
            width={50}
            height={50}
            className="h-12 w-12 shrink-0 rounded-full"
          />
        )}
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            className="w-full rounded-full border border-search-border px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-serial-red"
              aria-label="Clear search"
            >
              &#10005;
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-4">
        {loading && <SkeletonList />}

        {!loading && filtered.length === 0 && search && (
          <EmptyState
            message="No match found"
            actionLabel="Back to home"
            onAction={() => {
              setSearch("");
              setSearchFocused(false);
            }}
          />
        )}

        {!loading && filtered.length === 0 && !search && (
          <EmptyState
            imageSrc="/icons/error.png"
            message="No post on server.Please"
            actionLabel="Refresh"
            onAction={() => loadPosts(true)}
          />
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => loadPosts(true)}
                className="text-sm text-brand underline"
              >
                Refresh
              </button>
            </div>
            {filtered.map((post) => (
              <SocialPostCard
                key={post.id}
                post={post}
                postId={`post-${post.id}`}
                searchTerm={search}
                onFavourite={() => handleFavourite(post)}
                onLike={() => handleLike(post)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
