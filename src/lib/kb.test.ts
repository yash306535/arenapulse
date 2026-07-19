import { describe, expect, it } from "vitest";

import { findKbMatches, kbAsContext, listKbEntries } from "./kb";

describe("listKbEntries / kbAsContext", () => {
  it("exposes the validated knowledge base", () => {
    expect(listKbEntries().length).toBeGreaterThanOrEqual(12);
    const context = kbAsContext();
    expect(context).toContain("Q: When do the gates open");
    expect(context).toContain("prayer room");
  });
});

describe("findKbMatches", () => {
  it("finds the most relevant entries for a query", () => {
    const matches = findKbMatches("where is the prayer room?");
    expect(matches[0]?.topic).toBe("prayer-room");
  });

  it("matches accessibility questions", () => {
    const matches = findKbMatches("wheelchair accessible seating help");
    expect(matches.some((entry) => entry.topic === "accessibility")).toBe(true);
  });

  it("returns empty for queries with no usable words or no matches", () => {
    expect(findKbMatches("a b")).toEqual([]);
    expect(findKbMatches("zzzqqq xyzzy")).toEqual([]);
  });

  it("respects the limit parameter", () => {
    expect(findKbMatches("stadium gates food water", 1)).toHaveLength(1);
  });
});
