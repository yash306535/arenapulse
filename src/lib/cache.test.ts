import { describe, expect, it } from "vitest";

import { TtlCache } from "./cache";

/** Builds a cache with a manually advanced clock. */
function buildCache(
  ttlMs: number,
  maxEntries: number,
): {
  cache: TtlCache<string>;
  advance: (ms: number) => void;
} {
  let nowMs = 0;
  const cache = new TtlCache<string>(ttlMs, maxEntries, () => nowMs);
  return {
    cache,
    advance: (ms: number) => {
      nowMs += ms;
    },
  };
}

describe("TtlCache", () => {
  it("stores and returns values before expiry", () => {
    const { cache, advance } = buildCache(1000, 10);
    cache.set("k", "v");
    advance(999);
    expect(cache.get("k")).toBe("v");
  });

  it("expires entries after their TTL", () => {
    const { cache, advance } = buildCache(1000, 10);
    cache.set("k", "v");
    advance(1000);
    expect(cache.get("k")).toBeUndefined();
  });

  it("honors per-entry TTL overrides", () => {
    const { cache, advance } = buildCache(1000, 10);
    cache.set("short", "a", 100);
    cache.set("long", "b", 5000);
    advance(200);
    expect(cache.get("short")).toBeUndefined();
    expect(cache.get("long")).toBe("b");
  });

  it("evicts the least recently used entry at capacity", () => {
    const { cache } = buildCache(1000, 2);
    cache.set("a", "1");
    cache.set("b", "2");
    expect(cache.get("a")).toBe("1");
    cache.set("c", "3");
    expect(cache.get("a")).toBe("1");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe("3");
  });

  it("overwrites an existing key without evicting others", () => {
    const { cache } = buildCache(1000, 2);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("a", "1-updated");
    expect(cache.get("a")).toBe("1-updated");
    expect(cache.get("b")).toBe("2");
    expect(cache.size).toBe(2);
  });

  it("clear drops everything", () => {
    const { cache } = buildCache(1000, 10);
    cache.set("a", "1");
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });

  it("rejects non-positive TTL or capacity", () => {
    expect(() => new TtlCache<string>(0)).toThrow(RangeError);
    expect(() => new TtlCache<string>(1000, 0)).toThrow(RangeError);
  });
});
