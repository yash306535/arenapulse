/** Accessible tabs with a WAI-ARIA tablist, roving tabindex, and arrow-key nav. */
"use client";

import { useId, useRef, useState, type ReactNode } from "react";

import { cn } from "./cn";

/** One tab and its associated panel content. */
export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly content: ReactNode;
}

/** Renders a tablist and the active tab's panel. */
export function Tabs({
  items,
  label,
}: {
  readonly items: TabItem[];
  readonly label: string;
}): React.JSX.Element {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number): void => {
    const bounded = (index + items.length) % items.length;
    setActive(bounded);
    tabRefs.current[bounded]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTab(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTab(active - 1);
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-2 border-b border-slate-200 dark:border-slate-700"
      >
        {items.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                setActive(index);
              }}
              onKeyDown={onKeyDown}
              className={cn(
                "min-h-11 border-b-2 px-4 py-2 text-sm font-semibold",
                selected
                  ? "border-emerald-700 text-emerald-800 dark:text-emerald-300"
                  : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, index) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={index !== active}
          className="pt-4"
        >
          {index === active ? item.content : null}
        </div>
      ))}
    </div>
  );
}
