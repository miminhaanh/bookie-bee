-- Admin roles + permissions

-- 1) Add admin flag to profiles
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2) Ensure books have is_public for community library
alter table public.books
  add column if not exists is_public boolean not null default false;

-- 3) Comments table (for community discussion)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  is_reported boolean not null default false
);

-- 4) Admin helper function
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  );
$$;

-- 5) Enable RLS
alter table public.books enable row level security;
alter table public.profiles enable row level security;
alter table public.highlights enable row level security;
alter table public.comments enable row level security;

-- 6) Policies (conditional create)
DO $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own_or_admin'
  ) then
    create policy profiles_select_own_or_admin
      on public.profiles
      for select
      using (user_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own_or_admin'
  ) then
    create policy profiles_update_own_or_admin
      on public.profiles
      for update
      using (user_id = auth.uid() or public.is_admin())
      with check (user_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'books' and policyname = 'books_select_public_or_owner_or_admin'
  ) then
    create policy books_select_public_or_owner_or_admin
      on public.books
      for select
      using (is_public = true or user_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'books' and policyname = 'books_insert_owner_or_admin'
  ) then
    create policy books_insert_owner_or_admin
      on public.books
      for insert
      with check ((user_id = auth.uid() or public.is_admin()) and (is_public = false or public.is_admin()));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'books' and policyname = 'books_update_owner_or_admin'
  ) then
    create policy books_update_owner_or_admin
      on public.books
      for update
      using (user_id = auth.uid() or public.is_admin())
      with check ((user_id = auth.uid() or public.is_admin()) and (is_public = false or public.is_admin()));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'books' and policyname = 'books_delete_owner_or_admin'
  ) then
    create policy books_delete_owner_or_admin
      on public.books
      for delete
      using (user_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'highlights' and policyname = 'highlights_select_own_or_admin'
  ) then
    create policy highlights_select_own_or_admin
      on public.highlights
      for select
      using (user_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'highlights' and policyname = 'highlights_delete_own_or_admin'
  ) then
    create policy highlights_delete_own_or_admin
      on public.highlights
      for delete
      using (user_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'comments' and policyname = 'comments_select_public_or_owner_or_admin'
  ) then
    create policy comments_select_public_or_owner_or_admin
      on public.comments
      for select
      using (
        user_id = auth.uid()
        or public.is_admin()
        or exists (select 1 from public.books b where b.id = comments.book_id and b.is_public = true)
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'comments' and policyname = 'comments_insert_owner'
  ) then
    create policy comments_insert_owner
      on public.comments
      for insert
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'comments' and policyname = 'comments_update_owner_or_admin'
  ) then
    create policy comments_update_owner_or_admin
      on public.comments
      for update
      using (user_id = auth.uid() or public.is_admin())
      with check (user_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'comments' and policyname = 'comments_delete_owner_or_admin'
  ) then
    create policy comments_delete_owner_or_admin
      on public.comments
      for delete
      using (user_id = auth.uid() or public.is_admin());
  end if;
end $$;
