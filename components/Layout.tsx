import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function PublicHeader() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between p-3">
      <Link
        href="/admin"
        aria-label="Admin"
        className="pointer-events-auto grid size-11 place-items-center rounded-full bg-surface/80 text-lg shadow-sm backdrop-blur"
      >
        <span aria-hidden>⚙</span>
      </Link>
      <ThemeToggle className="pointer-events-auto bg-surface/80 shadow-sm backdrop-blur" />
    </div>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex max-w-[560px] flex-col gap-7 px-4 pt-20 pb-32">{children}</main>;
}

export function StickyAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto flex h-14 w-fit items-center justify-center rounded-full bg-action px-8 font-display text-lg font-bold text-action-text shadow-lg"
    >
      {children}
    </Link>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-muted">{children}</h2>;
}
