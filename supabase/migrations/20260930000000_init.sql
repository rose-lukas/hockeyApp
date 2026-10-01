-- Saturday Hockey Manager — initial schema.
-- Rules live here (AD-4). Clients get SELECT only; every write is an api.* SECURITY DEFINER function (AD-7).

create schema if not exists api;
create schema if not exists private;

-- ───────────────────────────── Tables ─────────────────────────────

create domain public.payment_status as text
  check (value in ('pending', 'paid', 'not_paid', 'waived'));

create table public.season (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (char_length(name) between 1 and 60),
  season_price_cents integer not null check (season_price_cents >= 0),
  night_price_cents  integer not null check (night_price_cents >= 0),
  etransfer_email    text not null default '' check (char_length(etransfer_email) <= 120),
  payment_note       text not null default '' check (char_length(payment_note) <= 500),
  is_current         boolean not null default false,
  created_at         timestamptz not null default now()
);
create unique index season_one_current on public.season (is_current) where is_current;

create table public.night (
  id         uuid primary key default gen_random_uuid(),
  season_id  uuid not null references public.season (id) on delete restrict,
  faceoff_at timestamptz not null,
  arena      text not null default '' check (char_length(arena) <= 80),
  note       text not null default '' check (char_length(note) <= 200),
  status     text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  created_at timestamptz not null default now()
);
create index night_season_faceoff on public.night (season_id, faceoff_at);

create table public.player (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 40 and name = btrim(name)),
  name_key   text generated always as (lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))) stored,
  created_at timestamptz not null default now()
);
create unique index player_name_key on public.player (name_key);

create table public.season_pass (
  id           uuid primary key default gen_random_uuid(),
  season_id    uuid not null references public.season (id) on delete restrict,
  player_id    uuid not null references public.player (id) on delete cascade,
  status       public.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  created_at   timestamptz not null default now(),
  unique (season_id, player_id)
);

create table public.night_entry (
  id           uuid primary key default gen_random_uuid(),
  night_id     uuid not null references public.night (id) on delete restrict,
  player_id    uuid not null references public.player (id) on delete cascade,
  status       public.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  created_at   timestamptz not null default now(),
  unique (night_id, player_id)
);
create index night_entry_player on public.night_entry (player_id);

create table public.night_absence (
  night_id   uuid not null references public.night (id) on delete cascade,
  player_id  uuid not null references public.player (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (night_id, player_id)
);

create table public.admin_user (
  user_id uuid primary key
);

create table public.audit_log (
  id     bigint generated always as identity primary key,
  at     timestamptz not null default now(),
  actor  uuid,
  action text not null,
  detail jsonb not null default '{}'
);

-- ─────────────────────── Invariant triggers ───────────────────────

-- AD-4: a season-pass holder never also holds a night entry in that season.
create function private.night_entry_no_pass_holder() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (
    select 1 from public.season_pass sp
    join public.night n on n.season_id = sp.season_id
    where n.id = new.night_id and sp.player_id = new.player_id
  ) then
    raise exception 'Already on every night with a season pass.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger night_entry_no_pass_holder
  before insert or update of night_id, player_id on public.night_entry
  for each row execute function private.night_entry_no_pass_holder();

-- ────────────────────────── Helpers ──────────────────────────

create function private.normalize_name(p text) returns text
language sql immutable set search_path = '' as $$
  select regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g')
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_user where user_id = auth.uid())
$$;

create function private.require_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only.' using errcode = '42501';
  end if;
end $$;

create function private.audit(p_action text, p_detail jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor, action, detail) values (auth.uid(), p_action, p_detail)
$$;

-- Returns the player for a name, creating one if new (AD-6).
create function private.player_for(p_name text) returns public.player
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := private.normalize_name(p_name);
  v_player public.player;
begin
  if char_length(v_name) not between 2 and 40 then
    raise exception 'Names are 2 to 40 characters.' using errcode = '22023';
  end if;
  insert into public.player (name) values (v_name)
    on conflict (name_key) do nothing;
  select * into v_player from public.player where name_key = lower(v_name);
  return v_player;
end $$;

create function private.current_season() returns public.season
language plpgsql stable security definer set search_path = '' as $$
declare v public.season;
begin
  select * into v from public.season where is_current;
  if not found then
    raise exception 'No season is open yet.' using errcode = 'P0002';
  end if;
  return v;
end $$;

-- ─────────────────────── Views (derived, AD-1) ───────────────────────

