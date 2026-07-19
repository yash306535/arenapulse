/**
 * Level-aware logger. The single sanctioned place for console output —
 * `no-console` is enforced everywhere else via ESLint. Silent under test.
 * Never pass secrets or raw upstream error bodies as context; callers log
 * error *codes* and safe metadata only.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Resolves the minimum level that should be emitted for the current runtime. */
function minimumLevel(): number {
  if (process.env.VITEST !== undefined || process.env.NODE_ENV === "test") {
    return Number.POSITIVE_INFINITY;
  }
  return process.env.NODE_ENV === "production" ? LEVEL_ORDER.info : LEVEL_ORDER.debug;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < minimumLevel()) {
    return;
  }
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
  const method = level === "debug" ? "info" : level;
  if (context === undefined) {
    console[method](line);
  } else {
    console[method](line, context);
  }
}

export const logger = {
  /** Verbose diagnostics, development only. */
  debug: (message: string, context?: Record<string, unknown>): void => {
    emit("debug", message, context);
  },
  /** Routine operational events. */
  info: (message: string, context?: Record<string, unknown>): void => {
    emit("info", message, context);
  },
  /** Recoverable problems worth surfacing. */
  warn: (message: string, context?: Record<string, unknown>): void => {
    emit("warn", message, context);
  },
  /** Failures; context must never contain key material or client PII. */
  error: (message: string, context?: Record<string, unknown>): void => {
    emit("error", message, context);
  },
};
