import { afterEach, describe, expect, it, vi } from "vitest";

import { TransitPlanner } from "./transit-planner";

import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";

const matches = [{ id: "match-1", label: "Mexico v Poland" }];

const payload = {
  plan: {
    origin: "Downtown",
    destination: "ArenaPulse Demo Stadium",
    mode: "transit",
    steps: [{ instruction: "Ride the metro to the venue", durationMinutes: 20, distanceKm: 8 }],
    totalDurationMinutes: 20,
    totalDistanceKm: 8,
    mocked: true,
  },
  advice: "Leave by 17:00 to be safe.",
  leaveByIso: "2026-06-11T17:00:00-06:00",
  arriveByIso: "2026-06-11T17:30:00-06:00",
  mocked: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TransitPlanner", () => {
  it("plans a trip and renders steps, advice, and leave-by time", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(payload)))),
    );
    const user = userEvent.setup();
    renderWithProviders(<TransitPlanner matches={matches} />);
    await user.type(screen.getByLabelText("Starting location"), "Downtown");
    await user.click(screen.getByRole("button", { name: "Plan my trip" }));

    await waitFor(() => {
      expect(screen.getByText(/Ride the metro to the venue/)).toBeInTheDocument();
    });
    expect(screen.getByText("Leave by 17:00 to be safe.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Map of the stadium area" })).toBeInTheDocument();
  });
});
