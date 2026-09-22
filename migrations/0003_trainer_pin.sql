-- Trainer studio is unlocked with a code, not first-come claim.
alter table studio add column if not exists trainer_pin text;
update studio set trainer_pin = 'TEDDY' where trainer_pin is null or trainer_pin = '';
