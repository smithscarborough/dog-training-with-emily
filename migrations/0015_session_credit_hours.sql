-- How many credits a completed visit actually took. Older visits took one, even a two-hour session.
alter table sessions add column if not exists credits_used integer not null default 0;

update sessions set credits_used = 1 where credit_applied = true and credits_used = 0;
