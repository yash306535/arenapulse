/** Accessible modal dialog: focus trap, Escape to close, and focus restoration. */
"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { Button } from "./button";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/** A centered modal overlay. Renders nothing when `open` is false. */
export function Dialog({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly closeLabel: string;
  readonly children: ReactNode;
}): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || panelRef.current === null) {
        return;
      }
      const focusables = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = focusables[0];
      const last = focusables.at(-1);
      if (first === undefined || last === undefined) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label={closeLabel}>
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
