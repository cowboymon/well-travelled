"use client";

export function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-sm border border-brass/40 bg-paper p-6 shadow-paper animate-fade-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 font-mono-data text-[0.6rem] uppercase tracking-[0.2em] text-ink-faded">
          {title}
        </p>
        <p className="mb-6 font-body text-sm text-ink">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-sm bg-oxblood px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-sm border border-brass/50 px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-ink transition-colors hover:bg-black/5"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
