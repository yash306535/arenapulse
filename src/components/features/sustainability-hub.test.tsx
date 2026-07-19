import { afterEach, describe, expect, it, vi } from "vitest";

import { SustainabilityHub } from "./sustainability-hub";

import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";

const modes = [
  { mode: "car" as const, label: "Car (driving alone)" },
  { mode: "metro" as const, label: "Metro / light rail" },
];

const payload = {
  comparison: [
    { mode: "metro", label: "Metro / light rail", gramsCo2e: 280, savedVsCarGrams: 1080 },
    { mode: "car", label: "Car (driving alone)", gramsCo2e: 1360, savedVsCarGrams: 0 },
  ],
  tip: "Take the metro to cut your impact.",
  note: "Illustrative factors for demo purposes.",
  mocked: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SustainabilityHub", () => {
  it("compares travel modes and renders the tip", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(payload)))),
    );
    const user = userEvent.setup();
    renderWithProviders(<SustainabilityHub modes={modes} />);
    await user.click(screen.getByRole("button", { name: "Compare impact" }));

    await waitFor(() => {
      expect(screen.getByText("Take the metro to cut your impact.")).toBeInTheDocument();
    });
    expect(screen.getByText("Carbon comparison")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "280" })).toBeInTheDocument();
  });
});
