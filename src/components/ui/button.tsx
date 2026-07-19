/** Accessible button primitive with variant/size styles and a 44px min touch target. */
import type { ButtonHTMLAttributes } from "react";

import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-700/50",
  secondary:
    "border border-slate-400 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600",
  ghost: "text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-slate-800",
};

/** A styled `<button>` that defaults to `type="button"` to avoid accidental form submits. */
export function Button({
  variant = "primary",
  className,
  type,
  children,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
