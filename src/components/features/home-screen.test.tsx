import { afterEach, describe, expect, it } from "vitest";

import { HomeScreen } from "./home-screen";

import { renderWithProviders, screen } from "@/test/render";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("HomeScreen", () => {
  it("renders a single h1 and links to every feature", () => {
    renderWithProviders(<HomeScreen />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome to ArenaPulse" }),
    ).toBeInTheDocument();
    const openLinks = screen.getAllByRole("link", { name: /Open/ });
    expect(openLinks.length).toBe(7);
    expect(screen.getByRole("group", { name: "View as" })).toBeInTheDocument();
  });
});
