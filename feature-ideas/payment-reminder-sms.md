# Payment Reminder SMS

**Status:** Idea, not implemented
**Estimate:** Moderate; roughly 2–4 engineering days once an SMS provider and sender are ready. Provider/carrier registration may take longer and is outside the coding estimate.

## Summary

Collect a player's mobile number during registration and let the organiser send a one-off payment reminder from the admin **Waiting on payment** page. The reminder should include the amount owed and the existing e-transfer instructions. SMS is the assumed channel for this proposal; confirm before implementation.

## Current State

- The public form collects a name and either a season pass or a night entry.
- `join_season` and `join_night` create enrolments through public RPCs. Both resolve a player by normalized name (`name_key`); players do not sign in.
- `player` has no phone field. The admin pending view contains names and enrolment details, and the admin page has no messaging action.
- Writes are expected to go through `api` RPCs. The app uses the Supabase anon key, not `service_role`.

Relevant code: `app/join/JoinForm.tsx`, `app/actions/public.ts`, `lib/schemas.ts`, `supabase/migrations/20260930000000_init.sql`, `lib/queries.ts`, and `app/admin/(gated)/page.tsx`.

## Proposed User Flow

1. A player enters their name, phone number, and registration choice. Phone is required for new registrations. They separately agree to receive payment-reminder texts; agreement is not pre-checked.
2. The app validates the number and stores it in normalized E.164 form.
3. On an enrolment with `pending` or `not_paid` status, the organiser can choose **Send reminder**. The action is unavailable if the number is missing, the player has opted out, or the enrolment is already paid or waived.
4. The server sends a transactional reminder through the chosen provider and reports success or a useful failure to the organiser. A successful send is recorded to prevent accidental repeat messages.
5. The recipient can opt out using the provider's supported mechanism, such as replying `STOP`; future reminders are suppressed.

## Implementation Work

### 1. Player data and migration

- Add nullable `phone_e164`, `sms_consent_at`, and `sms_opted_out_at` fields to `public.player` in a new migration. Keep phone nullable for existing rows until the organiser backfills them.
- Add an admin-only way to view, add, and correct existing player numbers. Do not expose phone data through public player/night-list views.
- Define how phone numbers are handled when duplicate players are merged. Preserve the number and consent state only when the merge is unambiguous; otherwise require organiser review.

### 2. Registration

- Add a required telephone input and an unchecked consent control to `JoinForm`.
- Validate and normalize input server-side in the Zod schema. Store E.164, not presentation-formatted input.
- Pass phone and consent through `joinAction` to both join RPCs and the player-resolution logic. Update the database rule tests for new players, existing players, and idempotent repeat joins.
- **Identity safeguard:** name matching is not proof of identity. A public repeat registration must not be able to replace a saved phone number just by entering the same name. For the first version, either have the organiser manage corrections or add phone verification before allowing self-service changes. This is a product decision, not just a validation detail.

### 3. Reminder action and provider

- Add the player's phone to the admin-only pending data path without adding it to any public view.
- Add a **Send reminder** control to each eligible pending card, with a confirmation step and disabled/loading/success/error states.
- Implement a server-only action that re-checks the Supabase user and `is_admin()` before sending. Keep provider credentials in server environment variables; never put them in client code or use `service_role` for this feature.
- Choose an SMS provider (for example Twilio or Telnyx), configure an approved sender, and handle provider errors. Do not send directly from the browser.
- Add a minimal notification log with enrolment ID, recipient player ID, actor, provider message ID, timestamp, and delivery/error state. Avoid storing full message bodies unless operationally necessary. Add a cooldown or duplicate-send guard.
- Keep the message informational and limited to payment details; include sender identity and opt-out wording supported by the provider.

### 4. Consent, privacy, and rollout

- Record when and how consent was obtained, and honor opt-outs before every send. Review the consent text and applicable messaging rules for the countries where players receive messages; this is a payment reminder, not marketing consent by assumption.
- Treat phone numbers as personal information: restrict reads to admin paths, minimize logging, and set a retention policy.
- Deploy the database migration before the app code. Configure provider secrets and sender settings in the hosting environment. Backfill existing player numbers before expecting reminders to work for everyone.

## Acceptance Checks

- New registration rejects missing or invalid phone numbers and missing consent.
- Numbers are stored in normalized form; public pages and public RPC responses do not reveal them.
- Re-registering under an existing name does not silently change that player's phone number.
- Only an authenticated admin can request a send; paid, waived, opted-out, or number-less records cannot be messaged.
- The reminder includes the correct player/enrolment amount and payment instructions.
- Provider success and failure are visible in admin, and retries do not create accidental duplicate messages.
- Database tests cover the migration, registration behavior, and access restrictions; app tests cover validation and admin send states.

## Decisions Before Implementation

1. Confirm SMS rather than WhatsApp or another channel.
2. Confirm the supported country/number formats and exact consent copy.
3. Decide how a player can change a saved number: organiser edit (simpler) or verified self-service update (more work).
4. Choose the SMS provider and confirm its sender registration, opt-out handling, and hosting configuration.
5. Decide the reminder wording, cooldown, and whether to retain delivery records indefinitely or for a defined period.
