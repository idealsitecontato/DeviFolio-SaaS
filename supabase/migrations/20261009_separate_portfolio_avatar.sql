-- Keep the account avatar independent from the avatar displayed in the portfolio.
alter table public.profiles
  add column if not exists portfolio_avatar_url text not null default '';
