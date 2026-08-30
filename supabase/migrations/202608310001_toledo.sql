begin;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
-- Administrators are granted only by the project owner, never by a browser signup.
create function public.is_toledo_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.admin_users where user_id=(select auth.uid())); $$;
revoke all on function public.is_toledo_admin() from public;
grant execute on function public.is_toledo_admin() to authenticated;

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at=now(); return new; end $$;
revoke all on function public.set_updated_at() from public;

create table public.activities (
  id text primary key,
  title text not null,
  activity_date date not null,
  evaluation_deadline date not null,
  inherit_transport boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.activities(id,title,activity_date,evaluation_deadline)
values('toledo-2026','Visita a Toledo 2026','2026-10-24','2026-10-28');

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  activity_id text not null references public.activities(id),
  source text not null default 'manual' check(source in ('manual','google_forms','native')),
  source_id text,
  declared_meals integer check(declared_meals between 0 and 100),
  status text not null default 'active' check(status in ('active','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(activity_id,source,source_id)
);
create table public.buses (
  id uuid primary key default gen_random_uuid(),
  activity_id text not null references public.activities(id),
  label text not null check(length(label) between 1 and 100),
  capacity integer check(capacity between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  activity_id text not null references public.activities(id),
  label text not null check(length(label) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(activity_id,label)
);
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  model text not null default '' check(length(model)<=200),
  color text not null default '' check(length(color)<=100),
  plate text not null default '' check(length(plate)<=30),
  original text not null default '' check(length(original)<=1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,registration_id)
);
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 200),
  role text not null check(role in ('Titular','Acompañante')),
  adult boolean not null,
  age integer check(age between 0 and 120),
  transport text check(transport in ('bus','car')),
  bus_id uuid references public.buses(id),
  vehicle_id uuid,
  meal boolean not null default false,
  menu_id uuid references public.menus(id),
  dietary text not null default '' check(length(dietary)<=1000),
  mobility text not null default '' check(length(mobility)<=1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(vehicle_id,registration_id) references public.vehicles(id,registration_id),
  check(age is null or (adult and age>=18) or (not adult and age<18)),
  check(meal or menu_id is null),
  check(bus_id is null or transport='bus'),
  check(vehicle_id is null or transport='car')
);
create unique index one_holder_per_registration on public.participants(registration_id) where role='Titular';
create index participants_registration on public.participants(registration_id);
create index participants_transport on public.participants(transport);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  activity_id text not null references public.activities(id),
  source text not null default 'manual' check(source in ('manual','google_forms','native')),
  source_id text,
  comment text not null default '' check(length(comment)<=6000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(activity_id,source,source_id)
);
-- No participant foreign key: evaluation is intentionally independent of identity.
create table public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  activity_id text not null references public.activities(id),
  label text not null check(length(label) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(activity_id,label)
);
create table public.evaluation_answers (
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  question_id uuid not null references public.survey_questions(id),
  score smallint check(score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(evaluation_id,question_id)
);

-- No tokens/passwords here. Only revocable session identifiers and timestamps.
create table public.admin_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
alter table public.admin_sessions enable row level security;
revoke all on public.admin_sessions from anon,authenticated;
grant select,delete on public.admin_sessions to authenticated;
grant insert(id,user_id) on public.admin_sessions to authenticated;
create policy own_admin_sessions on public.admin_sessions to authenticated
using(user_id=(select auth.uid()) and (select public.is_toledo_admin()))
with check(user_id=(select auth.uid()) and (select public.is_toledo_admin()));
create function public.touch_admin_session(session_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_toledo_admin() then return false; end if;
  update public.admin_sessions set last_seen=now()
    where id=session_id and user_id=(select auth.uid())
      and last_seen>now()-interval '30 minutes' and created_at>now()-interval '8 hours';
  return found;
end $$;
revoke all on function public.touch_admin_session(uuid) from public;
grant execute on function public.touch_admin_session(uuid) to authenticated;

do $$ declare t text; begin
  foreach t in array array['activities','registrations','buses','menus','vehicles','participants','evaluations','survey_questions','evaluation_answers'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('create policy admin_only on public.%I to authenticated using ((select public.is_toledo_admin())) with check ((select public.is_toledo_admin()))',t);
    execute format('create trigger updated_at before update on public.%I for each row execute function public.set_updated_at()',t);
  end loop;
end $$;

-- Public submission is still through the existing Google Forms. There is no
-- anonymous Supabase write endpoint to abuse. A future native form must add a
-- validated, rate-limited submission operation, never public participant reads.
commit;
