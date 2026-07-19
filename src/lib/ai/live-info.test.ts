import { describe, expect, it } from "vitest";

import { isLiveInfoQuery } from "./live-info";

describe("isLiveInfoQuery", () => {
  it("detects schedule, weather, news, score, and disruption questions", () => {
    expect(isLiveInfoQuery("What is the match schedule this week?")).toBe(true);
    expect(isLiveInfoQuery("will it rain during the game?")).toBe(true);
    expect(isLiveInfoQuery("any news about the tournament today?")).toBe(true);
    expect(isLiveInfoQuery("who won yesterday's match?")).toBe(true);
    expect(isLiveInfoQuery("is there a metro strike?")).toBe(true);
  });

  it("ignores static venue questions", () => {
    expect(isLiveInfoQuery("Where is the prayer room?")).toBe(false);
    expect(isLiveInfoQuery("Can I bring a water bottle?")).toBe(false);
    expect(isLiveInfoQuery("¿Dónde está la puerta B?")).toBe(false);
  });
});
