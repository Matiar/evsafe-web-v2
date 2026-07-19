"use client";

import { useEffect } from "react";
import Image from "next/image";

export function NotificationBanner({
  title,
  body,
  onTap,
  onDismiss,
}: {
  title: string;
  body: string;
  onTap: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <button
      onClick={onTap}
      className="fixed left-4 right-4 top-4 z-[150] flex items-center gap-3 rounded-xl bg-white p-4 shadow-lg md:left-auto md:right-6 md:max-w-sm"
    >
      <Image src="/icons/notifications.svg" alt="" width={24} height={24} />
      <div className="flex-1 text-left">
        <p className="font-semibold text-text">{title}</p>
        <p className="text-sm text-feed-body">{body}</p>
      </div>
      <span className="text-feed-muted">&#8250;</span>
    </button>
  );
}
