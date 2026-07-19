"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { getSocialStreamPosts } from "@/lib/odoo/client";
import {
  getUserFavouritePostIds,
  getPostLikesMap,
  toggleFavouritePost,
  togglePostLike,
} from "@/lib/firebase/firestore";
import { Snack } from "@/stores/toast-store";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SocialPostCard } from "@/components/feed/social-post-card";
import { useAppStore } from "@/stores/app-store";
import type { SocialPost } from "@/types";

export function FavoriteTab() {
  const user = useAuthStore((s) => s.user);
  const odooReady = useAuthStore((s) => s.odooReady);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavourites = useCallback(async () => {
    if (!user || !odooReady) return;
    setLoading(true);
    try {
      const [streamPosts, favIds, likesMap] = await Promise.all([
        getSocialStreamPosts(),
        getUserFavouritePostIds(user.uid),
        getPostLikesMap(),
      ]);

      const enriched = streamPosts
        .filter((post) => favIds.has(String(post.id)))
        .map((post) => {
          const id = String(post.id);
          const likes = likesMap[id]?.likes ?? [];
          return {
            ...post,
            favourite: true,
            like: likes.length,
            has_like: likes.includes(user.uid),
          };
        });

      setPosts(enriched);
    } catch (err) {
      console.error("Failed to load favourites:", err);
    } finally {
      setLoading(false);
    }
  }, [user, odooReady]);

  useEffect(() => {
    loadFavourites();
  }, [loadFavourites]);

  const handleFavourite = async (post: SocialPost) => {
    if (!user) return;
    const added = await toggleFavouritePost(user.uid, post.id);
    Snack.ok(added ? " Added to favourites" : " Removed from favourites");
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  };

  const handleLike = async (post: SocialPost) => {
    if (!user) return;
    const count = await togglePostLike(post.id, user.uid);
    const hasLike = !post.has_like;
    Snack.ok(hasLike ? "Added to liked post" : "Removed from liked post");
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, like: count, has_like: hasLike } : p
      )
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <SkeletonList />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        imageSrc="/icons/no-fav.svg"
        message="No Favourite Posts found, Please"
        actionLabel="Add one"
        onAction={() => setActiveTab("home")}
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      {posts.map((post) => (
        <SocialPostCard
          key={post.id}
          post={post}
          onFavourite={() => handleFavourite(post)}
          onLike={() => handleLike(post)}
        />
      ))}
    </div>
  );
}
