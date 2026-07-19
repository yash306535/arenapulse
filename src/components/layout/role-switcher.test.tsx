import { afterEach, describe, expect, it } from "vitest";

import { RoleSwitcher } from "./role-switcher";

import { renderWithProviders, screen, userEvent } from "@/test/render";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("RoleSwitcher", () => {
  it("exposes the roles as pressable toggle buttons in a labeled group", () => {
    renderWithProviders(<RoleSwitcher />);
    const group = screen.getByRole("group", { name: "View as" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fan", pressed: true })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Organizer / Staff", pressed: false }),
    ).toBeInTheDocument();
  });

  it("updates the pressed state and the URL when a role is chosen", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RoleSwitcher />);
    await user.click(screen.getByRole("button", { name: "Volunteer" }));
    expect(screen.getByRole("button", { name: "Volunteer", pressed: true })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("role")).toBe("volunteer");
  });
});
