-- ============================================================
-- 004_storage.sql
-- Creates the private 'evidence' Storage bucket and its
-- access policies.
-- ============================================================

-- Create the private evidence bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,          -- private: files only accessible through signed URLs
  12582912,       -- 12 MB limit
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

-- Path convention: <ncrId>/<uuid>-<filename>
-- Only users who can see the NCR may read its files
create policy "evidence_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'evidence'
    and exists (
      select 1 from public.ncrs n
       where n.id = ((storage.foldername(name))[1])::bigint
         and n.archived_at is null
         and (n.created_by = auth.uid() or public.my_role() in ('officer','manager'))
    )
  );

-- Only users who can see the NCR may upload to it
create policy "evidence_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and exists (
      select 1 from public.ncrs n
       where n.id = ((storage.foldername(name))[1])::bigint
         and n.archived_at is null
         and n.status not in ('closed','rejected')
         and (n.created_by = auth.uid() or public.my_role() in ('officer','manager'))
    )
  );

-- No direct delete or update of storage objects through policies
-- (use Edge Functions or the dashboard if cleanup is needed)
