import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function PublicHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="bg-chrome text-action-text">
      <div className="mx-auto flex max-w-[560px] items-center justify-between px-4 py-2">
        <Link href="/" className="font-display text-[15px] font-extrabold uppercase tracking-wider">
          Saturday Night Hockey App
          {subtitle && <span className="ml-2 font-normal normal-case opacity-70">· {subtitle}</span>}
        </Link>
        <div className="flex items-center">
          <Link
            href="/admin"
            aria-label="Admin"
            className="grid size-11 place-items-center rounded-full text-lg"
          >
            <span aria-hidden>⚙</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex max-w-[560px] flex-col gap-7 px-4 pt-5 pb-32">{children}</main>;
}

export function StickyAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(11,18,32,0.08)] backdrop-blur">
      <Link
        href={href}
        className="mx-auto flex min-h-14 max-w-[560px] items-center justify-center rounded-xl bg-action font-display text-lg font-bold text-action-text"
      >
        {children}
      </Link>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-muted">{children}</h2>;
}
