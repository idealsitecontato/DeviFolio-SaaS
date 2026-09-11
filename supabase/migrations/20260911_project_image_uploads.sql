-- Private writes and public reads for real project cover uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "project_images_public_read" on storage.objects;
create policy "project_images_public_read" on storage.objects for select to public using (bucket_id = 'project-images');

drop policy if exists "project_images_insert_own" on storage.objects;
create policy "project_images_insert_own" on storage.objects for insert to authenticated with check (
  bucket_id = 'project-images' and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "project_images_update_own" on storage.objects;
create policy "project_images_update_own" on storage.objects for update to authenticated using (
  bucket_id = 'project-images' and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (
  bucket_id = 'project-images' and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "project_images_delete_own" on storage.objects;
create policy "project_images_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'project-images' and (storage.foldername(name))[1] = (select auth.uid())::text
);