create view public.v_night_list with (security_invoker = true) as
  select n.id as night_id, p.id as player_id, p.name, 'season'::text as kind,
         sp.id as enrolment_id, sp.status::text as status, sp.amount_cents, sp.created_at
  from public.night n
  join public.season_pass sp on sp.season_id = n.season_id
  join public.player p on p.id = sp.player_id
  where not exists (select 1 from public.night_absence a
                    where a.night_id = n.id and a.player_id = sp.player_id)
    and not exists (select 1 from public.night_entry e
                    where e.night_id = n.id and e.player_id = sp.player_id)
  union all
  select e.night_id, p.id, p.name, 'night'::text,
         e.id, e.status::text, e.amount_cents, e.created_at
  from public.night_entry e
  join public.player p on p.id = e.player_id;

create view public.v_night_summary with (security_invoker = true) as
  select n.id, n.season_id, n.faceoff_at, n.arena, n.note, n.status,
         count(l.player_id)::int as headcount,
         count(l.player_id) filter (where l.status = 'paid')::int as paid_count
  from public.night n
  left join public.v_night_list l on l.night_id = n.id
  group by n.id;

create view public.v_night_absence with (security_invoker = true) as
  select a.night_id, p.id as player_id, p.name
  from public.night_absence a join public.player p on p.id = a.player_id;

create view public.v_pending with (security_invoker = true) as
  select 'season'::text as kind, sp.id as enrolment_id, p.id as player_id, p.name,
         sp.amount_cents, sp.created_at, null::uuid as night_id, null::timestamptz as faceoff_at
  from public.season_pass sp
  join public.season s on s.id = sp.season_id and s.is_current
  join public.player p on p.id = sp.player_id
  where sp.status = 'pending'
  union all
  select 'night', e.id, p.id, p.name, e.amount_cents, e.created_at, n.id, n.faceoff_at
  from public.night_entry e
  join public.night n on n.id = e.night_id
  join public.season s on s.id = n.season_id and s.is_current
  join public.player p on p.id = e.player_id
  where e.status = 'pending';

-- ──────────────────────── Public RPCs (anon) ────────────────────────

