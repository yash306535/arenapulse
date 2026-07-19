/** App footer carrying the tagline and the FIFA non-affiliation disclaimer. */
"use client";

import { useAppContext } from "@/i18n/app-context";

/** Renders the site footer landmark. */
export function SiteFooter(): React.JSX.Element {
  const { t } = useAppContext();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-sm text-slate-600 dark:text-slate-400">
        <p>{t.app.tagline}</p>
        <p className="font-medium">{t.app.nonAffiliation}</p>
      </div>
    </footer>
  );
}
