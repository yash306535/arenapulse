import { describe, expect, it } from "vitest";

import { describeRoute, findRoute } from "./pathfinder";

import { getStadiumGraph } from "@/lib/stadium";

const graph = getStadiumGraph();

describe("findRoute", () => {
  it("finds the shortest route from a gate to a section", () => {
    const route = findRoute(graph, {
      originId: "gate-a",
      destinationId: "sec-n1",
      stepFreeOnly: false,
    });
    expect(route).not.toBeNull();
    expect(route?.nodeIds).toEqual(["gate-a", "conc-n", "sec-n1"]);
    expect(route?.totalDistanceMeters).toBe(90);
    expect(route?.stepFree).toBe(false);
  });

  it("returns a longer but fully step-free route when stepFreeOnly is set", () => {
    const route = findRoute(graph, {
      originId: "gate-a",
      destinationId: "sec-n1",
      stepFreeOnly: true,
    });
    expect(route).not.toBeNull();
    expect(route?.stepFree).toBe(true);
    expect(route?.steps.every((step) => step.stepFree)).toBe(true);
    expect(route?.nodeIds).toContain("conc-nw");
    expect(route?.totalDistanceMeters).toBeGreaterThan(90);
  });

  it("routes across the stadium through the concourse ring", () => {
    const route = findRoute(graph, {
      originId: "gate-b",
      destinationId: "sec-w1",
      stepFreeOnly: false,
    });
    expect(route).not.toBeNull();
    expect(route?.nodeIds[0]).toBe("gate-b");
    expect(route?.nodeIds.at(-1)).toBe("sec-w1");
    const total = route?.totalDistanceMeters ?? 0;
    expect(total).toBeGreaterThan(200);
  });

  it("returns a zero-length route when origin equals destination", () => {
    const route = findRoute(graph, {
      originId: "gate-a",
      destinationId: "gate-a",
      stepFreeOnly: false,
    });
    expect(route).toEqual({
      nodeIds: ["gate-a"],
      steps: [],
      totalDistanceMeters: 0,
      stepFree: true,
    });
  });

  it("returns null for unknown origin or destination", () => {
    expect(
      findRoute(graph, { originId: "nowhere", destinationId: "sec-n1", stepFreeOnly: false }),
    ).toBeNull();
    expect(
      findRoute(graph, { originId: "gate-a", destinationId: "nowhere", stepFreeOnly: false }),
    ).toBeNull();
  });

  it("returns null when constraints make the destination unreachable", () => {
    const withoutTarget = new Map(
      [...graph.adjacency].map(([nodeId, edges]) => [
        nodeId,
        nodeId === "sec-n1" ? [] : edges.filter((edge) => edge.to !== "sec-n1"),
      ]),
    );
    const island = { ...graph, adjacency: withoutTarget };
    const route = findRoute(island, {
      originId: "gate-a",
      destinationId: "sec-n1",
      stepFreeOnly: false,
    });
    expect(route).toBeNull();
  });

  it("every gate can reach every amenity step-free", () => {
    const gates = graph.geo.nodes.filter((node) => node.type === "gate");
    const amenities = graph.geo.nodes.filter((node) => node.type === "amenity");
    for (const gate of gates) {
      for (const amenity of amenities) {
        const route = findRoute(graph, {
          originId: gate.id,
          destinationId: amenity.id,
          stepFreeOnly: true,
        });
        expect(route, `${gate.id} -> ${amenity.id}`).not.toBeNull();
      }
    }
  });
});

describe("describeRoute", () => {
  it("renders numbered instructions plus a total line", () => {
    const route = findRoute(graph, {
      originId: "gate-a",
      destinationId: "sec-n1",
      stepFreeOnly: false,
    });
    expect(route).not.toBeNull();
    if (route === null) {
      return;
    }
    const lines = describeRoute(route);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("Gate A (North)");
    expect(lines[0]).toContain("via the ramp");
    expect(lines.at(-1)).toContain("Total distance");
  });

  it("handles the already-there case", () => {
    const route = findRoute(graph, {
      originId: "conc-n",
      destinationId: "conc-n",
      stepFreeOnly: false,
    });
    expect(route).not.toBeNull();
    if (route === null) {
      return;
    }
    expect(describeRoute(route)).toEqual(["You are already at your destination."]);
  });
});
