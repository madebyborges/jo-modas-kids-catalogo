begin;
-- Append-only revisions. The static spreadsheet catalog is never written here.
create table public.product_variation_changes (
 id bigint generated always as identity primary key,
 product_reference text not null check(length(product_reference) between 1 and 160),
 parent_sku text not null check(length(parent_sku) between 1 and 160),
 color text not null check(length(color)<=160),
 size text not null check(size ~ '^[0-9]{1,3}(/[0-9]{1,3})?$'),
 action text not null check(action in ('added','removed','updated')),
 stock integer not null check(stock>=0),
 variant_sku text not null check(length(variant_sku) between 1 and 160),
 expected_id bigint,
 user_id uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now()
);
create index variation_identity on public.product_variation_changes(product_reference,color,size,id desc);
create function public.guard_variation_change() returns trigger
language plpgsql security invoker set search_path='' as $$
declare previous public.product_variation_changes;
begin
 if auth.uid() is null then raise exception 'Sessão de conferência necessária'; end if;
 -- Serialize simultaneous edits of the same product, including different sizes.
 perform pg_advisory_xact_lock(hashtextextended(new.product_reference,0));
 select * into previous from public.product_variation_changes
 where product_reference=new.product_reference and color=new.color and size=new.size
 order by id desc limit 1;
 if previous.id is distinct from new.expected_id then
  raise exception 'Tamanho alterado em outro navegador. Feche e reabra para atualizar.';
 end if;
 if previous.id is not null then
  if new.parent_sku<>previous.parent_sku then raise exception 'SKU pai incompatível'; end if;
  if new.action='added' and previous.action<>'removed' then raise exception 'Este tamanho já existe nesta cor'; end if;
  if new.action<>'added' and previous.action='removed' then raise exception 'Este tamanho foi removido'; end if;
 end if;
 new.user_id:=auth.uid();new.created_at:=clock_timestamp();return new;
end $$;
create trigger guard_variation_change before insert on public.product_variation_changes
 for each row execute function public.guard_variation_change();
alter table public.product_variation_changes enable row level security;
revoke all on public.product_variation_changes from anon,authenticated;
-- Same shared conference access as product_variant_sizes; visitors read,
-- Supabase Auth identities (including the existing anonymous sessions) contribute.
grant select on public.product_variation_changes to anon,authenticated;
grant insert on public.product_variation_changes to authenticated;
grant usage,select on sequence public.product_variation_changes_id_seq to authenticated;
create policy variation_read on public.product_variation_changes for select to anon,authenticated using(true);
create policy variation_insert on public.product_variation_changes for insert to authenticated
 with check(user_id=(select auth.uid()));
create function public.record_variation_change(p_reference text,p_parent text,p_color text,p_size text,p_stock integer,p_action text,p_sku text,p_expected bigint default null)
returns public.product_variation_changes language sql security invoker set search_path='' as $$
 insert into public.product_variation_changes(product_reference,parent_sku,color,size,stock,action,variant_sku,expected_id)
 values(p_reference,p_parent,p_color,p_size,p_stock,p_action,p_sku,p_expected) returning *;
$$;
revoke all on function public.record_variation_change(text,text,text,text,integer,text,text,bigint) from public,anon;
grant execute on function public.record_variation_change(text,text,text,text,integer,text,text,bigint) to authenticated;
commit;
