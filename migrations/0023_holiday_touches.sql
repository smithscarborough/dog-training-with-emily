alter table studio add column if not exists holiday_mode text not null default 'auto';
alter table studio add column if not exists holiday_skip text not null default '';
