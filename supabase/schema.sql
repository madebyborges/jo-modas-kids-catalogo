-- Execute integralmente no SQL Editor do projeto Supabase.
begin;
create table if not exists public.product_reviews (
 id uuid primary key default gen_random_uuid(),
 product_reference text not null unique check (length(btrim(product_reference)) > 0),
 parent_sku text not null check (length(btrim(parent_sku)) > 0),
 status text not null default 'pending' check (status in ('pending','approved','needs_correction')),
 comment text,
 reviewer_name text not null check (length(btrim(reviewer_name)) between 1 and 160),
 reviewer_id uuid not null references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint correction_requires_comment check (status <> 'needs_correction' or (comment is not null and length(btrim(comment)) > 0)),
 constraint comment_length check (comment is null or length(comment) <= 5000)
);
create index if not exists product_reviews_reviewer_idx on public.product_reviews(reviewer_id);
create index if not exists product_reviews_status_idx on public.product_reviews(status);
create or replace function public.stamp_product_review()
returns trigger language plpgsql set search_path = '' as $$
begin
 new.updated_at := now();
 new.reviewer_id := auth.uid();
 new.reviewed_at := case when new.status = 'pending' then null else now() end;
 if TG_OP = 'UPDATE' then
  new.id := old.id; new.created_at := old.created_at;
  if new.product_reference <> old.product_reference or new.parent_sku <> old.parent_sku then
   raise exception 'A identidade do produto não pode ser alterada';
  end if;
 end if;
 return new;
end; $$;
drop trigger if exists product_reviews_stamp on public.product_reviews;
create trigger product_reviews_stamp before insert or update on public.product_reviews for each row execute function public.stamp_product_review();
alter table public.product_reviews enable row level security;
revoke all on public.product_reviews from anon;
revoke all on public.product_reviews from authenticated;
grant select, insert, update on public.product_reviews to authenticated;
drop policy if exists reviews_read on public.product_reviews;
drop policy if exists reviews_insert on public.product_reviews;
drop policy if exists reviews_update on public.product_reviews;
create policy reviews_read on public.product_reviews for select to authenticated
 using ((select auth.uid()) is not null);
create policy reviews_insert on public.product_reviews for insert to authenticated
 with check (reviewer_id = (select auth.uid()));
-- Acesso sem email/senha: sessões automáticas compartilham a conferência.
-- Quem acessar o catálogo pode ler e atualizar revisões, conforme o modo público solicitado.
create policy reviews_update on public.product_reviews for update to authenticated
 using ((select auth.uid()) is not null)
 with check (reviewer_id = (select auth.uid()));
commit;

