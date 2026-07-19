/** Presentational surface primitives used across feature pages. */
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

/** A bordered content surface. */
export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** A titled section within a card or page, rendering a heading at the given level. */
export function Section({
  title,
  headingLevel = 2,
  children,
}: {
  readonly title: string;
  readonly headingLevel?: 2 | 3;
  readonly children: ReactNode;
}): React.JSX.Element {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section className="space-y-3">
      <Heading className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </Heading>
      {children}
    </section>
  );
}
