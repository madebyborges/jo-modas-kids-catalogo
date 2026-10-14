-- Complemento ao schema.sql: fotos compartilhadas no modo sem login solicitado.
create table if not exists public.product_photo_sets (
 product_reference text not null check(length(product_reference) between 1 and 160),
 color text not null default '' check(length(color)<=160),
 image_urls text[] not null default '{}' check(cardinality(image_urls)<=12),
 version integer not null default 1,
 updated_at timestamptz not null default now(),
 updated_by uuid not null references auth.users(id),
 primary key(product_reference,color)
);
create or replace function public.stamp_product_photos()
returns trigger language plpgsql set search_path='' as $$
begin
 if exists(select 1 from unnest(new.image_urls) u where u is null or u !~ '^https://[^[:space:]]+$' or length(u)>2048) then
  raise exception 'URLs de imagens devem usar HTTPS';
 end if;
 if TG_OP='UPDATE' then
  if new.product_reference<>old.product_reference or new.color<>old.color then raise exception 'Identidade das fotos não pode ser alterada'; end if;
  new.version := old.version+1;
 else new.version := 1; end if;
 new.updated_by := auth.uid();new.updated_at := now();return new;
end; $$;
drop trigger if exists product_photos_stamp on public.product_photo_sets;
create trigger product_photos_stamp before insert or update on public.product_photo_sets for each row execute function public.stamp_product_photos();
alter table public.product_photo_sets enable row level security;
revoke all on public.product_photo_sets from anon,authenticated;
grant select on public.product_photo_sets to anon;
grant select,insert,update on public.product_photo_sets to authenticated;
drop policy if exists photos_read on public.product_photo_sets;
create policy photos_read on public.product_photo_sets for select to anon,authenticated using(true);
drop policy if exists photos_insert on public.product_photo_sets;
create policy photos_insert on public.product_photo_sets for insert to authenticated with check(updated_by=(select auth.uid()));
-- Qualquer visitante com sessão automática pode corrigir as fotos compartilhadas.
drop policy if exists photos_update on public.product_photo_sets;
create policy photos_update on public.product_photo_sets for update to authenticated using((select auth.uid()) is not null) with check(updated_by=(select auth.uid()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-photos','product-photos',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists catalog_photos_insert on storage.objects;
create policy catalog_photos_insert on storage.objects for insert to authenticated
with check(bucket_id='product-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists catalog_photos_read on storage.objects;
create policy catalog_photos_read on storage.objects for select to authenticated using(bucket_id='product-photos');
-- Apenas o autor remove arquivos de uploads cancelados. Não há sobrescrita de arquivo.
drop policy if exists catalog_photos_cleanup on storage.objects;
create policy catalog_photos_cleanup on storage.objects for delete to authenticated
using(bucket_id='product-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
