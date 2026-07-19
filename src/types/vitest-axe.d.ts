import "vitest";

declare module "vitest" {
  interface Assertion<T> {
    /** Asserts that an axe accessibility scan produced zero violations. */
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
