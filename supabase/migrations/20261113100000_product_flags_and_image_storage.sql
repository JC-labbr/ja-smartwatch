-- J&A Smartwatch: product merchandising flags and image storage
-- Applied to the linked Supabase project on 2026-11-13.

alter table public.products
  add column if not exists is_promotion boolean not null default false;

alter table public.products
  add column if not exists is_new_arrival boolean not null default false;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public reads product image files" on storage.objects;
create policy "public reads product image files"
on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "admins upload product image files" on storage.objects;
create policy "admins upload product image files"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select private.is_admin()));

drop policy if exists "admins update product image files" on storage.objects;
create policy "admins update product image files"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select private.is_admin()))
with check (bucket_id = 'product-images' and (select private.is_admin()));

drop policy if exists "admins delete product image files" on storage.objects;
create policy "admins delete product image files"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select private.is_admin()));
