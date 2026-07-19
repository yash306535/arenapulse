/** Page heading block: the single `h1`, a description, and an optional badge slot. */
import type { ReactNode } from "react";

/** Renders the page's `h1`, its description, and any trailing controls/badges. */
export function PageHeader({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly children?: ReactNode;
}): React.JSX.Element {
  return (
    <div className="mb-6 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        {children}
      </div>
      <p className="max-w-3xl text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
