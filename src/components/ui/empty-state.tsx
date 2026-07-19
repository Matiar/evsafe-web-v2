"use client";

import { PageContainer } from "@/components/ui/page-container";

interface EmptyStateProps {
  imageSrc?: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({
  imageSrc = "/icons/no-result.png",
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <PageContainer className="flex flex-col items-center justify-center py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="" className="mb-6 h-32 w-32 object-contain opacity-80" />
      <p className="mb-4 max-w-xs text-feed-body">{message}</p>
      <button
        onClick={onAction}
        className="font-semibold text-brand underline"
      >
        {actionLabel}
      </button>
    </PageContainer>
  );
}
