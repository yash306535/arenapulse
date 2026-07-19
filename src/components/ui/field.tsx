/**
 * Accessible, labeled form-field primitives shared by the feature forms. Each
 * pairs a `<label htmlFor>` with its control so screen readers announce a name,
 * and each exposes a typed `onValueChange` so callers avoid ad-hoc casts. The
 * single, safe narrowing lives here (a select's value is always one of its
 * option values) instead of being scattered across every form.
 */
"use client";

import { useId, type ReactNode } from "react";

const CONTROL_CLASS =
  "min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800";

/** One `<option>` for {@link LabeledSelect}. */
export interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** A labeled `<select>` with a typed change handler over a string-union `T`. */
export function LabeledSelect<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly SelectOption<T>[];
  readonly onValueChange: (value: T) => void;
}): React.JSX.Element {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          // A select's value is always one of the provided option values.
          onValueChange(event.target.value as T);
        }}
        className={CONTROL_CLASS}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** A labeled single-line text input. */
export function LabeledInput({
  label,
  value,
  onValueChange,
  type = "text",
  maxLength,
  min,
  max,
}: {
  readonly label: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly type?: "text" | "number";
  readonly maxLength?: number;
  readonly min?: number;
  readonly max?: number;
}): React.JSX.Element {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        min={min}
        max={max}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        className={CONTROL_CLASS}
      />
    </div>
  );
}

/** A labeled multi-line textarea. */
export function LabeledTextarea({
  label,
  value,
  onValueChange,
  rows = 4,
  maxLength,
}: {
  readonly label: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly rows?: number;
  readonly maxLength?: number;
}): React.JSX.Element {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
      />
    </div>
  );
}

/** A labeled checkbox with the label text to the right of the box. */
export function LabeledCheckbox({
  label,
  checked,
  onCheckedChange,
  className,
}: {
  readonly label: ReactNode;
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly className?: string;
}): React.JSX.Element {
  return (
    <label className={`flex items-center gap-2 text-sm font-medium ${className ?? ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onCheckedChange(event.target.checked);
        }}
        className="h-5 w-5"
      />
      {label}
    </label>
  );
}
