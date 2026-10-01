"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/errors";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

/** One pattern for every admin write: submit, show pending, show the result message. */
export function ActionForm({
  action,
  children,
  className = "",
  confirm,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  confirm?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={confirm ? (e) => { if (!window.confirm(confirm)) e.preventDefault(); } : undefined}
    >
      {children}
      {state && (
        <p role="status" className={`mt-2 text-sm ${state.ok ? "text-muted" : "text-danger"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

export function Submit({
  children,
  variant = "primary",
  name,
  value,
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "chip";
  name?: string;
  value?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const look = {
    primary: "min-h-12 w-full rounded-xl bg-action px-4 font-display font-bold text-action-text",
    secondary: "min-h-11 rounded-lg border bg-surface px-3 text-sm font-semibold text-accent",
    danger: "min-h-11 rounded-lg border border-danger px-3 text-sm font-semibold text-danger",
    chip: "min-h-11 rounded-lg border bg-surface px-3 text-sm font-semibold",
  }[variant];
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={`${look} disabled:opacity-60 ${className}`}>
      {children}
    </button>
  );
}
