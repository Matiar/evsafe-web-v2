"use client";

import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-background" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-background" />
          <div className="h-2 w-1/4 rounded bg-background" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-background" />
        <div className="h-3 w-4/5 rounded bg-background" />
      </div>
      <div className="mt-4 h-40 rounded-lg bg-background" />
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
