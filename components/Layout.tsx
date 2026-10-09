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

export function Page({ children, edgeToEdge = false }: { readonly children: React.ReactNode; readonly edgeToEdge?: boolean }) {
  return (
    <main className={`mx-auto flex min-h-dvh w-full max-w-[560px] flex-col gap-7 pb-32 ${edgeToEdge ? "pt-0 [&_.rounded-xl]:rounded-none [&_.rounded-2xl]:rounded-none [&_.rounded-lg:not(button)]:rounded-none" : "px-4 pt-20"}`}>
      {children}
      <footer className={`mt-auto pt-2 text-center text-xs text-muted ${edgeToEdge ? "px-4" : ""}`}>Built by Lukas Rose.</footer>
    </main>
  );
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

export function SectionLabel({ children, primary = false }: { children: React.ReactNode; primary?: boolean }) {
  return (
    <h2 className={`mb-2 font-bold uppercase tracking-wider text-muted ${primary ? "text-xl" : "text-base"}`}>
      {children}
    </h2>
  );
}
