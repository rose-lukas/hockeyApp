-- Tracks whether ice time is actually reserved with the arena, separate from scheduled/cancelled.
alter table public.night
  add column booking_status text not null default 'planned'
    check (booking_status in ('planned', 'booked'));

create or replace view public.v_night_summary with (security_invoker = true) as
  select n.id, n.season_id, n.faceoff_at, n.arena, n.note, n.status,
         count(l.player_id)::int as headcount,
         count(l.player_id) filter (where l.status = 'paid')::int as paid_count,
         n.booking_status
  from public.night n
  left join public.v_night_list l on l.night_id = n.id
  group by n.id;

create function api.set_night_booking_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.night set booking_status = p_status where id = p_id;
  if not found then raise exception 'Night not found.' using errcode = 'P0002'; end if;
  perform private.audit('set_night_booking_status', jsonb_build_object('id', p_id, 'status', p_status));
end $$;

revoke execute on function api.set_night_booking_status(uuid, text) from public;
grant execute on function api.set_night_booking_status(uuid, text) to authenticated;
