import { describe, expect, it } from "vitest";

import { isServiceMocked, parseEnv } from "./env";

describe("parseEnv", () => {
  it("applies defaults when optional variables are absent", () => {
    const config = parseEnv({});
    expect(config.geminiModel).toBe("gemini-2.5-flash");
    expect(config.mockMode).toBe(false);
    expect(config.geminiApiKey).toBeUndefined();
    expect(config.mapsApiKey).toBeUndefined();
  });

  it("treats empty-string keys as absent", () => {
    const config = parseEnv({ GEMINI_API_KEY: "", GOOGLE_MAPS_API_KEY: "" });
    expect(config.geminiApiKey).toBeUndefined();
    expect(config.mapsApiKey).toBeUndefined();
  });

  it("passes through provided keys and model override", () => {
    const config = parseEnv({
      GEMINI_API_KEY: "test-gemini-key",
      GEMINI_MODEL: "gemini-custom",
      MOCK_MODE: "true",
    });
    expect(config.geminiApiKey).toBe("test-gemini-key");
    expect(config.geminiModel).toBe("gemini-custom");
    expect(config.mockMode).toBe(true);
  });

  it("rejects invalid MOCK_MODE values and names the variable without its value", () => {
    expect(() => parseEnv({ MOCK_MODE: "yes-please" })).toThrow(/MOCK_MODE/);
    expect(() => parseEnv({ MOCK_MODE: "yes-please" })).not.toThrow(/yes-please/);
  });

  it("rejects invalid NODE_ENV", () => {
    expect(() => parseEnv({ NODE_ENV: "staging" })).toThrow(/NODE_ENV/);
  });

  it("returns a frozen object", () => {
    const config = parseEnv({});
    expect(Object.isFrozen(config)).toBe(true);
  });
});

describe("isServiceMocked", () => {
  it("mocks every service when MOCK_MODE=true even if keys exist", () => {
    const config = parseEnv({
      MOCK_MODE: "true",
      GEMINI_API_KEY: "k",
      GOOGLE_MAPS_API_KEY: "k",
      GOOGLE_SEARCH_API_KEY: "k",
      GOOGLE_SEARCH_CX: "cx",
    });
    expect(isServiceMocked(config, "gemini")).toBe(true);
    expect(isServiceMocked(config, "maps")).toBe(true);
    expect(isServiceMocked(config, "search")).toBe(true);
  });

  it("mocks only the services whose keys are missing", () => {
    const config = parseEnv({ GEMINI_API_KEY: "k" });
    expect(isServiceMocked(config, "gemini")).toBe(false);
    expect(isServiceMocked(config, "maps")).toBe(true);
    expect(isServiceMocked(config, "search")).toBe(true);
  });

  it("requires both API key and CX for live search", () => {
    const config = parseEnv({ GOOGLE_SEARCH_API_KEY: "k" });
    expect(isServiceMocked(config, "search")).toBe(true);
    const complete = parseEnv({ GOOGLE_SEARCH_API_KEY: "k", GOOGLE_SEARCH_CX: "cx" });
    expect(isServiceMocked(complete, "search")).toBe(false);
  });
});
