-- Piggy Bank: tracks rink costs so everyone can see money in vs money committed to booked nights.
alter table public.season
  add column default_rink_cost_cents integer not null default 0 check (default_rink_cost_cents >= 0);

alter table public.night
  add column rink_cost_cents integer check (rink_cost_cents is null or rink_cost_cents >= 0);

-- Effective per-night cost: an explicit override, else the season default.
create or replace view public.v_night_summary with (security_invoker = true) as
  select n.id, n.season_id, n.faceoff_at, n.arena, n.note, n.status,
         count(l.player_id)::int as headcount,
         count(l.player_id) filter (where l.status = 'paid')::int as paid_count,
         n.booking_status,
         coalesce(n.rink_cost_cents, (select s.default_rink_cost_cents from public.season s where s.id = n.season_id)) as rink_cost_cents
  from public.night n
  left join public.v_night_list l on l.night_id = n.id
  group by n.id;

-- Public money overview for the current season: only booked nights cost money, only paid entries count as money in.
create view public.v_piggy_bank with (security_invoker = true) as
  select
    s.id as season_id,
    coalesce((select sum(sp.amount_cents) from public.season_pass sp
              where sp.season_id = s.id and sp.status = 'paid'), 0)::int
      + coalesce((select sum(e.amount_cents) from public.night_entry e
                  join public.night n on n.id = e.night_id
                  where n.season_id = s.id and e.status = 'paid'), 0)::int as money_in_cents,
    coalesce((select sum(coalesce(n.rink_cost_cents, s.default_rink_cost_cents))
              from public.night n
              where n.season_id = s.id and n.booking_status = 'booked'), 0)::int as booked_cost_cents,
    (select count(*) from public.night n
     where n.season_id = s.id and n.booking_status = 'booked')::int as booked_night_count,
    s.default_rink_cost_cents,
    (select count(*) from public.season_pass sp
     where sp.season_id = s.id and sp.status = 'paid')::int as season_payer_count,
    (select count(*) from public.night_entry e join public.night n on n.id = e.night_id
     where n.season_id = s.id and e.status = 'paid')::int as night_payer_count
  from public.season s
  where s.is_current;

drop function api.save_night(uuid, date, time, text, text);
create function api.save_night(
  p_id uuid, p_date date, p_time time, p_arena text, p_note text, p_rink_cost_cents integer default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_at timestamptz := (p_date + p_time) at time zone 'America/Toronto';
  v_id uuid;
begin
  perform private.require_admin();
  if p_id is null then
    insert into public.night (season_id, faceoff_at, arena, note, rink_cost_cents)
      values ((private.current_season()).id, v_at, btrim(coalesce(p_arena, '')), btrim(coalesce(p_note, '')), p_rink_cost_cents)
      returning id into v_id;
  else
    update public.night
      set faceoff_at = v_at, arena = btrim(coalesce(p_arena, '')), note = btrim(coalesce(p_note, '')),
          rink_cost_cents = p_rink_cost_cents
      where id = p_id
      returning id into v_id;
    if v_id is null then raise exception 'Night not found.' using errcode = 'P0002'; end if;
  end if;
  perform private.audit('save_night', jsonb_build_object('id', v_id, 'faceoff_at', v_at));
  return v_id;
end $$;
revoke execute on function api.save_night(uuid, date, time, text, text, integer) from public;
grant execute on function api.save_night(uuid, date, time, text, text, integer) to authenticated;

drop function api.update_season(text, integer, integer, text, text);
create function api.update_season(
  p_name text, p_season_price_cents integer, p_night_price_cents integer,
  p_etransfer_email text, p_payment_note text, p_default_rink_cost_cents integer default 0
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.season set
    name = btrim(p_name),
    season_price_cents = p_season_price_cents,
    night_price_cents = p_night_price_cents,
    etransfer_email = btrim(p_etransfer_email),
    payment_note = btrim(p_payment_note),
    default_rink_cost_cents = p_default_rink_cost_cents
  where is_current;
  if not found then raise exception 'No season is open yet.' using errcode = 'P0002'; end if;
  perform private.audit('update_season', jsonb_build_object('name', p_name,
    'season_price_cents', p_season_price_cents, 'night_price_cents', p_night_price_cents));
end $$;
revoke execute on function api.update_season(text, integer, integer, text, text, integer) from public;
grant execute on function api.update_season(text, integer, integer, text, text, integer) to authenticated;

drop function api.start_season(text, integer, integer, text, text);
create function api.start_season(
  p_name text, p_season_price_cents integer, p_night_price_cents integer,
  p_etransfer_email text, p_payment_note text, p_default_rink_cost_cents integer default 0
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.require_admin();
  update public.season set is_current = false where is_current;
  insert into public.season (name, season_price_cents, night_price_cents, etransfer_email, payment_note, default_rink_cost_cents, is_current)
    values (btrim(p_name), p_season_price_cents, p_night_price_cents,
            btrim(p_etransfer_email), btrim(p_payment_note), p_default_rink_cost_cents, true)
    returning id into v_id;
  perform private.audit('start_season', jsonb_build_object('id', v_id, 'name', p_name));
  return v_id;
end $$;
revoke execute on function api.start_season(text, integer, integer, text, text, integer) from public;
grant execute on function api.start_season(text, integer, integer, text, text, integer) to authenticated;
