-- Create the activity table. The checks keep entries within the limits you specified.
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id),
  sidang text,
  name text not null check (char_length(name) between 1 and 100),
  points integer not null check (points between 0 and 1000),
  level text not null check (level in ('college', 'club', 'university', 'national')),
  date date,
  created_at timestamptz not null default now()
);

-- Create one settings row per user. Defaults match the starting app settings.
create table if not exists public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id),
  target integer not null default 300,
  dday date not null default date '2027-07-18',
  sidang text not null default '2026/2027',
  message_style text not null default 'motivational'
    check (message_style in ('motivational', 'harsh', 'off')),
  updated_at timestamptz not null default now(),
  constraint settings_target_range_check check (target between 1 and 5000),
  constraint settings_sidang_length_check check (char_length(btrim(sidang)) between 1 and 20)
);

-- Add these checks when the table already exists. The guards make this block safe to run once.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'settings_target_range_check'
      AND conrelid = 'public.settings'::regclass
  ) THEN
    ALTER TABLE public.settings
      ADD CONSTRAINT settings_target_range_check CHECK (target BETWEEN 1 AND 5000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'settings_sidang_length_check'
      AND conrelid = 'public.settings'::regclass
  ) THEN
    ALTER TABLE public.settings
      ADD CONSTRAINT settings_sidang_length_check
      CHECK (char_length(btrim(sidang)) BETWEEN 1 AND 20);
  END IF;
END $$;

-- This index helps load one user's activities for a particular sidang quickly.
create index if not exists activities_user_id_sidang_idx
  on public.activities (user_id, sidang);

-- Enable row security so table permissions alone cannot expose anyone's rows.
alter table public.activities enable row level security;
alter table public.settings enable row level security;

-- Remove ordinary and public table privileges from anonymous visitors. Give
-- signed-in users the basic operations that owner policies limit below.
revoke all on table public.activities, public.settings from anon, public;
grant select, insert, update, delete on table public.activities, public.settings to authenticated;

-- Activity policies let a signed-in user work only with rows owned by that user.
create policy activities_select_own
  on public.activities for select to authenticated
  using (user_id = auth.uid());

create policy activities_insert_own
  on public.activities for insert to authenticated
  with check (user_id = auth.uid());

create policy activities_update_own
  on public.activities for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy activities_delete_own
  on public.activities for delete to authenticated
  using (user_id = auth.uid());

-- Settings policies keep each user's settings private and writable only by them.
create policy settings_select_own
  on public.settings for select to authenticated
  using (user_id = auth.uid());

create policy settings_insert_own
  on public.settings for insert to authenticated
  with check (user_id = auth.uid());

create policy settings_update_own
  on public.settings for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy settings_delete_own
  on public.settings for delete to authenticated
  using (user_id = auth.uid());

-- How to run and check it
-- For the first setup, open SQL Editor, create a new query, paste this whole file,
-- and click Run. This app does not run SQL against your project.
-- For an existing setup, run only the DO block above the activity index to add
-- the two new settings checks. See README.md for the exact block to run.
-- To confirm row security, open Table Editor, select activities, then settings,
-- and check that RLS is enabled for each table.
