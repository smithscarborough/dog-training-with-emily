-- A note Emily already answered stays in the thread as a placeholder.
-- The words are cleared. A note she has not answered is still deleted.

alter table messages add column if not exists removed_at timestamptz;
