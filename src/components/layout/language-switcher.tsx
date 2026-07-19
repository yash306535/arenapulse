/** Header control that switches the UI language (also updates `<html lang>`). */
"use client";

import { useId } from "react";

import { useAppContext } from "@/i18n/app-context";
import { UI_LANGUAGES, type UiLanguage } from "@/schemas/common";

const LANGUAGE_NAMES: Record<UiLanguage, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};

/** A labeled select bound to the UI language in app context. */
export function LanguageSwitcher(): React.JSX.Element {
  const { uiLanguage, setUiLanguage, t } = useAppContext();
  const selectId = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
        {t.languages.label}
      </label>
      <select
        id={selectId}
        value={uiLanguage}
        onChange={(event) => {
          setUiLanguage(event.target.value as UiLanguage);
        }}
        className="min-h-11 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
      >
        {UI_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {LANGUAGE_NAMES[language]}
          </option>
        ))}
      </select>
    </div>
  );
}
