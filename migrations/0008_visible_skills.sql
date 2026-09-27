alter table dogs add column if not exists visible_skills_json text not null default '[]';

-- Clients already in work keep the skills Emily has scored, unless intake
-- already unlocks the full catalog.
update dogs d
set visible_skills_json = coalesce((
  select json_agg(p.skill_key order by p.skill_key)::text
  from progress p
  where p.dog_id = d.id and p.rating > 0
), '[]')
where d.visible_skills_json = '[]'
  and d.goals_json not like '%"obedience"%'
  and d.goals_json not like '%"puppy-basics"%';
