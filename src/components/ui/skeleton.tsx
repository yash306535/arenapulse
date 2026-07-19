/** Loading placeholder that announces busy state to assistive tech. */
import { cn } from "./cn";

/** A pulsing placeholder block; labeled so screen readers announce loading. */
export function Skeleton({
  className,
  label,
}: {
  readonly className?: string;
  readonly label: string;
}): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700", className)}
    />
  );
}
