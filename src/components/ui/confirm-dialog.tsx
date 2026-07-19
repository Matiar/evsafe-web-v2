"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  hideCancel = false,
  onConfirm,
  onCancel,
  destructive,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <p className="mb-6 text-sm text-feed-body">{message}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className={`rounded-full py-3 font-semibold ${
              destructive
                ? "bg-serial-red text-white"
                : "bg-brand text-white"
            }`}
          >
            {confirmLabel}
          </button>
          {!hideCancel && (
            <button
              onClick={onCancel}
              className="rounded-full py-3 font-medium text-brand"
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
