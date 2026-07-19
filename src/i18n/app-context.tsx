/**
 * Client-side application context: the current audience role and UI language.
 * Both persist in the URL query string (?role=&lang=) so a chosen experience
 * survives reloads and is shareable, with no auth or storage. The provider
 * also keeps `<html lang>` in sync with the UI language for accessibility.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getDictionary, type Dictionary } from "./index";

import { ROLES, UI_LANGUAGES, type Role, type UiLanguage } from "@/schemas/common";

interface AppContextValue {
  readonly role: Role;
  readonly setRole: (role: Role) => void;
  readonly uiLanguage: UiLanguage;
  readonly setUiLanguage: (language: UiLanguage) => void;
  readonly t: Dictionary;
}

const AppContext = createContext<AppContextValue | null>(null);

function isMember<T extends string>(values: readonly T[], value: string | null): value is T {
  return value !== null && (values as readonly string[]).includes(value);
}

/** Writes a query param without adding a history entry or reloading. */
function writeParam(key: string, value: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState(null, "", url.toString());
}

/**
 * Provides role/language state to the tree. Initial values default to
 * fan/English for SSR safety, then reconcile from the URL after mount to avoid
 * hydration mismatches.
 */
export function AppProvider({ children }: { readonly children: ReactNode }): React.JSX.Element {
  const [role, setRoleState] = useState<Role>("fan");
  const [uiLanguage, setLanguageState] = useState<UiLanguage>("en");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get("role");
    const urlLang = params.get("lang");
    if (isMember(ROLES, urlRole)) {
      setRoleState(urlRole);
    }
    if (isMember(UI_LANGUAGES, urlLang)) {
      setLanguageState(urlLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    writeParam("role", next);
  }, []);

  const setUiLanguage = useCallback((next: UiLanguage) => {
    setLanguageState(next);
    writeParam("lang", next);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({ role, setRole, uiLanguage, setUiLanguage, t: getDictionary(uiLanguage) }),
    [role, setRole, uiLanguage, setUiLanguage],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** Accesses the app context; throws if used outside {@link AppProvider}. */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
