alter table dogs add column if not exists referral_code text not null default '';
alter table dogs add column if not exists referred_by_code text not null default '';

create unique index if not exists dogs_referral_code_idx on dogs (referral_code) where referral_code <> '';

create table if not exists referral_gifts (
  id serial primary key,
  referrer_dog_id integer not null references dogs(id) on delete cascade,
  referred_dog_id integer references dogs(id) on delete set null,
  referred_name text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists referral_gifts_referred_idx on referral_gifts (referred_dog_id) where referred_dog_id is not null;
