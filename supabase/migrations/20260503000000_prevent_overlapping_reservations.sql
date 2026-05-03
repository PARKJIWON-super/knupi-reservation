-- Prevent two users from reserving the same piano during overlapping time ranges.
--
-- Why this is needed:
-- Client-side "check then insert" logic can still allow duplicates when two browsers
-- submit at almost the same time. This exclusion constraint is enforced atomically by
-- PostgreSQL, so only one overlapping reservation can be inserted.

create extension if not exists btree_gist;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservations_valid_time_range'
      and conrelid = 'public.reservations'::regclass
  ) then
    alter table public.reservations
      add constraint reservations_valid_time_range
      check (start_time < end_time);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'no_overlapping_reservations'
      and conrelid = 'public.reservations'::regclass
  ) then
    alter table public.reservations
      add constraint no_overlapping_reservations
      exclude using gist (
        piano_name with =,
        data with =,
        numrange(start_time::numeric, end_time::numeric, '[)') with &&
      );
  end if;
end $$;
