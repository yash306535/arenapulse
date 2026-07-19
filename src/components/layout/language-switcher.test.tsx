import { afterEach, describe, expect, it } from "vitest";

import { LanguageSwitcher } from "./language-switcher";

import { renderWithProviders, screen, userEvent } from "@/test/render";

afterEach(() => {
  window.history.replaceState(null, "", "/");
  document.documentElement.lang = "en";
});

describe("LanguageSwitcher", () => {
  it("renders a labeled language select defaulting to English", () => {
    renderWithProviders(<LanguageSwitcher />);
    const select = screen.getByLabelText("Language");
    expect(select).toHaveValue("en");
  });

  it("changes the UI language, the URL, and <html lang>", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);
    await user.selectOptions(screen.getByLabelText("Language"), "fr");
    expect(screen.getByLabelText("Langue")).toHaveValue("fr");
    expect(new URLSearchParams(window.location.search).get("lang")).toBe("fr");
    expect(document.documentElement.lang).toBe("fr");
  });
});
