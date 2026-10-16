-- Tamanhos corrigidos manualmente, sem alterar SKU, cor ou estoque do XLSX.
create table if not exists public.product_variant_sizes (
 sku text primary key check(length(sku) between 1 and 160),
 product_reference text not null check(length(product_reference) between 1 and 160),
 color text not null check(length(color)<=160),
 size text not null check(size ~ '^[0-9]{1,3}(/[0-9]{1,3})?$'),
 version integer not null default 1,
 updated_at timestamptz not null default now(),
 updated_by uuid not null references auth.users(id),
 unique(product_reference,color,size)
);
create or replace function public.stamp_product_size()
returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if new.sku<>old.sku or new.product_reference<>old.product_reference or new.color<>old.color then raise exception 'A identidade da variação não pode ser alterada'; end if;
  new.version := old.version+1;
 else new.version := 1; end if;
 new.updated_by := auth.uid();new.updated_at := now();return new;
end; $$;
drop trigger if exists product_size_stamp on public.product_variant_sizes;
create trigger product_size_stamp before insert or update on public.product_variant_sizes for each row execute function public.stamp_product_size();
alter table public.product_variant_sizes enable row level security;
revoke all on public.product_variant_sizes from anon,authenticated;
grant select on public.product_variant_sizes to anon;
grant select,insert,update on public.product_variant_sizes to authenticated;
drop policy if exists sizes_read on public.product_variant_sizes;
create policy sizes_read on public.product_variant_sizes for select to anon,authenticated using(true);
drop policy if exists sizes_insert on public.product_variant_sizes;
create policy sizes_insert on public.product_variant_sizes for insert to authenticated with check(updated_by=(select auth.uid()));
drop policy if exists sizes_update on public.product_variant_sizes;
-- Mesmo acesso compartilhado sem login da conferência e das fotos.
create policy sizes_update on public.product_variant_sizes for update to authenticated using((select auth.uid()) is not null) with check(updated_by=(select auth.uid()));
