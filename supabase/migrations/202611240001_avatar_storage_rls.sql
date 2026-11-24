-- VIBR profile photo storage setup
-- Apply this migration in the Supabase SQL Editor for the production project.
-- The app uploads to: avatars/<authenticated-user-id>.<extension>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Upsert needs SELECT as well as INSERT and UPDATE. Restrict metadata reads
-- to the signed-in owner's own avatar object; public bucket URLs remain publicly readable.
drop policy if exists "Public can view avatar images" on storage.objects;
drop policy if exists "Users can read their own avatar metadata" on storage.objects;
create policy "Users can read their own avatar metadata"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and name like 'avatars/' || auth.uid()::text || '.%'
);

-- A signed-in user may upload only the file whose name starts with their own user ID.
drop policy if exists "Users upload their own avatar" on storage.objects;
create policy "Users upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and name like 'avatars/' || auth.uid()::text || '.%'
);

-- Required by Supabase Storage upsert when the user replaces an existing photo.
drop policy if exists "Users update their own avatar" on storage.objects;
create policy "Users update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and name like 'avatars/' || auth.uid()::text || '.%'
)
with check (
  bucket_id = 'avatars'
  and name like 'avatars/' || auth.uid()::text || '.%'
);

-- Allow a user to remove only their own avatar object if needed later.
drop policy if exists "Users delete their own avatar" on storage.objects;
create policy "Users delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and name like 'avatars/' || auth.uid()::text || '.%'
);
