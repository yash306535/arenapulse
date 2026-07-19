/** Honest "demo mode" badge shown whenever a service is served by its mock twin. */
import { cn } from "./cn";

/** Renders a labeled badge; nothing when the backing service is live. */
export function DemoBadge({
  mocked,
  label,
  className,
}: {
  readonly mocked: boolean;
  readonly label: string;
  readonly className?: string;
}): React.JSX.Element | null {
  if (!mocked) {
    return null;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-500 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200",
        className,
      )}
    >
      <span aria-hidden="true">●</span>
      {label}
    </span>
  );
}
