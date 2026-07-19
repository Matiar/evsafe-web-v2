"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { proxyOdooImageUrl } from "@/lib/odoo/image-proxy";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function ImageGallery({
  images,
  initialIndex = 0,
  open,
  onClose,
}: ImageGalleryProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const touchStart = useRef<{ x: number; y: number; dist: number } | null>(null);

  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setScale(1);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, images.length - 1));
    setScale(1);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
    setScale(1);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
      const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
      touchStart.current = { x: 0, y: 0, dist: Math.hypot(dx, dy) };
    } else if (e.touches.length === 1) {
      touchStart.current = {
        x: e.touches[0]!.clientX,
        y: e.touches[0]!.clientY,
        dist: 0,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStart.current?.dist) {
      const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
      const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / touchStart.current.dist;
      setScale((s) => Math.min(Math.max(s * ratio, 1), 4));
      touchStart.current.dist = dist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current && e.changedTouches.length === 1 && scale === 1) {
      const dx = e.changedTouches[0]!.clientX - touchStart.current.x;
      if (Math.abs(dx) > 50) {
        if (dx < 0) goNext();
        else goPrev();
      }
    }
    touchStart.current = null;
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/95"
      role="dialog"
      aria-label="Image gallery"
    >
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="rounded-full px-3 py-1 text-2xl hover:bg-white/10"
          aria-label="Close gallery"
        >
          &times;
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {index > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full bg-black/50 px-3 py-6 text-white hover:bg-black/70"
            aria-label="Previous image"
          >
            &#8249;
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proxyOdooImageUrl(images[index]!)}
          alt=""
          className="max-h-full max-w-full object-contain transition-transform duration-100"
          style={{ transform: `scale(${scale})` }}
          draggable={false}
        />

        {index < images.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 z-10 rounded-full bg-black/50 px-3 py-6 text-white hover:bg-black/70"
            aria-label="Next image"
          >
            &#8250;
          </button>
        )}
      </div>
    </div>
  );
}

interface ImageCollageProps {
  imageUrls: string[];
  onImageClick: (index: number) => void;
}

export function ImageCollage({ imageUrls, onImageClick }: ImageCollageProps) {
  const count = imageUrls.length;
  const display = imageUrls.slice(0, 4);
  const extra = count - 4;

  if (count === 1) {
    return (
      <button
        onClick={() => onImageClick(0)}
        className="mb-3 block w-full overflow-hidden rounded-lg"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proxyOdooImageUrl(display[0]!)}
          alt=""
          className="w-full object-cover"
        />
      </button>
    );
  }

  if (count === 2) {
    return (
      <div className="mb-3 grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
        {display.map((url, i) => (
          <button key={i} onClick={() => onImageClick(i)} className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proxyOdooImageUrl(url)}
              alt=""
              className="h-48 w-full object-cover"
            />
          </button>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="mb-3 grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
        <button onClick={() => onImageClick(0)} className="row-span-2 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxyOdooImageUrl(display[0]!)}
            alt=""
            className="h-full min-h-[200px] w-full object-cover"
          />
        </button>
        {display.slice(1).map((url, i) => (
          <button key={i} onClick={() => onImageClick(i + 1)} className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proxyOdooImageUrl(url)}
              alt=""
              className="h-24 w-full object-cover"
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-3 grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
      {display.map((url, i) => (
        <button
          key={i}
          onClick={() => onImageClick(i)}
          className={cn("relative overflow-hidden", i >= 2 && "h-32")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxyOdooImageUrl(url)}
            alt=""
            className="h-32 w-full object-cover"
          />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-bold text-white">
              +{extra}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
