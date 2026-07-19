/**
 * F3 — Crowd density heatmap. Renders zones over the stadium footprint using
 * BOTH color and a distinct hatch pattern plus a numeric percentage label, so
 * density is never conveyed by color alone (WCAG 1.4.1). The table beside it is
 * the accessible equivalent; this SVG is labeled and hidden from AT internals.
 */
import type { DensityLevel, ZoneDensity } from "@/schemas/crowd";
import type { StadiumZone } from "@/schemas/stadium";

const LEVEL_FILL: Record<DensityLevel, string> = {
  low: "#a7f3d0",
  moderate: "#bae6fd",
  high: "#fde68a",
  critical: "#fecaca",
};

/** Diagonal-hatch pattern definitions, one per level, for non-color encoding. */
function HatchDefs(): React.JSX.Element {
  const levels: DensityLevel[] = ["low", "moderate", "high", "critical"];
  const gaps: Record<DensityLevel, number> = { low: 14, moderate: 10, high: 7, critical: 4 };
  return (
    <defs>
      {levels.map((level) => (
        <pattern
          key={level}
          id={`hatch-${level}`}
          width={gaps[level]}
          height={gaps[level]}
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2={gaps[level]} stroke="#334155" strokeWidth="2" />
        </pattern>
      ))}
    </defs>
  );
}

/** Renders the zone heatmap for the current density snapshot. */
export function CrowdHeatmap({
  viewBox,
  zones,
  densityById,
  title,
}: {
  readonly viewBox: string;
  readonly zones: StadiumZone[];
  readonly densityById: Record<string, ZoneDensity>;
  readonly title: string;
}): React.JSX.Element {
  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={title}
      className="h-auto w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700"
    >
      <HatchDefs />
      {zones.map((zone) => {
        const density = densityById[zone.id];
        const level: DensityLevel = density?.level ?? "low";
        const percent = density === undefined ? 0 : Math.round(density.utilization * 100);
        return (
          <g key={zone.id}>
            <rect
              x={zone.rect.x}
              y={zone.rect.y}
              width={zone.rect.width}
              height={zone.rect.height}
              fill={LEVEL_FILL[level]}
              stroke="#334155"
              strokeWidth="1"
            />
            <rect
              x={zone.rect.x}
              y={zone.rect.y}
              width={zone.rect.width}
              height={zone.rect.height}
              fill={`url(#hatch-${level})`}
              opacity="0.5"
            />
            <text
              x={zone.rect.x + zone.rect.width / 2}
              y={zone.rect.y + zone.rect.height / 2}
              textAnchor="middle"
              fontSize="20"
              fontWeight="700"
              fill="#0f172a"
            >
              {percent}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
