import { useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  variant = "default",
  onConfirm,
  onCancel,
}: Props) {
  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const confirmBtnCls =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 text-white"
      : "bg-accent hover:bg-accent-hover text-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4
                   border border-zinc-200 dark:border-zinc-800"
      >
        <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        {message && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5 whitespace-pre-wrap">
            {message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium
                       bg-zinc-100 hover:bg-zinc-200
                       dark:bg-zinc-800 dark:hover:bg-zinc-700
                       text-zinc-700 dark:text-zinc-200"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className={`px-4 py-2 rounded-lg text-sm font-medium ${confirmBtnCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
