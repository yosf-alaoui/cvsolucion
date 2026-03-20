import type { ReactNode } from "react";
import { useEffect } from "react";

type LegalModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

/**
 * Lightweight modal (no dependency) for Privacy Policy / Terms.
 * - Closes on backdrop click
 * - Closes on Escape
 * - Prevents background scroll when open
 */
export default function LegalModal({ open, title, children, onClose }: LegalModalProps) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white text-foreground shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 p-5 border-b border-border">
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto p-5">
          <div className="prose prose-sm max-w-none prose-headings:text-primary prose-a:text-primary prose-p:text-foreground prose-li:text-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
