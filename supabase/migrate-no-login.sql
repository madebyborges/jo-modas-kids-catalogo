-- Atualização de projetos que já executaram o schema anterior.
-- Ative Anonymous Sign-Ins no painel antes de usar a interface.
begin;
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
