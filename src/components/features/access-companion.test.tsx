import { afterEach, describe, expect, it, vi } from "vitest";

import { AccessCompanion } from "./access-companion";

import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";

const services = [{ id: "sensory", label: "Sensory-Friendly Quiet Room" }];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AccessCompanion", () => {
  it("lists accessibility services", () => {
    renderWithProviders(<AccessCompanion services={services} />);
    expect(screen.getByText("Sensory-Friendly Quiet Room")).toBeInTheDocument();
  });

  it("simplifies an announcement via the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(Response.json({ text: "Gate A opens soon.", mocked: true }))),
    );
    const user = userEvent.setup();
    renderWithProviders(<AccessCompanion services={services} />);
    await user.type(
      screen.getByLabelText("Announcement text"),
      "Gate A will commence boarding approximately shortly.",
    );
    await user.click(screen.getByRole("button", { name: "Simplify" }));

    await waitFor(() => {
      expect(screen.getByText("Gate A opens soon.")).toBeInTheDocument();
    });
  });
});
