-- Restore the portfolio model choice after the 20261003 removal.
-- All catalog IDs are validated by the client before saving.
alter table public.profiles
  add column if not exists selected_model text not null default 'white';

-- Older installations may still have the ten-ID constraint from 20260926.
alter table public.profiles
  drop constraint if exists profiles_selected_model_check;
