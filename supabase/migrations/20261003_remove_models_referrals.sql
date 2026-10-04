-- The FolioDev redesign retires referral records and portfolio model selection.
-- This deliberately deletes existing referral rows and selected model values.
begin;

drop function if exists public.register_referral(text);
drop table if exists public.referrals;
alter table if exists public.profiles drop column if exists selected_model;

commit;
