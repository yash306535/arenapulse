/**
 * UI dictionary registry. Maps each supported UI language to its dictionary
 * and exposes a typed lookup used by the app context provider.
 */
import type { Dictionary } from "./dictionary";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";

import type { UiLanguage } from "@/schemas/common";

const DICTIONARIES: Record<UiLanguage, Dictionary> = { en, es, fr };

/** Returns the dictionary for a UI language. */
export function getDictionary(language: UiLanguage): Dictionary {
  return DICTIONARIES[language];
}

export type { Dictionary } from "./dictionary";
