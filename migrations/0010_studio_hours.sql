alter table studio add column if not exists hours_json text not null default '';
alter table dogs add column if not exists preferred_at text not null default '';
