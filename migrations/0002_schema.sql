-- Dog Training with Emily — studio, dogs, sessions, progress

create table if not exists studio (
  id integer primary key default 1 check (id = 1),
  owner_user_id text,
  name text not null default 'Dog Training with Emily',
  email text not null default 'emily@dogtrainingwithemily.com',
  phone text not null default '(713) 555-0148',
  instagram text not null default 'https://instagram.com/dogtrainingwithemily',
  facebook text not null default 'https://facebook.com/dogtrainingwithemily',
  x_url text not null default 'https://x.com/dogtrainingwithemily',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into studio (id) values (1) on conflict (id) do nothing;

create table if not exists dogs (
  id serial primary key,
  owner_user_id text,
  owner_name text not null,
  owner_email text not null,
  owner_phone text not null,
  address text not null default '',
  name text not null,
  breed text not null default '',
  age_text text not null default '',
  weight_text text not null default '',
  allergies text not null default '',
  sex text not null default '',
  spayed_neutered text not null default '',
  goals_json text not null default '[]',
  goals_other text not null default '',
  dislikes text not null default '',
  past_experiences text not null default '',
  physical_limitations text not null default '',
  household text not null default '',
  other_pets text not null default '',
  kids_in_home text not null default '',
  vet_info text not null default '',
  preferred_days text not null default '',
  referral_source text not null default '',
  photo_url text,
  status text not null default 'pending',
  credits integer not null default 0,
  trainer_private_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dogs_owner_user_id_idx on dogs (owner_user_id);
create index if not exists dogs_owner_email_idx on dogs (owner_email);
create index if not exists dogs_status_idx on dogs (status);

create table if not exists sessions (
  id serial primary key,
  dog_id integer not null references dogs(id) on delete cascade,
  owner_user_id text,
  session_type text not null,
  scheduled_at timestamptz not null,
  duration_min integer not null,
  status text not null default 'requested',
  location text not null default '',
  owner_notes text not null default '',
  recap text not null default '',
  homework text not null default '',
  trainer_private_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sessions_dog_id_idx on sessions (dog_id);
create index if not exists sessions_owner_user_id_idx on sessions (owner_user_id);
create index if not exists sessions_scheduled_at_idx on sessions (scheduled_at);

create table if not exists progress (
  id serial primary key,
  dog_id integer not null references dogs(id) on delete cascade,
  skill_key text not null,
  rating integer not null default 0,
  comment text not null default '',
  updated_by text,
  updated_at timestamptz not null default now(),
  unique (dog_id, skill_key)
);

create index if not exists progress_dog_id_idx on progress (dog_id);

create table if not exists progress_log (
  id serial primary key,
  dog_id integer not null references dogs(id) on delete cascade,
  session_id integer references sessions(id) on delete set null,
  skill_key text not null,
  rating integer not null,
  comment text not null default '',
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists progress_log_dog_id_idx on progress_log (dog_id);

create table if not exists inquiries (
  id serial primary key,
  user_id text,
  name text not null,
  dog_name text not null default '',
  email text not null,
  phone text not null default '',
  message text not null,
  created_at timestamptz not null default now()
);
