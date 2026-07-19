import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "./logger";

/*
 * The logger is intentionally silent under test (VITEST / NODE_ENV=test). To
 * exercise the emit paths we temporarily clear those flags and spy on console,
 * restoring the original environment afterwards.
 */
// NODE_ENV is typed read-only; use a local mutable view to override it in tests.
const mutableEnv = process.env as Record<string, string | undefined>;
const originalVitest = mutableEnv.VITEST;
const originalNodeEnv = mutableEnv.NODE_ENV;

beforeEach(() => {
  delete mutableEnv.VITEST;
});

afterEach(() => {
  mutableEnv.VITEST = originalVitest;
  mutableEnv.NODE_ENV = originalNodeEnv;
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("emits all levels in development, including context", () => {
    mutableEnv.NODE_ENV = "development";
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logger.debug("debug line");
    logger.info("info line");
    logger.warn("warn line", { code: "X" });
    logger.error("error line", { reason: "boom" });

    // debug is routed to console.info, so info is called for both debug + info.
    expect(info).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("warn line"), { code: "X" });
    expect(error).toHaveBeenCalledWith(expect.stringContaining("error line"), { reason: "boom" });
  });

  it("suppresses debug in production but still logs errors", () => {
    mutableEnv.NODE_ENV = "production";
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logger.debug("should not appear");
    logger.info("should appear");
    logger.error("always appears");

    expect(info).toHaveBeenCalledTimes(1); // only info, not debug
    expect(error).toHaveBeenCalledTimes(1);
  });
});
