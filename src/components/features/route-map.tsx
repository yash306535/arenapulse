/**
 * F2 — Custom SVG stadium map. Draws the node graph and highlights a computed
 * route. Presentational and decorative: it carries a descriptive aria-label and
 * hides its internals from assistive tech, because the step list beside it is
 * the authoritative, keyboard-accessible equivalent.
 */
import type { NodeType } from "@/schemas/stadium";

/** A map node with layout coordinates. */
export interface MapNode {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly type: NodeType;
}

/** An undirected connection between two nodes. */
export interface MapEdge {
  readonly from: string;
  readonly to: string;
}

/** Renders the stadium graph with the active route highlighted. */
export function RouteMap({
  viewBox,
  nodes,
  edges,
  pathNodeIds,
  title,
}: {
  readonly viewBox: string;
  readonly nodes: MapNode[];
  readonly edges: MapEdge[];
  readonly pathNodeIds: string[];
  readonly title: string;
}): React.JSX.Element {
  const positions = new Map(nodes.map((node) => [node.id, node]));
  const pathSet = new Set(pathNodeIds);
  const pathEdges = new Set(
    pathNodeIds.slice(0, -1).map((id, index) => `${id}|${pathNodeIds[index + 1] ?? ""}`),
  );
  const isOnPath = (a: string, b: string): boolean =>
    pathEdges.has(`${a}|${b}`) || pathEdges.has(`${b}|${a}`);

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={title}
      className="h-auto w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
    >
      {edges.map((edge) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (from === undefined || to === undefined) {
          return null;
        }
        const active = isOnPath(edge.from, edge.to);
        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={active ? "#047857" : "#cbd5e1"}
            strokeWidth={active ? 10 : 3}
          />
        );
      })}
      {nodes.map((node) => {
        const active = pathSet.has(node.id);
        return (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={active ? 14 : 8}
            fill={active ? "#047857" : "#94a3b8"}
          />
        );
      })}
    </svg>
  );
}
