# Saturday Hockey

Who's playing, and who's paid. Players join the list for a single night or for the whole season, then
send an e-transfer. Their entry shows as pending until the organiser marks it paid.

Build rules: [ARCHITECTURE-SPINE.md](../_bmad-output/planning-artifacts/architecture/architecture-hockeyApp-2026-09-30/ARCHITECTURE-SPINE.md).

## One-time setup

### 1. Supabase

1. Create a project.
2. Apply the schema. Either run `npx supabase link` then `npx supabase db push`, or paste
   `supabase/migrations/20260930000000_init.sql` into the SQL editor once.
3. **Project Settings → Data API → Exposed schemas**: add `api`. Every write goes through it.
4. **Authentication → Sign In / Providers**: turn off **Allow new users to sign up**. Players never
   log in.
5. **Authentication → Users → Add user**: create your organiser email and password.
6. Make that user the admin. In the SQL editor:

   ```sql
   insert into public.admin_user (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

### 2. Environment

Copy `.env.example` to `.env.local`. Fill both values in from **Project Settings → API**. Use the
**anon** key; never use `service_role`.

### 3. Vercel

Import the repo, set the root directory to `hockeyapp`, and add the same two env vars.

### 4. First run

Log in at `/admin/login`. Then:

1. Go to **Settings** and open the season: prices, e-transfer email.
2. Go to **Nights** and add the nights you've booked.
3. Share the site link in the group chat.

## Pages

| Path | For | |
| --- | --- | --- |
| `/` | everyone | Next night's list, prices, how to pay, schedule |
| `/night/[id]` | everyone | One night's list |
| `/join` | everyone | Get on the list |
| `/admin` | organiser | Everything waiting on payment |
| `/admin/nights` | organiser | Add, edit, and cancel nights; per-night lists |
| `/admin/players` | organiser | Season passes, rename, merge duplicates |
| `/admin/settings` | organiser | Prices, e-transfer details, new season |
| `/planner` | organiser | Season price calculator. Not linked from anywhere; delete `app/planner/` to remove it |

## Development

```bash
npm install
npm run dev       # needs .env.local
npm run test:db   # runs every migration + the rule tests in-process (no Docker, no Supabase)
```
