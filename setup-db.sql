-- Regions
create table if not exists regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Courses
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  region_id uuid references regions(id),
  facilitator text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_recurring boolean default false,
  recurrence_rule text,
  max_participants integer,
  status text default 'active',
  created_at timestamptz default now()
);

-- Participants (full form fields)
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  date_of_birth date,
  preferred_contact text,
  special_considerations text,
  heard_about_us text,
  country text,
  gender text,
  ethnicity text[],
  income_sources text[],
  newcomer_to_canada text,
  accommodation_type text,
  household_composition text,
  consent_given boolean not null default false,
  privacy_policy_accepted boolean not null default false,
  created_at timestamptz default now()
);

-- Registrations
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  participant_id uuid references participants(id),
  registered_at timestamptz default now(),
  attended boolean default false,
  notes text,
  unique(course_id, participant_id)
);

-- Seed regions
insert into regions (name) values
  ('Calgary'),
  ('Edmonton'),
  ('Red Deer'),
  ('Lethbridge'),
  ('Grande Prairie'),
  ('Medicine Hat'),
  ('Fort McMurray'),
  ('Lloydminster')
on conflict do nothing;

-- Seed sample courses
insert into courses (title, description, region_id, facilitator, location, start_time, end_time, is_recurring, max_participants)
select 'Mindfulness Mondays',
  'A weekly drop-in session exploring mindfulness practices for mental wellness. No experience needed.',
  r.id, 'Sarah M.', 'Calgary Recovery College – Room 204',
  now() + interval '3 days', now() + interval '3 days' + interval '1 hour', true, 15
from regions r where r.name = 'Calgary';

insert into courses (title, description, region_id, facilitator, location, start_time, end_time, is_recurring, max_participants)
select 'Understanding Anxiety',
  'A 4-week course exploring the nature of anxiety, how it affects us, and practical tools for managing it day-to-day.',
  r.id, 'James T.', 'Edmonton RC – Main Hall',
  now() + interval '5 days', now() + interval '5 days' + interval '90 minutes', false, 20
from regions r where r.name = 'Edmonton';

insert into courses (title, description, region_id, facilitator, location, start_time, end_time, is_recurring, max_participants)
select 'Recovery & Me',
  'An introductory course exploring personal recovery journeys. Open to participants and supporters alike.',
  r.id, 'Linda K.', 'Red Deer RC – Wellness Centre',
  now() + interval '7 days', now() + interval '7 days' + interval '2 hours', false, 25
from regions r where r.name = 'Red Deer';

insert into courses (title, description, region_id, facilitator, location, start_time, end_time, is_recurring, max_participants)
select 'Peer Support Skills',
  'Learn the foundations of peer support — active listening, shared experience, and building trust.',
  r.id, 'Marcus B.', 'Calgary Recovery College – Room 101',
  now() + interval '10 days', now() + interval '10 days' + interval '2 hours', true, 12
from regions r where r.name = 'Calgary';

insert into courses (title, description, region_id, facilitator, location, start_time, end_time, is_recurring, max_participants)
select 'Art & Wellness',
  'A creative drop-in exploring how art-making supports mental health. All skill levels welcome.',
  r.id, 'Priya S.', 'Lethbridge RC – Studio Space',
  now() + interval '4 days', now() + interval '4 days' + interval '90 minutes', true, 10
from regions r where r.name = 'Lethbridge';

-- Row level security
alter table courses enable row level security;
alter table regions enable row level security;
alter table participants enable row level security;
alter table registrations enable row level security;

drop policy if exists "courses_public_read" on courses;
drop policy if exists "regions_public_read" on regions;
drop policy if exists "registrations_insert" on registrations;
drop policy if exists "participants_insert" on participants;
drop policy if exists "participants_select" on participants;
drop policy if exists "registrations_select" on registrations;

create policy "courses_public_read" on courses for select using (true);
create policy "regions_public_read" on regions for select using (true);
create policy "registrations_insert" on registrations for insert with check (true);
create policy "participants_insert" on participants for insert with check (true);
create policy "participants_upsert" on participants for update using (true);
create policy "participants_select" on participants for select using (true);
create policy "registrations_select" on registrations for select using (true);
