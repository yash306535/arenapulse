import { describe, expect, it } from "vitest";

import { getMatch, listMatches, venueName } from "./schedule";

describe("schedule", () => {
  it("lists matches in kickoff order", () => {
    const matches = listMatches();
    expect(matches.length).toBe(6);
    const times = matches.map((match) => Date.parse(match.kickoffIso));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it("looks up matches by id", () => {
    expect(getMatch("match-1")?.home).toBe("Mexico");
    expect(getMatch("match-404")).toBeUndefined();
  });

  it("exposes the demo venue name", () => {
    expect(venueName()).toBe("ArenaPulse Demo Stadium");
  });
});
