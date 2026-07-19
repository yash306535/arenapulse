/** Header control that switches the audience role (fan / volunteer / organizer). */
"use client";

import { cn } from "@/components/ui/cn";
import { useAppContext } from "@/i18n/app-context";
import { ROLES, type Role } from "@/schemas/common";

/** A labeled group of toggle buttons reflecting and setting the current role. */
export function RoleSwitcher(): React.JSX.Element {
  const { role, setRole, t } = useAppContext();
  return (
    <div className="flex items-center gap-2" role="group" aria-label={t.roles.label}>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
        {t.roles.label}
      </span>
      <div className="flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-600">
        {ROLES.map((option: Role) => {
          const selected = option === role;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setRole(option);
              }}
              className={cn(
                "min-h-11 px-3 py-1 text-sm font-medium",
                selected
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100",
              )}
            >
              {t.roles[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