create function api.join_season(p_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_season public.season := private.current_season();
  v_player public.player := private.player_for(p_name);
  v_pass public.season_pass;
  v_created boolean := false;
begin
  insert into public.season_pass (season_id, player_id, amount_cents)
    values (v_season.id, v_player.id, v_season.season_price_cents)
    on conflict (season_id, player_id) do nothing
    returning * into v_pass;
  if found then
    v_created := true;
    perform private.audit('join_season', jsonb_build_object('player', v_player.name));
  else
    select * into v_pass from public.season_pass
      where season_id = v_season.id and player_id = v_player.id;
  end if;
  return jsonb_build_object(
    'created', v_created, 'kind', 'season', 'name', v_player.name,
    'status', v_pass.status, 'amount_cents', v_pass.amount_cents,
    'etransfer_email', v_season.etransfer_email, 'payment_note', v_season.payment_note);
end $$;

create function api.join_night(p_name text, p_night_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_season public.season := private.current_season();
  v_night public.night;
  v_player public.player;
  v_entry public.night_entry;
  v_created boolean := false;
begin
  select * into v_night from public.night
    where id = p_night_id and season_id = v_season.id;
  if not found then
    raise exception 'That night is not on the schedule.' using errcode = 'P0002';
  end if;
  if v_night.status <> 'scheduled' then
    raise exception 'That night is cancelled.' using errcode = 'P0001';
  end if;
  if v_night.faceoff_at <= now() then
    raise exception 'Sign-ups for that night are closed. Talk to the organiser.' using errcode = 'P0001';
  end if;

  v_player := private.player_for(p_name);
  if exists (select 1 from public.season_pass
             where season_id = v_season.id and player_id = v_player.id) then
    raise exception 'You have a season pass, so you''re already on every night.' using errcode = 'P0001';
  end if;

  insert into public.night_entry (night_id, player_id, amount_cents)
    values (v_night.id, v_player.id, v_season.night_price_cents)
    on conflict (night_id, player_id) do nothing
    returning * into v_entry;
  if found then
    v_created := true;
    perform private.audit('join_night', jsonb_build_object('player', v_player.name, 'night', v_night.id));
  else
    select * into v_entry from public.night_entry
      where night_id = v_night.id and player_id = v_player.id;
  end if;
  return jsonb_build_object(
    'created', v_created, 'kind', 'night', 'name', v_player.name,
    'status', v_entry.status, 'amount_cents', v_entry.amount_cents, 'faceoff_at', v_night.faceoff_at,
    'etransfer_email', v_season.etransfer_email, 'payment_note', v_season.payment_note);
end $$;

-- ──────────────────────── Admin RPCs ────────────────────────

create function api.set_status(p_kind text, p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if p_kind = 'season' then
    update public.season_pass set status = p_status::public.payment_status where id = p_id;
  elsif p_kind = 'night' then
    update public.night_entry set status = p_status::public.payment_status where id = p_id;
  else
    raise exception 'Unknown kind.' using errcode = '22023';
  end if;
  if not found then raise exception 'Not found.' using errcode = 'P0002'; end if;
  perform private.audit('set_status', jsonb_build_object('kind', p_kind, 'id', p_id, 'status', p_status));
end $$;

create function api.set_amount(p_kind text, p_id uuid, p_amount_cents integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if p_kind = 'season' then
    update public.season_pass set amount_cents = p_amount_cents where id = p_id;
  elsif p_kind = 'night' then
    update public.night_entry set amount_cents = p_amount_cents where id = p_id;
  else
    raise exception 'Unknown kind.' using errcode = '22023';
  end if;
  if not found then raise exception 'Not found.' using errcode = 'P0002'; end if;
  perform private.audit('set_amount', jsonb_build_object('kind', p_kind, 'id', p_id, 'amount_cents', p_amount_cents));
end $$;

-- Admin add bypasses the faceoff cutoff (walk-ups) and restores a removed pass holder.
create function api.admin_add_to_night(p_name text, p_night_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_night public.night;
  v_season public.season;
  v_player public.player;
begin
  perform private.require_admin();
  select * into v_night from public.night where id = p_night_id;
  if not found then raise exception 'Night not found.' using errcode = 'P0002'; end if;
  select * into v_season from public.season where id = v_night.season_id;
  v_player := private.player_for(p_name);

  if exists (select 1 from public.season_pass where season_id = v_season.id and player_id = v_player.id) then
    delete from public.night_absence where night_id = v_night.id and player_id = v_player.id;
  else
    insert into public.night_entry (night_id, player_id, amount_cents)
      values (v_night.id, v_player.id, v_season.night_price_cents)
      on conflict (night_id, player_id) do nothing;
  end if;
  perform private.audit('admin_add_to_night', jsonb_build_object('player', v_player.name, 'night', v_night.id));
end $$;

create function api.admin_add_season_pass(p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_season public.season;
  v_player public.player;
begin
  perform private.require_admin();
  v_season := private.current_season();
  v_player := private.player_for(p_name);
  insert into public.season_pass (season_id, player_id, amount_cents)
    values (v_season.id, v_player.id, v_season.season_price_cents)
    on conflict (season_id, player_id) do nothing;
  perform private.audit('admin_add_season_pass', jsonb_build_object('player', v_player.name));
end $$;

-- AD-5: a pass holder is hidden via night_absence; a single-night entry is deleted.
create function api.remove_from_night(p_night_id uuid, p_player_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.night_entry where night_id = p_night_id and player_id = p_player_id;
  if not found then
    insert into public.night_absence (night_id, player_id)
      select n.id, sp.player_id
      from public.night n
      join public.season_pass sp on sp.season_id = n.season_id
      where n.id = p_night_id and sp.player_id = p_player_id
      on conflict do nothing;
  end if;
  perform private.audit('remove_from_night', jsonb_build_object('night', p_night_id, 'player', p_player_id));
end $$;

create function api.restore_to_night(p_night_id uuid, p_player_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.night_absence where night_id = p_night_id and player_id = p_player_id;
  perform private.audit('restore_to_night', jsonb_build_object('night', p_night_id, 'player', p_player_id));
end $$;

create function api.delete_season_pass(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.season_pass where id = p_id;
  perform private.audit('delete_season_pass', jsonb_build_object('id', p_id));
end $$;

-- Date and time are Toronto wall-clock; Postgres does the DST-correct conversion (AD-10).
create function api.save_night(
  p_id uuid, p_date date, p_time time, p_arena text, p_note text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_at timestamptz := (p_date + p_time) at time zone 'America/Toronto';
  v_id uuid;
begin
  perform private.require_admin();
  if p_id is null then
    insert into public.night (season_id, faceoff_at, arena, note)
      values ((private.current_season()).id, v_at, btrim(coalesce(p_arena, '')), btrim(coalesce(p_note, '')))
      returning id into v_id;
  else
    update public.night
      set faceoff_at = v_at, arena = btrim(coalesce(p_arena, '')), note = btrim(coalesce(p_note, ''))
      where id = p_id
      returning id into v_id;
    if v_id is null then raise exception 'Night not found.' using errcode = 'P0002'; end if;
  end if;
  perform private.audit('save_night', jsonb_build_object('id', v_id, 'faceoff_at', v_at));
  return v_id;
end $$;

create function api.set_night_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.night set status = p_status where id = p_id;
  if not found then raise exception 'Night not found.' using errcode = 'P0002'; end if;
  perform private.audit('set_night_status', jsonb_build_object('id', p_id, 'status', p_status));
end $$;

-- Only a night nobody has paid into can be deleted; otherwise cancel it.
create function api.delete_night(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if exists (select 1 from public.night_entry where night_id = p_id) then
    raise exception 'People have signed up for this night. Cancel it instead.' using errcode = 'P0001';
  end if;
  delete from public.night where id = p_id;
  perform private.audit('delete_night', jsonb_build_object('id', p_id));
end $$;

create function api.rename_player(p_id uuid, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_name text := private.normalize_name(p_name);
begin
  perform private.require_admin();
  update public.player set name = v_name where id = p_id;
  if not found then raise exception 'Player not found.' using errcode = 'P0002'; end if;
  perform private.audit('rename_player', jsonb_build_object('id', p_id, 'name', v_name));
exception when unique_violation then
  raise exception 'Someone is already called that. Merge them instead.' using errcode = '23505';
end $$;

-- Moves everything from p_drop onto p_keep, then deletes p_drop.
create function api.merge_players(p_keep uuid, p_drop uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if p_keep = p_drop then raise exception 'Pick two different players.' using errcode = '22023'; end if;

  if exists (select 1 from public.season_pass a join public.season_pass b using (season_id)
             where a.player_id = p_keep and b.player_id = p_drop)
     or exists (select 1 from public.night_entry a join public.night_entry b using (night_id)
                where a.player_id = p_keep and b.player_id = p_drop) then
    raise exception 'Both have an entry for the same night or season. Remove one first.' using errcode = 'P0001';
  end if;

  update public.season_pass set player_id = p_keep where player_id = p_drop;
  -- Entries in a season where the kept player now holds a pass would double-enrol (AD-4).
  delete from public.night_entry e using public.night n, public.season_pass sp
    where e.player_id = p_drop and n.id = e.night_id
      and sp.season_id = n.season_id and sp.player_id = p_keep
      and e.status in ('pending', 'not_paid');
  update public.night_entry set player_id = p_keep where player_id = p_drop;
  insert into public.night_absence (night_id, player_id)
    select night_id, p_keep from public.night_absence where player_id = p_drop
    on conflict do nothing;
  delete from public.player where id = p_drop;
  perform private.audit('merge_players', jsonb_build_object('keep', p_keep, 'drop', p_drop));
end $$;

create function api.delete_player(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.player where id = p_id;
  perform private.audit('delete_player', jsonb_build_object('id', p_id));
end $$;

create function api.update_season(
  p_name text, p_season_price_cents integer, p_night_price_cents integer,
  p_etransfer_email text, p_payment_note text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.season set
    name = btrim(p_name),
    season_price_cents = p_season_price_cents,
    night_price_cents = p_night_price_cents,
    etransfer_email = btrim(p_etransfer_email),
    payment_note = btrim(p_payment_note)
  where is_current;
  if not found then raise exception 'No season is open yet.' using errcode = 'P0002'; end if;
  perform private.audit('update_season', jsonb_build_object('name', p_name,
    'season_price_cents', p_season_price_cents, 'night_price_cents', p_night_price_cents));
end $$;

-- Closes the current season (its passes and nights stay as history) and opens a new one.
create function api.start_season(
  p_name text, p_season_price_cents integer, p_night_price_cents integer,
  p_etransfer_email text, p_payment_note text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.require_admin();
  update public.season set is_current = false where is_current;
  insert into public.season (name, season_price_cents, night_price_cents, etransfer_email, payment_note, is_current)
    values (btrim(p_name), p_season_price_cents, p_night_price_cents,
            btrim(p_etransfer_email), btrim(p_payment_note), true)
    returning id into v_id;
  perform private.audit('start_season', jsonb_build_object('id', v_id, 'name', p_name));
  return v_id;
end $$;

-- ───────────────────────── Grants & RLS ─────────────────────────

alter table public.season        enable row level security;
alter table public.night         enable row level security;
alter table public.player        enable row level security;
alter table public.season_pass   enable row level security;
alter table public.night_entry   enable row level security;
alter table public.night_absence enable row level security;
alter table public.admin_user    enable row level security;
alter table public.audit_log     enable row level security;

create policy public_read on public.season        for select to anon, authenticated using (true);
create policy public_read on public.night         for select to anon, authenticated using (true);
create policy public_read on public.player        for select to anon, authenticated using (true);
create policy public_read on public.season_pass   for select to anon, authenticated using (true);
create policy public_read on public.night_entry   for select to anon, authenticated using (true);
create policy public_read on public.night_absence for select to anon, authenticated using (true);
create policy admin_read  on public.audit_log     for select to authenticated using (public.is_admin());

-- AD-7: no client role may write a table directly, now or in future migrations.
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon, authenticated;
revoke all on public.admin_user from anon, authenticated;

revoke all on schema private from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

grant usage on schema api to anon, authenticated;
revoke execute on all functions in schema api from public;
grant execute on function api.join_season(text)      to anon, authenticated;
grant execute on function api.join_night(text, uuid) to anon, authenticated;
grant execute on all functions in schema api to authenticated;
