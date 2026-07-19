import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";

import { renderWithProviders, screen } from "@/test/render";

vi.mock("next/navigation", () => ({
  usePathname: () => "/assistant",
}));

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("SiteHeader", () => {
  it("renders the primary navigation with the current page marked", () => {
    renderWithProviders(<SiteHeader />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    const assistantLink = screen.getByRole("link", { name: "Assistant" });
    expect(assistantLink).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "ArenaPulse" })).toBeInTheDocument();
  });
});
