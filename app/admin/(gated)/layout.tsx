import { redirect } from "next/navigation";
import { logout } from "@/app/actions/admin";
import { AdminBar } from "@/components/Admin";
import { getCurrentSeason } from "@/lib/queries";
import { supabaseServer } from "@/lib/supabase";

export const metadata = { robots: { index: false } };

// A convenience gate only. Every admin write is re-checked by is_admin() in Postgres.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 p-6">
        <p>This account isn&apos;t the organiser.</p>
        <form action={logout}><button className="font-semibold text-accent">Log out</button></form>
      </main>
    );
  }

  const season = await getCurrentSeason();
  return (
    <>
      <AdminBar season={season?.name} />
      <main className="mx-auto flex max-w-[560px] flex-col gap-6 px-4 pt-5 pb-16">{children}</main>
    </>
  );
}
