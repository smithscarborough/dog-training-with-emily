-- Notes between a household and Emily, separate from the check-in status.

create table if not exists messages (
  id serial primary key,
  dog_id integer not null references dogs(id) on delete cascade,
  author text not null,
  body text not null,
  read_by_trainer boolean not null default false,
  read_by_client boolean not null default false,
  reply_token text,
  created_at timestamptz not null default now()
);

create index if not exists messages_dog_id_idx on messages (dog_id, created_at);
create unique index if not exists messages_reply_token_idx on messages (reply_token) where reply_token is not null;
