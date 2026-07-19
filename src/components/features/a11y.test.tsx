/**
 * Accessibility pass — automated axe scans on the five key screens required by
 * the acceptance checklist: Home, Assistant, Navigation, Crowd, and Ops. Each
 * must report zero violations. Network calls are stubbed so mounts stay
 * deterministic and offline.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { AccessCompanion } from "./access-companion";
import { AssistantChat } from "./assistant-chat";
import { CrowdDashboard } from "./crowd-dashboard";
import { HomeScreen } from "./home-screen";
import { NavigationPlanner } from "./navigation-planner";
import { OpsCenter } from "./ops-center";
import { SustainabilityHub } from "./sustainability-hub";
import { TransitPlanner } from "./transit-planner";

import { renderWithProviders } from "@/test/render";

const zones = [
  {
    id: "zone-gate-a",
    label: "Gate A Plaza",
    capacity: 3000,
    rect: { x: 0, y: 0, width: 10, height: 10 },
  },
];
const nodeOptions = [
  { id: "gate-a", label: "Gate A (North)" },
  { id: "sec-n1", label: "Section N1" },
];
const mapNodes = [
  { id: "gate-a", label: "Gate A (North)", x: 0, y: 0, type: "gate" as const },
  { id: "sec-n1", label: "Section N1", x: 10, y: 10, type: "section" as const },
];

beforeEach(() => {
  // Reject network calls so mount-time fetches settle deterministically offline.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline in test"))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("accessibility (axe)", () => {
  it("Home screen has no violations", async () => {
    const { container } = renderWithProviders(<HomeScreen />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Assistant screen has no violations", async () => {
    const { container } = renderWithProviders(<AssistantChat />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Navigation screen has no violations", async () => {
    const { container } = renderWithProviders(
      <NavigationPlanner
        nodeOptions={nodeOptions}
        mapNodes={mapNodes}
        mapEdges={[]}
        viewBox="0 0 20 20"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Crowd screen has no violations", async () => {
    const { container } = renderWithProviders(<CrowdDashboard zones={zones} viewBox="0 0 10 10" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Ops screen has no violations", async () => {
    const { container } = renderWithProviders(
      <OpsCenter zones={[{ id: "zone-gate-a", label: "Gate A Plaza" }]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Access Companion screen has no violations", async () => {
    const { container } = renderWithProviders(
      <AccessCompanion services={[{ id: "sensory", label: "Sensory-Friendly Quiet Room" }]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Sustainability screen has no violations", async () => {
    const { container } = renderWithProviders(
      <SustainabilityHub modes={[{ mode: "car", label: "Car (driving alone)" }]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Transit screen has no violations", async () => {
    const { container } = renderWithProviders(
      <TransitPlanner matches={[{ id: "match-1", label: "Mexico v Poland" }]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
