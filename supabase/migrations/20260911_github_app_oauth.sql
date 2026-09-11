-- GitHub App OAuth: metadados visíveis ao proprietário e token cifrado restrito ao servidor.
create table if not exists public.github_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  github_user_id text not null unique,
  github_username text not null,
  avatar_url text not null default '',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.github_oauth_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_ciphertext text not null,
  updated_at timestamptz not null default now()
);

alter table public.github_connections enable row level security;
alter table public.github_oauth_tokens enable row level security;

revoke all on table public.github_connections, public.github_oauth_tokens from anon, authenticated;
grant select on table public.github_connections to authenticated;

drop policy if exists "github_connections_select_own" on public.github_connections;
create policy "github_connections_select_own" on public.github_connections
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.save_github_connection(
  p_github_user_id text,
  p_github_username text,
  p_avatar_url text,
  p_token_ciphertext text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if coalesce(trim(p_github_user_id), '') = '' or coalesce(trim(p_github_username), '') = '' or coalesce(p_token_ciphertext, '') = '' then
    raise exception 'invalid github connection';
  end if;

  insert into public.github_connections (user_id, github_user_id, github_username, avatar_url, connected_at, updated_at)
  values (auth.uid(), trim(p_github_user_id), trim(p_github_username), coalesce(p_avatar_url, ''), now(), now())
  on conflict (user_id) do update set
    github_user_id = excluded.github_user_id,
    github_username = excluded.github_username,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  insert into public.github_oauth_tokens (user_id, token_ciphertext, updated_at)
  values (auth.uid(), p_token_ciphertext, now())
  on conflict (user_id) do update set token_ciphertext = excluded.token_ciphertext, updated_at = now();
end;
$$;

create or replace function public.get_my_github_token()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select token_ciphertext from public.github_oauth_tokens where user_id = auth.uid();
$$;

create or replace function public.delete_my_github_connection()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  delete from public.github_oauth_tokens where user_id = auth.uid();
  delete from public.github_connections where user_id = auth.uid();
end;
$$;

revoke all on function public.save_github_connection(text, text, text, text) from public;
revoke all on function public.get_my_github_token() from public;
revoke all on function public.delete_my_github_connection() from public;
grant execute on function public.save_github_connection(text, text, text, text) to authenticated;
grant execute on function public.get_my_github_token() to authenticated;
grant execute on function public.delete_my_github_connection() to authenticated;
