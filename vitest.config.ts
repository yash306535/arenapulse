import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // `server-only` is a bundler guard that throws outside React Server
      // Components; unit tests import server modules directly, so stub it.
      "server-only": path.resolve(import.meta.dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/types/**", "src/**/*.d.ts", "src/test/**"],
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 82,
        lines: 85,
        "src/lib/**": { statements: 88, lines: 88 },
        "src/app/api/**": { statements: 85, lines: 85 },
      },
    },
  },
});
