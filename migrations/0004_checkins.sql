-- Between-session check-ins from the household

create table if not exists checkins (
  id serial primary key,
  dog_id integer not null references dogs(id) on delete cascade,
  owner_user_id text,
  status text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checkins_dog_id_idx on checkins (dog_id);
create index if not exists checkins_created_at_idx on checkins (created_at desc);
