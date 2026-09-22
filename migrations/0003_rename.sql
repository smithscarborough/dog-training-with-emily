-- Rename the practice. Only fill empty/placeholder contact fields so a trainer's
-- live inbox and socials are never overwritten.
update studio
set
  name = 'Dog Training with Emily',
  email = case
    when email = 'hello@hearthandhound.example' or email = '' then 'hello@dogtrainingwithemily.example'
    else email
  end,
  instagram = case
    when instagram = 'https://instagram.com/hearthandhound' or instagram = '' then 'https://instagram.com/dogtrainingwithemily'
    else instagram
  end,
  facebook = case
    when facebook = 'https://facebook.com/hearthandhound' or facebook = '' then 'https://facebook.com/dogtrainingwithemily'
    else facebook
  end,
  x_url = case
    when x_url = 'https://x.com/hearthandhound' or x_url = '' then 'https://x.com/dogtrainingwithemily'
    else x_url
  end,
  updated_at = now()
where id = 1;
