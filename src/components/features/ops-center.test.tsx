import { afterEach, describe, expect, it, vi } from "vitest";

import { OpsCenter } from "./ops-center";

import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";

const zones = [{ id: "zone-gate-a", label: "Gate A Plaza" }];

const incidentsPayload = {
  incidents: [
    {
      id: "inc-001",
      createdAtIso: "2026-07-05T10:00:00.000Z",
      status: "open" as const,
      zoneId: "zone-gate-a",
      category: "medical" as const,
      severity: "high" as const,
      description: "Fan requires first aid at Gate A.",
      reportedBy: "staff" as const,
    },
  ],
};

const briefingPayload = {
  briefing: {
    headline: "One open incident; Gate A busiest",
    overview: "Shift overview text for the demo.",
    keyPoints: ["Monitor Gate A congestion"],
    risks: [{ risk: "Gate A crowding", mitigation: "Add stewards" }],
    staffingActions: ["Confirm gate coverage"],
    zonesToWatch: [{ zoneId: "zone-gate-a", reason: "High utilization" }],
  },
  mocked: true,
};

function mockFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string | URL, init?: RequestInit) => {
      const target = String(url);
      if (target.includes("/api/ops/briefing")) {
        return Promise.resolve(new Response(JSON.stringify(briefingPayload)));
      }
      if (target.includes("/api/ops/incidents") && (init?.method ?? "GET") === "GET") {
        return Promise.resolve(new Response(JSON.stringify(incidentsPayload)));
      }
      return Promise.resolve(new Response("{}", { status: 404 }));
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("OpsCenter", () => {
  it("loads incidents into KPI tiles and the log", async () => {
    mockFetch();
    renderWithProviders(<OpsCenter zones={zones} />);
    await waitFor(() => {
      expect(screen.getByText("Fan requires first aid at Gate A.")).toBeInTheDocument();
    });
  });

  it("lets an organizer generate and render a shift briefing", async () => {
    window.history.replaceState(null, "", "/?role=organizer");
    mockFetch();
    const user = userEvent.setup();
    renderWithProviders(<OpsCenter zones={zones} />);

    await user.click(screen.getByRole("tab", { name: "Shift briefing" }));
    await user.click(screen.getByRole("button", { name: "Generate shift briefing" }));

    await waitFor(() => {
      expect(screen.getByText("One open incident; Gate A busiest")).toBeInTheDocument();
    });
    expect(screen.getByText("Monitor Gate A congestion")).toBeInTheDocument();
  });
});
