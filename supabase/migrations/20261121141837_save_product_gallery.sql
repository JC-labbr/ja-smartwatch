create function public.save_product_gallery(
  product_id uuid,
  expected_updated_at timestamptz,
  product_data jsonb,
  photos jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item public.products;
  saved_id uuid;
  cover text;
begin
  if (select auth.uid()) is null or not coalesce((select private.is_admin()), false) then
    raise exception 'Acesso restrito à administração.' using errcode = '42501';
  end if;

  if photos is not null then
    if jsonb_typeof(photos) <> 'array' then
      raise exception 'Formato de galeria inválido.' using errcode = '22023';
    end if;
    if jsonb_array_length(photos) not between 3 and 5
       or (select count(distinct photo->>'url') from jsonb_array_elements(photos) photo) <> jsonb_array_length(photos)
       or exists (select 1 from jsonb_array_elements(photos) photo
                  where coalesce(photo->>'url', '') !~* '^https?://[^[:space:]]+$')
       or (select count(*) from jsonb_array_elements(photos) photo
           where photo->'primary' = 'true'::jsonb) <> 1 then
      raise exception 'Use de 3 a 5 fotos distintas e escolha uma principal.' using errcode = '22023';
    end if;
    select photo->>'url' into cover from jsonb_array_elements(photos) photo
      where photo->'primary' = 'true'::jsonb;
  elsif product_id is null then
    raise exception 'Adicione de 3 a 5 fotos ao novo produto.' using errcode = '22023';
  end if;

  item := jsonb_populate_record(null::public.products, product_data);
  if product_id is null then
    insert into public.products (
      name, sku, slug, description, price, compare_at_price, category_id, stock,
      specifications, is_active, is_featured, is_promotion, is_new_arrival, image_url
    ) values (
      item.name, item.sku, item.slug, item.description, item.price, item.compare_at_price,
      item.category_id, item.stock, item.specifications, item.is_active, item.is_featured,
      item.is_promotion, item.is_new_arrival, cover
    ) returning id into saved_id;
  else
    update public.products p
    set name = item.name, sku = item.sku, slug = item.slug, description = item.description,
        price = item.price, compare_at_price = item.compare_at_price, category_id = item.category_id,
        stock = item.stock, specifications = item.specifications, is_active = item.is_active,
        is_featured = item.is_featured, is_promotion = item.is_promotion, is_new_arrival = item.is_new_arrival,
        image_url = case when photos is null then p.image_url else cover end
    where p.id = product_id and p.updated_at = expected_updated_at
    returning p.id into saved_id;
    if saved_id is null then
      raise exception 'O produto foi alterado em outra sessão. Reabra o cadastro e tente novamente.' using errcode = '40001';
    end if;
  end if;

  if photos is not null then
    delete from public.product_images i where i.product_id = saved_id;
    insert into public.product_images (product_id, image_url, alt_text, sort_order)
    select saved_id, photo->>'url', nullif(photo->>'alt', ''), (position - 1)::integer
    from jsonb_array_elements(photos) with ordinality as entry(photo, position);
  end if;
  return saved_id;
end;
$$;

revoke all on function public.save_product_gallery(uuid, timestamptz, jsonb, jsonb) from public, anon;
grant execute on function public.save_product_gallery(uuid, timestamptz, jsonb, jsonb) to authenticated;

-- Keep referenced files protected even if an upload/save response is interrupted.
create policy "gallery files must be unused before deletion"
on storage.objects as restrictive for delete to authenticated
using (
  bucket_id <> 'product-images' or name not like 'gallery/%'
  or (
    not exists (
      select 1 from public.product_images i
      where split_part(split_part(i.image_url, '?', 1), '/object/public/product-images/', 2) = objects.name
    )
    and not exists (
      select 1 from public.products p
      where split_part(split_part(p.image_url, '?', 1), '/object/public/product-images/', 2) = objects.name
    )
  )
);
