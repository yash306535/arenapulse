/**
 * Test-only render helper. Wraps a UI tree in the {@link AppProvider} so
 * components can read role/language context, and re-exports Testing Library.
 * Excluded from coverage (see vitest.config.ts).
 */
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

import { AppProvider } from "@/i18n/app-context";

/** Renders `ui` inside the app context provider. */
export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(<AppProvider>{ui}</AppProvider>);
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
