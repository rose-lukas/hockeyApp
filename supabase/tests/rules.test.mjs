import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIG = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

const db = new PGlite();
const ADMIN = '11111111-1111-1111-1111-111111111111';
const INTRUDER = '22222222-2222-2222-2222-222222222222';
let pass = 0, fail = 0;

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
await db.exec(readdirSync(MIG).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(MIG, f), 'utf8')).join('\n'));
await db.exec(`insert into public.admin_user values ('${ADMIN}')`);

async function as(who) {
  await db.exec('reset role');
  const sub = who === 'anon' ? '' : who === 'admin' ? ADMIN : INTRUDER;
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [sub]);
  await db.exec(`set role ${who === 'anon' ? 'anon' : 'authenticated'}`);
}
const one = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const val = async (sql, p = []) => Object.values(await one(sql, p) ?? {})[0];
function check(label, cond, extra = '') {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${extra ? '  -> ' + extra : ''}`);
}
async function rejects(label, sql, p = []) {
  try { await db.query(sql, p); check(label, false, 'no error'); }
  catch (e) { check(label, true, e.message); }
}

await as('admin');
await val(`select api.start_season('2026-27', 18725, 2000, 'lu@example.com', 'Name in memo')`);
const n1 = await val(`select api.save_night(null, '2026-12-05', '21:00', 'Rink A', '')`);
const n2 = await val(`select api.save_night(null, '2027-03-20', '21:00', 'Rink A', '')`);
const past = await val(`select api.save_night(null, '2020-01-04', '21:00', 'Rink A', '')`);
check('Dec 21:00 Toronto = 02:00 UTC (EST)', (await val(`select to_char(faceoff_at at time zone 'UTC','HH24:MI') from night where id=$1`, [n1])) === '02:00');
check('Mar 20 21:00 Toronto = 01:00 UTC (EDT)', (await val(`select to_char(faceoff_at at time zone 'UTC','HH24:MI') from night where id=$1`, [n2])) === '01:00');

await as('anon');
check('join_season creates pending', (await val(`select api.join_season('  Colton   Flipchuk ') ->> 'status'`)) === 'pending');
check('name normalised', (await val(`select name from player where name_key='colton flipchuk'`)) === 'Colton Flipchuk');
check('night price frozen onto entry', (await val(`select api.join_night('Austin Laurin', $1) ->> 'amount_cents'`, [n1])) === '2000');
check('re-join is idempotent', (await val(`select api.join_night('austin laurin', $1) ->> 'created'`, [n1])) === 'false');
check('case-insensitive name reuse', Number(await val(`select count(*) from player where name_key='austin laurin'`)) === 1);
await rejects('pass holder cannot buy a night', `select api.join_night('COLTON FLIPCHUK', $1)`, [n1]);
await rejects('cannot join a past night', `select api.join_night('Late Guy', $1)`, [past]);
await rejects('name too short', `select api.join_season('x')`);
await rejects('anon cannot insert a table', `insert into public.player(name) values ('Hacker')`);
await rejects('anon cannot update status directly', `update public.night_entry set status='paid'`);
await rejects('anon cannot call admin rpc', `select api.set_status('night', gen_random_uuid(), 'paid')`);
await rejects('anon cannot read admin_user', `select * from public.admin_user`);
await rejects('anon cannot call private fn', `select private.player_for('Sneaky')`);
check('anon sees no audit_log rows', Number(await val(`select count(*) from public.audit_log`)) === 0);

await as('intruder');
await rejects('signed-up non-admin cannot set status', `select api.set_status('night', gen_random_uuid(), 'paid')`);
await rejects('non-admin cannot start a season', `select api.start_season('x', 1, 1, '', '')`);

await as('admin');
const austinEntry = await val(`select enrolment_id from v_night_list where night_id=$1 and name='Austin Laurin'`, [n1]);
await db.query(`select api.set_status('night', $1, 'paid')`, [austinEntry]);
await rejects('invalid status rejected', `select api.set_status('night', $1, 'bogus')`, [austinEntry]);
await as('anon');
check('re-join never downgrades paid', (await val(`select api.join_night('Austin Laurin', $1) ->> 'status'`, [n1])) === 'paid');

await as('admin');
const colton = await val(`select id from player where name_key='colton flipchuk'`);
const list = async (n) => (await db.query(`select name from v_night_list where night_id=$1 order by name`, [n])).rows.map(r => r.name).join(', ');
check('n1 list = pass holder + night entry', (await list(n1)) === 'Austin Laurin, Colton Flipchuk', await list(n1));
await db.query(`select api.remove_from_night($1, $2)`, [n1, colton]);
check('remove pass holder from one night', (await list(n1)) === 'Austin Laurin', await list(n1));
check('other nights unaffected', (await list(n2)) === 'Colton Flipchuk', await list(n2));
await db.query(`select api.admin_add_to_night('colton flipchuk', $1)`, [n1]);
check('admin add restores pass holder', (await list(n1)).includes('Colton'));
check('restore did not create a night charge', Number(await val(`select count(*) from night_entry where player_id=$1`, [colton])) === 0);
await db.query(`select api.admin_add_to_night('Walk Up', $1)`, [past]);
check('admin can add walk-up after faceoff', (await list(past)).includes('Walk Up'));

await db.query(`select api.update_season('2026-27', 20000, 2500, 'lu@example.com', '')`);
check('price change does not rewrite existing pass', Number(await val(`select amount_cents from season_pass where player_id=$1`, [colton])) === 18725);

await as('anon');
await db.query(`select api.join_night('Dave M', $1)`, [n2]);
await as('admin');
await db.query(`select api.admin_add_season_pass('Dave Morrissey')`);
const keep = await val(`select id from player where name='Dave Morrissey'`);
const drop = await val(`select id from player where name='Dave M'`);
await db.query(`select api.merge_players($1, $2)`, [keep, drop]);
check('merge removes duplicate player', Number(await val(`select count(*) from player where name like 'Dave%'`)) === 1);
check('merge drops pending night entry now covered by pass', Number(await val(`select count(*) from night_entry where player_id=$1`, [keep])) === 0);
check('merged player on list once', (await list(n2)).split(', ').filter(n => n.startsWith('Dave')).length === 1, await list(n2));
await rejects('rename into existing name', `select api.rename_player($1, 'Austin Laurin')`, [keep]);
await rejects('delete night with signups', `select api.delete_night($1)`, [n1]);

const s = await one(`select headcount, paid_count from v_night_summary where id=$1`, [n1]);
check('summary counts', s.headcount === 3 && s.paid_count === 1, JSON.stringify(s));
check('pending queue', (await db.query(`select name from v_pending order by name`)).rows.map(r => r.name).join(', ') === 'Colton Flipchuk, Dave Morrissey, Walk Up');
check('audit log written', Number(await val(`select count(*) from audit_log`)) > 10);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
