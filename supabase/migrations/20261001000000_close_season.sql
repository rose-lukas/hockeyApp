-- Lets the admin return to the "no season open" start state without starting a replacement.
-- Existing nights/passes are kept (hidden), matching start_season's no-destructive-delete pattern.
create function api.close_season() returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.season set is_current = false where is_current;
  if not found then raise exception 'No season is open.' using errcode = 'P0002'; end if;
  perform private.audit('close_season', '{}'::jsonb);
end $$;

-- New functions default to PUBLIC execute in Postgres; lock this one down like the rest of api.*.
revoke execute on function api.close_season() from public;
grant execute on function api.close_season() to authenticated;
