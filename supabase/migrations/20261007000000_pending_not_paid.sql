create or replace view public.v_pending with (security_invoker = true) as
  select 'season'::text as kind, sp.id as enrolment_id, p.id as player_id, p.name,
         sp.amount_cents, sp.created_at, null::uuid as night_id, null::timestamptz as faceoff_at
  from public.season_pass sp
  join public.season s on s.id = sp.season_id and s.is_current
  join public.player p on p.id = sp.player_id
  where sp.status in ('pending', 'not_paid')
  union all
  select 'night', e.id, p.id, p.name, e.amount_cents, e.created_at, n.id, n.faceoff_at
  from public.night_entry e
  join public.night n on n.id = e.night_id
  join public.season s on s.id = n.season_id and s.is_current
  join public.player p on p.id = e.player_id
  where e.status in ('pending', 'not_paid');