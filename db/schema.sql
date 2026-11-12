-- =====================================================================
-- Anvayu Test Tracker: database schema (plain PostgreSQL / Vercel Postgres)
-- Applied automatically by:  npm run db:setup
-- Safe to run more than once.
-- =====================================================================

-- ---------- Users -----------------------------------------------------------
-- Only @anvayuone.com addresses can ever be stored (enforced by the DB itself).
create table if not exists users (
  id                uuid primary key default gen_random_uuid(),
  email             text not null unique
                    check (email = lower(email) and email like '%@anvayuone.com'),
  full_name         text not null check (char_length(full_name) between 1 and 120),
  password_hash     text not null,
  role              text not null default 'tester'
                    check (role in ('admin', 'lead', 'tester', 'developer')),
  email_verified_at timestamptz,
  session_version   int  not null default 1,   -- bump to sign the user out everywhere
  created_at        timestamptz not null default now()
);

-- Email verification + password reset tokens (only a SHA-256 hash is stored).
create table if not exists auth_tokens (
  token_hash  text primary key,
  user_id     uuid not null references users (id) on delete cascade,
  purpose     text not null check (purpose in ('verify', 'reset')),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists auth_tokens_user_idx on auth_tokens (user_id, purpose);

-- Used to rate-limit sign-in attempts (brute-force protection).
create table if not exists login_attempts (
  id       bigint generated always as identity primary key,
  email    text not null,
  ip       text,
  success  boolean not null,
  at       timestamptz not null default now()
);
create index if not exists login_attempts_email_idx on login_attempts (email, at desc);
create index if not exists login_attempts_ip_idx on login_attempts (ip, at desc);

-- ---------- Modules (one per page / area of the app under test) --------------
create table if not exists modules (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- Test cases ------------------------------------------------------
create table if not exists test_cases (
  id              uuid primary key default gen_random_uuid(),
  case_code       text not null unique,
  module_id       uuid not null references modules (id) on delete cascade,
  title           text not null,
  category        text not null default 'Functional'
                  check (category in ('Functional','Validation','UI','Navigation','Negative','Security','End-to-End','Data Accuracy','AI Behaviour')),
  priority        text not null default 'Medium' check (priority in ('High','Medium','Low')),
  preconditions   text,
  steps           jsonb not null default '[]'::jsonb,
  expected_result text,
  test_data       text,
  status          text not null default 'not_started'
                  check (status in ('not_started','in_progress','passed','failed','blocked','skipped')),
  assigned_to     uuid references users (id) on delete set null,
  updated_by      uuid references users (id) on delete set null,
  updated_at      timestamptz,
  created_by      uuid references users (id) on delete set null,
  created_at      timestamptz not null default now(),
  sort_order      int not null default 0
);
create index if not exists test_cases_module_idx on test_cases (module_id);
create index if not exists test_cases_status_idx on test_cases (status);

-- ---------- Notes -----------------------------------------------------------
create table if not exists test_notes (
  id            uuid primary key default gen_random_uuid(),
  test_case_id  uuid not null references test_cases (id) on delete cascade,
  author_id     uuid not null references users (id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 5000),
  created_at    timestamptz not null default now()
);
create index if not exists test_notes_case_idx on test_notes (test_case_id);

-- ---------- Status history (audit trail) ------------------------------------
create table if not exists status_history (
  id            bigint generated always as identity primary key,
  test_case_id  uuid not null references test_cases (id) on delete cascade,
  old_status    text,
  new_status    text not null,
  changed_by    uuid references users (id) on delete set null,
  changed_at    timestamptz not null default now()
);
create index if not exists status_history_case_idx on status_history (test_case_id);
create index if not exists status_history_time_idx on status_history (changed_at desc);
