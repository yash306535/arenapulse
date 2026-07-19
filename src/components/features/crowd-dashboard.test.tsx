import { afterEach, describe, expect, it, vi } from "vitest";

import { CrowdDashboard } from "./crowd-dashboard";

import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";

const zones = [
  {
    id: "zone-gate-a",
    label: "Gate A Plaza",
    capacity: 3000,
    rect: { x: 0, y: 0, width: 10, height: 10 },
  },
];

const snapshot = {
  generatedAtIso: "2026-07-05T12:00:00.000Z",
  simulated: true,
  zones: [
    {
      zoneId: "zone-gate-a",
      label: "Gate A Plaza",
      occupancy: 1500,
      capacity: 3000,
      utilization: 0.5,
      level: "moderate",
      trend: "steady",
    },
  ],
};

const recommendPayload = {
  snapshot,
  recommendation: {
    summary: "All zones within comfortable density.",
    alerts: [],
    gateReroutes: [],
    staffingMoves: [],
  },
  mocked: true,
};

function mockFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string | URL) => {
      if (String(url).includes("/recommend")) {
        return Promise.resolve(Response.json(recommendPayload));
      }
      return Promise.resolve(Response.json(snapshot));
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("CrowdDashboard", () => {
  it("polls the feed and renders the zone table with a simulated-feed label", async () => {
    mockFetch();
    renderWithProviders(<CrowdDashboard zones={zones} viewBox="0 0 10 10" />);
    expect(screen.getByText("Simulated feed for demo purposes.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "50%" })).toBeInTheDocument();
    });
  });

  it("shows AI recommendations for organizers", async () => {
    window.history.replaceState(null, "", "/?role=organizer");
    mockFetch();
    const user = userEvent.setup();
    renderWithProviders(<CrowdDashboard zones={zones} viewBox="0 0 10 10" />);
    await user.click(screen.getByRole("button", { name: "Get AI recommendations" }));
    await waitFor(() => {
      expect(screen.getByText("All zones within comfortable density.")).toBeInTheDocument();
    });
  });
});
