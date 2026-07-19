import { create } from "zustand";
import type { ToastMessage } from "@/types";

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    const entry: ToastMessage = { ...toast, id };
    set((s) => ({ toasts: [...s.toasts, entry] }));

    const duration =
      toast.duration ??
      (toast.type === "error" && !toast.autoDismiss ? 300000 : toast.type === "success" ? 2000 : 4000);

    if (toast.autoDismiss !== false && toast.type !== "error") {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const Snack = {
  ok: (content: string, title = "Success") =>
    useToastStore.getState().addToast({ type: "success", title, content }),
  warn: (content: string, title = "Warn!") =>
    useToastStore.getState().addToast({ type: "warn", title, content }),
  error: (content: string, title = "Error!", autoDismiss = false) =>
    useToastStore.getState().addToast({
      type: "error",
      title,
      content,
      autoDismiss,
      duration: autoDismiss ? 4000 : 300000,
    }),
};
