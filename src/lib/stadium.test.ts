import { describe, expect, it } from "vitest";

import { getNode, getStadiumGraph, getZone, listNodesByType } from "./stadium";

describe("getStadiumGraph", () => {
  it("validates the fixture and exposes nodes, edges, and zones", () => {
    const graph = getStadiumGraph();
    expect(graph.geo.venue.name).toBe("ArenaPulse Demo Stadium");
    expect(graph.nodesById.size).toBeGreaterThanOrEqual(30);
    expect(graph.zonesById.size).toBeGreaterThanOrEqual(10);
  });

  it("builds bidirectional adjacency", () => {
    const graph = getStadiumGraph();
    const fromGate = graph.adjacency.get("gate-a") ?? [];
    const fromConcourse = graph.adjacency.get("conc-n") ?? [];
    expect(fromGate.some((edge) => edge.to === "conc-n")).toBe(true);
    expect(fromConcourse.some((edge) => edge.to === "gate-a")).toBe(true);
  });

  it("returns the same cached instance on repeat calls", () => {
    expect(getStadiumGraph()).toBe(getStadiumGraph());
  });

  it("leaves no node isolated", () => {
    const graph = getStadiumGraph();
    for (const nodeId of graph.nodesById.keys()) {
      expect(graph.adjacency.get(nodeId)?.length ?? 0, nodeId).toBeGreaterThan(0);
    }
  });
});

describe("lookups", () => {
  it("lists nodes by type", () => {
    expect(listNodesByType("gate")).toHaveLength(4);
    expect(listNodesByType("section")).toHaveLength(8);
    expect(listNodesByType("amenity").length).toBeGreaterThanOrEqual(10);
  });

  it("finds nodes and zones by id", () => {
    expect(getNode("gate-a")?.label).toBe("Gate A (North)");
    expect(getZone("zone-conc-n")?.capacity).toBe(2600);
    expect(getNode("missing")).toBeUndefined();
    expect(getZone("missing")).toBeUndefined();
  });
});

describe("listZones and stadiumViewBox", () => {
  it("lists zones and returns the map viewBox", async () => {
    const { listZones, stadiumViewBox } = await import("./stadium");
    expect(listZones().length).toBeGreaterThan(0);
    expect(listZones()[0]?.rect.width).toBeGreaterThan(0);
    expect(stadiumViewBox()).toMatch(/^[\d\s]+$/);
  });
});
