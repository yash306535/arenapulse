/**
 * Stadium navigation pathfinder. Runs Dijkstra's algorithm over the validated
 * stadium graph, optionally restricted to step-free edges for accessible
 * routing. The graph is tiny (tens of nodes), so the simple O(n^2) frontier
 * scan is clearer than a heap and comfortably fast.
 */
import type { StadiumGraph } from "@/lib/stadium";
import type { RouteResult, RouteStep } from "@/schemas/navigation";

/** Options controlling a route computation. */
export interface RouteQuery {
  readonly originId: string;
  readonly destinationId: string;
  /** When true, edges with stairs are excluded (accessibility routing). */
  readonly stepFreeOnly: boolean;
}

/**
 * Computes the shortest route between two stadium nodes.
 * Returns null when either endpoint is unknown or no path exists under the
 * given constraints (e.g. step-free-only through a stairs-only link).
 */
export function findRoute(graph: StadiumGraph, query: RouteQuery): RouteResult | null {
  const { originId, destinationId, stepFreeOnly } = query;
  if (!graph.nodesById.has(originId) || !graph.nodesById.has(destinationId)) {
    return null;
  }
  if (originId === destinationId) {
    return { nodeIds: [originId], steps: [], totalDistanceMeters: 0, stepFree: true };
  }

  const state: DijkstraState = {
    distances: new Map<string, number>([[originId, 0]]),
    previous: new Map<string, string>(),
  };
  const unvisited = new Set<string>(graph.nodesById.keys());

  while (unvisited.size > 0) {
    const current = nearestUnvisited(unvisited, state.distances);
    if (current === undefined || current === destinationId) {
      break;
    }
    unvisited.delete(current);
    const currentDistance = state.distances.get(current) ?? Number.POSITIVE_INFINITY;
    relaxNeighbors(graph, current, currentDistance, stepFreeOnly, state);
  }

  if (!state.distances.has(destinationId)) {
    return null;
  }
  return assembleRoute(graph, originId, destinationId, state.previous);
}

/** Mutable Dijkstra bookkeeping shared by the frontier scan and edge relaxation. */
interface DijkstraState {
  readonly distances: Map<string, number>;
  readonly previous: Map<string, string>;
}

/** Returns the unvisited node with the smallest known distance, or undefined. */
function nearestUnvisited(
  unvisited: ReadonlySet<string>,
  distances: ReadonlyMap<string, number>,
): string | undefined {
  let nearest: string | undefined;
  let best = Number.POSITIVE_INFINITY;
  for (const nodeId of unvisited) {
    const distance = distances.get(nodeId);
    if (distance !== undefined && distance < best) {
      nearest = nodeId;
      best = distance;
    }
  }
  return nearest;
}

/** Relaxes the outgoing edges of `current`, updating shortest distances and predecessors. */
function relaxNeighbors(
  graph: StadiumGraph,
  current: string,
  currentDistance: number,
  stepFreeOnly: boolean,
  state: DijkstraState,
): void {
  for (const edge of graph.adjacency.get(current) ?? []) {
    if (stepFreeOnly && !edge.stepFree) {
      continue;
    }
    const candidate = currentDistance + edge.distanceMeters;
    const known = state.distances.get(edge.to);
    if (known === undefined || candidate < known) {
      state.distances.set(edge.to, candidate);
      state.previous.set(edge.to, current);
    }
  }
}

function assembleRoute(
  graph: StadiumGraph,
  originId: string,
  destinationId: string,
  previous: ReadonlyMap<string, string>,
): RouteResult {
  const nodeIds: string[] = [destinationId];
  let cursor = destinationId;
  while (cursor !== originId) {
    const parent = previous.get(cursor);
    if (parent === undefined) {
      throw new Error(`Route assembly failed at node ${cursor}`);
    }
    nodeIds.unshift(parent);
    cursor = parent;
  }

  const steps: RouteStep[] = [];
  for (let index = 0; index < nodeIds.length - 1; index += 1) {
    steps.push(buildStep(graph, nodeIds[index] ?? "", nodeIds[index + 1] ?? ""));
  }
  return {
    nodeIds,
    steps,
    totalDistanceMeters: steps.reduce((sum, step) => sum + step.distanceMeters, 0),
    stepFree: steps.every((step) => step.stepFree),
  };
}

function buildStep(graph: StadiumGraph, fromId: string, toId: string): RouteStep {
  const edge = (graph.adjacency.get(fromId) ?? []).find((candidate) => candidate.to === toId);
  const fromNode = graph.nodesById.get(fromId);
  const toNode = graph.nodesById.get(toId);
  if (!edge || !fromNode || !toNode) {
    throw new Error(`Inconsistent route segment ${fromId} -> ${toId}`);
  }
  return {
    fromId,
    toId,
    fromLabel: fromNode.label,
    toLabel: toNode.label,
    distanceMeters: edge.distanceMeters,
    via: edge.via,
    stepFree: edge.stepFree,
  };
}

/** Renders a route as plain-English steps — the non-AI fallback and the factual basis handed to Gemini. */
export function describeRoute(route: RouteResult): string[] {
  if (route.steps.length === 0) {
    return ["You are already at your destination."];
  }
  const lines = route.steps.map((step, index) => {
    const viaText = step.via === "concourse" ? "along the concourse" : `via the ${step.via}`;
    return `${String(index + 1)}. From ${step.fromLabel}, continue ${viaText} to ${step.toLabel} (${String(step.distanceMeters)} m).`;
  });
  lines.push(
    `Total distance: about ${String(route.totalDistanceMeters)} m${route.stepFree ? ", fully step-free" : ""}.`,
  );
  return lines;
}
