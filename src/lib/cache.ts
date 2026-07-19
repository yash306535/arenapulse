/**
 * In-memory TTL cache with LRU eviction. Used to cap repeated upstream calls:
 * search results (5 min), transit plans (2 min), and knowledge-base answers
 * (10 min). The clock is injectable so expiry is unit-testable without timers.
 */
import { CACHE_MAX_ENTRIES } from "@/lib/constants";

interface CacheEntry<V> {
  readonly value: V;
  readonly expiresAtMs: number;
}

/** A bounded key→value cache where entries expire after a per-entry TTL. */
export class TtlCache<V> {
  private readonly entries = new Map<string, CacheEntry<V>>();

  constructor(
    private readonly defaultTtlMs: number,
    private readonly maxEntries: number = CACHE_MAX_ENTRIES,
    private readonly now: () => number = Date.now,
  ) {
    if (defaultTtlMs <= 0 || maxEntries <= 0) {
      throw new RangeError("TtlCache requires positive TTL and capacity");
    }
  }

  /** Returns the cached value, or undefined when absent or expired. */
  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      return undefined;
    }
    if (entry.expiresAtMs <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    // Re-insert to mark as most recently used (Map preserves insertion order).
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  /** Stores a value, evicting the least recently used entry when full. */
  set(key: string, value: V, ttlMs: number = this.defaultTtlMs): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else if (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }
    this.entries.set(key, { value, expiresAtMs: this.now() + ttlMs });
  }

  /** Current number of stored (possibly expired, not yet swept) entries. */
  get size(): number {
    return this.entries.size;
  }

  /** Drops every entry — used by tests and never in request paths. */
  clear(): void {
    this.entries.clear();
  }
}
