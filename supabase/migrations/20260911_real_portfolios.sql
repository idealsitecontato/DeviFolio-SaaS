-- Idempotent migration for real user-owned public portfolios.

alter table public.profiles add column if not exists avatar_url text not null default '';
alter table public.projects add column if not exists image_url text;
alter table public.analytics_events add column if not exists visitor_id text;
create unique index if not exists referrals_user_email_idx on public.referrals(user_id, referred_email);

grant select on table public.profiles, public.projects to anon;
grant insert on table public.analytics_events to anon;
grant usage, select on sequence public.analytics_events_id_seq to anon;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles for select to anon, authenticated using (published = true);

drop policy if exists "projects_select_public" on public.projects;
create policy "projects_select_public" on public.projects for select to anon, authenticated using (
  status = 'published'
  and exists (
    select 1 from public.profiles
    where profiles.user_id = projects.user_id and profiles.published = true
  )
);

drop policy if exists "analytics_insert_public" on public.analytics_events;
create policy "analytics_insert_public" on public.analytics_events for insert to anon, authenticated with check (
  exists (
    select 1 from public.profiles
    where profiles.user_id = analytics_events.user_id and profiles.published = true
  )
  and (
    project_id is null
    or exists (
      select 1 from public.projects
      where projects.id = analytics_events.project_id
        and projects.user_id = analytics_events.user_id
        and projects.status = 'published'
    )
  )
);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select to public using (bucket_id = 'avatars');
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects for update to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.register_referral(inviter_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inviter_id uuid;
  invited_email text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select user_id into inviter_id from public.profiles where username = lower(trim(inviter_username));
  invited_email := coalesce(auth.jwt() ->> 'email', '');
  if inviter_id is null or inviter_id = auth.uid() or invited_email = '' then return; end if;
  insert into public.referrals (user_id, referred_email, status)
  values (inviter_id, invited_email, 'active')
  on conflict (user_id, referred_email) do update set status = 'active';
end;
$$;

revoke all on function public.register_referral(text) from public;
grant execute on function public.register_referral(text) to authenticated;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
