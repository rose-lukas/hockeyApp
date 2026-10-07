import Link from "next/link";
import { notFound } from "next/navigation";
import { NightHero } from "@/components/NightHero";
import { Page, PublicHeader, SectionLabel, StickyAction } from "@/components/Layout";
import { PlayerList } from "@/components/PlayerList";
import { getCurrentSeason, getNight, getNightList } from "@/lib/queries";

export default async function NightPage({ params }: PageProps<"/night/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [night, season] = await Promise.all([getNight(id), getCurrentSeason()]);
  if (!night) notFound();
  const list = await getNightList(id);
  const open = night.status === "scheduled" && Date.parse(night.faceoff_at) > Date.now() && night.season_id === season?.id;

  return (
    <>
      <PublicHeader />
      <Page>
        <Link href="/" className="-mb-4 min-h-11 self-start py-2 text-sm font-semibold text-accent">
          ← All nights
        </Link>
        <NightHero night={night} label="Game night" />
        <section>
          <SectionLabel>WH&#xF043;&apos;S IN</SectionLabel>
          <PlayerList rows={list} />
        </section>
      </Page>
      {open && <StickyAction href={`/join?night=${night.id}`}>Register for Games</StickyAction>}
    </>
  );
}
