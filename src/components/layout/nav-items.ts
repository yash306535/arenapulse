/** Primary navigation configuration: route → dictionary key. Shared by the header. */
import type { Dictionary } from "@/i18n";

/** A single primary-nav entry. */
export interface NavItem {
  readonly href: string;
  readonly key: keyof Dictionary["nav"];
}

/** All feature routes, in presentation order. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", key: "home" },
  { href: "/assistant", key: "assistant" },
  { href: "/navigation", key: "navigation" },
  { href: "/crowd", key: "crowd" },
  { href: "/access", key: "access" },
  { href: "/transit", key: "transit" },
  { href: "/sustainability", key: "sustainability" },
  { href: "/ops", key: "ops" },
];
