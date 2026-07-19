/** Joins truthy class name fragments into a single string. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter((value): value is string => Boolean(value)).join(" ");
}
