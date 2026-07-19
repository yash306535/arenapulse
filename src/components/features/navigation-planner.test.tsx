import { afterEach, describe, expect, it, vi } from "vitest";

import { NavigationPlanner } from "./navigation-planner";

import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";

const nodeOptions = [
  { id: "gate-a", label: "Gate A (North)" },
  { id: "sec-n1", label: "Section N1" },
];
const mapNodes = [
  { id: "gate-a", label: "Gate A (North)", x: 0, y: 0, type: "gate" as const },
  { id: "sec-n1", label: "Section N1", x: 10, y: 10, type: "section" as const },
];

const routeResponse = {
  route: {
    nodeIds: ["gate-a", "sec-n1"],
    steps: [
      {
        fromId: "gate-a",
        toId: "sec-n1",
        fromLabel: "Gate A (North)",
        toLabel: "Section N1",
        distanceMeters: 60,
        via: "ramp",
        stepFree: true,
      },
    ],
    totalDistanceMeters: 60,
    stepFree: true,
  },
  narration: "Walk from Gate A to Section N1.",
  mocked: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NavigationPlanner", () => {
  it("renders the labeled origin/destination selects", () => {
    renderWithProviders(
      <NavigationPlanner
        nodeOptions={nodeOptions}
        mapNodes={mapNodes}
        mapEdges={[]}
        viewBox="0 0 20 20"
      />,
    );
    expect(screen.getByLabelText("Start point")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination")).toBeInTheDocument();
  });

  it("submits and renders the computed steps and narration", async () => {
    const fetchMock = vi.fn((_url: string | URL, _init?: RequestInit) =>
      Promise.resolve(Response.json(routeResponse)),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithProviders(
      <NavigationPlanner
        nodeOptions={nodeOptions}
        mapNodes={mapNodes}
        mapEdges={[]}
        viewBox="0 0 20 20"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Get directions" }));

    await waitFor(() => {
      expect(screen.getByText("Walk from Gate A to Section N1.")).toBeInTheDocument();
    });
    expect(screen.getByText(/Gate A \(North\) → Section N1/)).toBeInTheDocument();
    const body = (fetchMock.mock.calls[0]?.[1]?.body ?? "{}") as string;
    expect(JSON.parse(body)).toMatchObject({ originId: "gate-a" });
  });

  it("shows a no-route message on a 422 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("{}", { status: 422 }))),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <NavigationPlanner
        nodeOptions={nodeOptions}
        mapNodes={mapNodes}
        mapEdges={[]}
        viewBox="0 0 20 20"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Get directions" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("No route is available");
    });
  });
});
