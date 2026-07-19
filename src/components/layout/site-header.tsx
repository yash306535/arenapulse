/** App header: brand, primary navigation, role switcher, and language switcher. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "./language-switcher";
import { NAV_ITEMS } from "./nav-items";
import { RoleSwitcher } from "./role-switcher";

import { cn } from "@/components/ui/cn";
import { useAppContext } from "@/i18n/app-context";

/** Renders the site header with landmark `header` and `nav` regions. */
export function SiteHeader(): React.JSX.Element {
  const { t } = useAppContext();
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
            {t.app.name}
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <RoleSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
        <nav aria-label={t.nav.label}>
          <ul className="flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-md px-3 py-1 text-sm font-medium",
                      active
                        ? "bg-emerald-700 text-white"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                    )}
                  >
                    {t.nav[item.key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
