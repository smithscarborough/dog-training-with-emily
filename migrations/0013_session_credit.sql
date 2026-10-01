-- A completed visit only changes credits when this is true.
-- A visit logged after the fact stays false, so it never adds or removes a credit.

alter table sessions add column if not exists credit_applied boolean not null default false;

update sessions set credit_applied = true where status = 'completed' and credit_applied = false;
