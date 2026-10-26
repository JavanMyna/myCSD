**Title:** Merge whenCSD events page into myCSD with Google sign-in sync for "registered" ticks

## Summary
Move the single-file whenCSD events dashboard (`index.html` from JavanMyna/whenCSD) into this repo as `events.html`. Signed-in users should have their "registered" ticks saved to Supabase so they follow the account across devices, instead of living only in `localStorage`.

## Tasks

### Setup
- [x] Copy whenCSD `index.html` to `events.html`. Do **not** overwrite the existing `index.html`.
- [x] Add an "Events" link in `menu.html`.

### Database
- [x] Run in the Supabase SQL Editor:

```sql
create table public.event_registrations (
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  event_id text not null check (char_length(event_id) between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.event_registrations enable row level security;

create policy "read own" on public.event_registrations
  for select using (auth.uid() = user_id);
create policy "insert own" on public.event_registrations
  for insert with check (auth.uid() = user_id);
create policy "delete own" on public.event_registrations
  for delete using (auth.uid() = user_id);
```
- [x] Add the same SQL to `supabase/schema.sql` so the repo matches the live DB.

### Code
- [x] Create `js/event-registrations.js` (same style as `activity-data.js`, no `user_id` sent from the browser):
  - `loadRegistered()` returns a Set of `event_id`
  - `setRegistered(id, true)` inserts a row
  - `setRegistered(id, false)` deletes the row
  - `addRegistered(ids)` and `removeRegistered(ids)` batch the same work into one call each
- [x] In `events.html`, load `config.js` and `auth.js`, and replace the `localStorage` read/write of registered ticks with the functions above.
- [x] Guest mode: keep using `localStorage` when signed out. On first sign-in, upload local ticks to Supabase (same migration pattern as `settings-store.js`).
- [x] Add a sign-in/sign-out control, make the settings copy follow whether ticks are stored in this browser or the account, and word the guest copy as moving ticks to the account on sign-in.
- [x] Add registrations to the JSON export in `js/export-data.js` (version 4; import accepts it).

### Docs and legal
- [x] `privacy.html`: mention that registered events are stored per account.
- [x] README: note that Events needs the local `http.server` for sign-in, like the rest of the app.

## Things to watch
- **Stable event IDs:** each event in the data block needs an ID that never changes (e.g. slug of title + first date). If IDs shift when the data is rebuilt from a new chat export, saved ticks become orphaned.
- **Old URL:** `javanmyna.github.io/whenCSD` will keep serving the old standalone version. Either leave it or replace its `index.html` with a redirect to `mycsd.javanmyna.fyi/events.html`.
- **Offline use:** the standalone whenCSD works by double-click; the merged page will need sign-in served over http for the sync to work.

## Acceptance criteria
- A signed-in user ticks an event, reloads, and it's still ticked.
- The same account on another browser shows the same ticks.
- A second Google account cannot see the first account's ticks.
- A signed-out user can still tick events (stored locally), and those ticks upload on first sign-in.
- Unticking removes the row.