create extension if not exists pgcrypto;

create table if not exists plays (
  id uuid primary key default gen_random_uuid(),
  name text,
  photo_path text,
  started_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists station_results (
  id uuid primary key default gen_random_uuid(),
  play_id uuid references plays(id) on delete cascade,
  station_key text not null,
  payload jsonb not null default '{}',
  created_at timestamptz default now(),
  unique (play_id, station_key)
);
