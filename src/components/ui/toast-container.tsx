"use client";

import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "w-full max-w-md rounded-lg px-4 py-3 shadow-lg",
            toast.type === "success" && "bg-white text-text",
            toast.type === "warn" && "bg-amber-100 text-amber-900",
            toast.type === "error" && "bg-white text-serial-red",
            toast.type === "neutral" && "bg-white text-text"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{toast.title}</p>
              <p className="text-sm">{toast.content}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-sm underline"
            >
              {toast.type === "error" ? "Close" : "?"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
