"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { t } from "@/lib/strings";

/**
 * Modal panel constrained to the phone column.
 * - variant "sheet": slides up from the bottom (filters).
 * - variant "full": covers the whole column (expanded profile, match screen).
 * Escape closes it, focus moves inside on open and returns on close, page scroll is locked.
 */
export function Sheet({
  open,
  onClose,
  title,
  hideTitle = false,
  variant = "sheet",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  hideTitle?: boolean;
  variant?: "sheet" | "full";
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-center">
          <motion.div
            className="absolute inset-0 bg-navy/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <div className="pointer-events-none relative flex h-full w-full max-w-[430px] flex-col justify-end">
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className={`pointer-events-auto flex flex-col bg-bg outline-none ${
                variant === "full" ? "h-full" : "max-h-[88dvh] rounded-t-[24px]"
              }`}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div
                className={`flex min-h-14 items-center justify-between gap-2 px-4 ${
                  hideTitle ? "absolute inset-x-0 top-0 z-10 pt-2" : "border-b border-line/60 pt-1"
                }`}
              >
                <h2 id={titleId} className={hideTitle ? "sr-only" : "text-xl text-navy"}>
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.common.close}
                  className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-card text-navy shadow-soft"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
              {footer ? <div className="border-t border-line/60 bg-bg px-4 pb-safe pt-3">{footer}</div> : null}
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
