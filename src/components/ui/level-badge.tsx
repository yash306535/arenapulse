/**
 * Density-level indicator. Encodes level with a distinct symbol AND text label
 * (not color alone) so it meets WCAG 1.4.1 — the color is purely reinforcing.
 */
import type { DensityLevel } from "@/schemas/crowd";

const LEVEL_STYLE: Record<DensityLevel, { symbol: string; classes: string }> = {
  low: { symbol: "○", classes: "bg-emerald-100 text-emerald-900 border-emerald-600" },
  moderate: { symbol: "◐", classes: "bg-sky-100 text-sky-900 border-sky-600" },
  high: { symbol: "◑", classes: "bg-amber-100 text-amber-900 border-amber-600" },
  critical: { symbol: "●", classes: "bg-red-100 text-red-900 border-red-700" },
};

/** Renders a level as a bordered pill combining a symbol and its text label. */
export function LevelBadge({
  level,
  label,
}: {
  readonly level: DensityLevel;
  readonly label: string;
}): React.JSX.Element {
  const style = LEVEL_STYLE[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${style.classes}`}
    >
      <span aria-hidden="true">{style.symbol}</span>
      {label}
    </span>
  );
}
