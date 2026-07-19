/**
 * Stadium map access layer. Validates the geo fixture once, builds the
 * bidirectional adjacency structure used by the pathfinder, and exposes typed
 * lookups for nodes and crowd zones.
 */
import stadiumGeoRaw from "@/data/stadium.geo.json";
import { stadiumGeoSchema } from "@/schemas/stadium";
import type { NodeType, StadiumGeo, StadiumNode, StadiumZone } from "@/schemas/stadium";

/** One traversable connection out of a node. */
export interface AdjacentEdge {
  readonly to: string;
  readonly distanceMeters: number;
  readonly stepFree: boolean;
  readonly via: "concourse" | "ramp" | "stairs" | "elevator";
}

/** Validated stadium data plus derived lookup structures. */
export interface StadiumGraph {
  readonly geo: StadiumGeo;
  readonly nodesById: ReadonlyMap<string, StadiumNode>;
  readonly adjacency: ReadonlyMap<string, readonly AdjacentEdge[]>;
  readonly zonesById: ReadonlyMap<string, StadiumZone>;
}

function buildGraph(): StadiumGraph {
  const geo = stadiumGeoSchema.parse(stadiumGeoRaw);
  const nodesById = new Map(geo.nodes.map((node) => [node.id, node]));

  const adjacency = new Map<string, AdjacentEdge[]>();
  for (const edge of geo.edges) {
    if (!nodesById.has(edge.from) || !nodesById.has(edge.to)) {
      throw new Error(`Stadium edge references unknown node: ${edge.from} -> ${edge.to}`);
    }
    const forward: AdjacentEdge = {
      to: edge.to,
      distanceMeters: edge.distanceMeters,
      stepFree: edge.stepFree,
      via: edge.via,
    };
    const backward: AdjacentEdge = { ...forward, to: edge.from };
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), forward]);
    adjacency.set(edge.to, [...(adjacency.get(edge.to) ?? []), backward]);
  }

  return {
    geo,
    nodesById,
    adjacency,
    zonesById: new Map(geo.zones.map((zone) => [zone.id, zone])),
  };
}

let cachedGraph: StadiumGraph | undefined;

/** Returns the validated stadium graph, built lazily on first access. */
export function getStadiumGraph(): StadiumGraph {
  cachedGraph ??= buildGraph();
  return cachedGraph;
}

/** Lists nodes of one type, in fixture order (stable for UI dropdowns). */
export function listNodesByType(type: NodeType): StadiumNode[] {
  return getStadiumGraph().geo.nodes.filter((node) => node.type === type);
}

/** Looks up a node by id, or undefined when absent. */
export function getNode(id: string): StadiumNode | undefined {
  return getStadiumGraph().nodesById.get(id);
}

/** Looks up a crowd zone by id, or undefined when absent. */
export function getZone(id: string): StadiumZone | undefined {
  return getStadiumGraph().zonesById.get(id);
}
