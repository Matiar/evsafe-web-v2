"use client";

import { useState } from "react";
import Image from "next/image";
import { formatRelativeTime } from "@/lib/timeago";
import { avoidFalse, cn } from "@/lib/utils";
import { ImageCollage, ImageGallery } from "@/components/feed/image-gallery";
import type { SocialPost } from "@/types";

interface SocialPostCardProps {
  post: SocialPost;
  searchTerm?: string;
  onFavourite: () => void;
  onLike: () => void;
  postId?: string;
}

function highlightText(text: string, term: string): React.ReactNode {
  if (!term.trim()) return text;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-transparent font-semibold text-orange-500">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function linkifyText(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-feed-link underline"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

export function SocialPostCard({
  post,
  searchTerm = "",
  onFavourite,
  onLike,
  postId,
}: SocialPostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const message = avoidFalse(post.message ?? post.display_message);
  const showTruncate = message.length > 100 && !expanded;
  const displayMessage = showTruncate ? message.slice(0, 100) : message;

  const handleShare = async () => {
    const shareData = { text: message };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(message);
    }
  };

  return (
    <article
      id={postId ?? `post-${post.id}`}
      className="rounded-xl bg-white p-4 shadow-sm scroll-mt-20"
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <Image
          src={post.logo || "/brand/logo-short.svg"}
          alt=""
          width={50}
          height={50}
          className="h-12 w-12 rounded-full bg-background object-cover"
          unoptimized
        />
        <div className="flex-1">
          <div className="flex items-center gap-1 font-[family-name:var(--font-roboto)]">
            <span className="text-base font-medium text-brand">
              {post.author_name ?? "eVehicleSafe"}
            </span>
            <span className="text-feed-muted">&#8226; following</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-feed-muted">
            <Image src="/icons/clock.svg" alt="" width={14} height={14} />
            {post.create_date ? formatRelativeTime(post.create_date) : "now"}
          </div>
        </div>
      </div>

      {/* Message */}
      {message !== "--" && (
        <p className="mb-3 text-sm text-feed-body">
          {linkifyText(displayMessage)}
          {showTruncate && (
            <button
              onClick={() => setExpanded(true)}
              className="font-medium text-brand"
            >
              {" "}... see more
            </button>
          )}
          {searchTerm && expanded && (
            <span>{highlightText(message.slice(100), searchTerm)}</span>
          )}
        </p>
      )}

      {/* Media */}
      {post.youtube_video_id && (
        <div
          className={cn(
            "mb-3 overflow-hidden rounded-lg",
            post.is_portrait ? "aspect-[9/16] max-h-[500px]" : "aspect-video"
          )}
        >
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${post.youtube_video_id}`}
            className="h-full w-full"
            allowFullScreen
            title="YouTube video"
          />
        </div>
      )}

      {!post.youtube_video_id && post.image_urls && post.image_urls.length > 0 && (
        <>
          <ImageCollage
            imageUrls={post.image_urls}
            onImageClick={(i) => {
              setGalleryIndex(i);
              setGalleryOpen(true);
            }}
          />
          <ImageGallery
            images={post.image_urls}
            initialIndex={galleryIndex}
            open={galleryOpen}
            onClose={() => setGalleryOpen(false)}
          />
        </>
      )}

      {/* Like count */}
      {(post.like ?? 0) > 0 && (
        <div className="mb-2 flex items-center gap-1 text-sm text-feed-muted">
          <Image src="/icons/like-filled.svg" alt="" width={16} height={16} />
          {post.like}
        </div>
      )}

      <hr className="mb-2 border-[#EBF2FA]" />

      {/* Actions */}
      <div className="flex items-center justify-around">
        <button
          onClick={onFavourite}
          className="flex items-center gap-1.5 text-sm text-feed-muted"
        >
          <Image
            src={post.favourite ? "/icons/favorite-active.svg" : "/icons/favorite.svg"}
            alt=""
            width={20}
            height={20}
            className={post.favourite ? "" : "opacity-60"}
          />
          <span className={post.favourite ? "font-semibold" : ""}>Favorite</span>
        </button>
        <button
          onClick={onLike}
          className="flex items-center gap-1.5 text-sm"
        >
          <Image
            src={post.has_like ? "/icons/like-filled.svg" : "/icons/like.svg"}
            alt=""
            width={20}
            height={20}
          />
          <span className={cn("text-feed-muted", post.has_like && "font-semibold text-brand")}>
            Like
          </span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm text-feed-muted"
        >
          <Image src="/icons/share.svg" alt="" width={20} height={20} />
          Share
        </button>
      </div>
    </article>
  );
}
