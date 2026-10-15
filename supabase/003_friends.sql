-- MultiPad: danh sách bạn bè (một chiều, để chọn nhanh khi tạo khoản nợ)
-- Dành cho database ĐÃ chạy schema.sql + 002 (không mất dữ liệu, chạy lại nhiều lần được).
-- Cài mới thì chỉ cần schema.sql — nội dung này đã có sẵn trong đó.

create table if not exists public.friends (
  owner_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  friend_id   uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (owner_id, friend_id),
  check (owner_id <> friend_id)
);

alter table public.friends enable row level security;

drop policy if exists "friends: owner reads" on public.friends;
create policy "friends: owner reads" on public.friends
  for select to authenticated
  using (owner_id = (select auth.uid()));

-- Thêm trực tiếp chỉ khi đã có khoản nợ chung; người lạ thì qua add_friend_by_email
drop policy if exists "friends: add counterparty" on public.friends;
create policy "friends: add counterparty" on public.friends
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.debts d
      where (d.creditor_id = friend_id and d.debtor_id = (select auth.uid()))
         or (d.debtor_id = friend_id and d.creditor_id = (select auth.uid()))
    )
  );

drop policy if exists "friends: owner removes" on public.friends;
create policy "friends: owner removes" on public.friends
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Thấy profile của: chính mình, người có chung khoản nợ, người trong danh sách bạn bè
drop policy if exists "profiles: self or counterparty" on public.profiles;
drop policy if exists "profiles: self, counterparty or friend" on public.profiles;
create policy "profiles: self, counterparty or friend" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.debts d
      where (d.creditor_id = profiles.id and d.debtor_id = (select auth.uid()))
         or (d.debtor_id = profiles.id and d.creditor_id = (select auth.uid()))
    )
    or exists (
      select 1 from public.friends f
      where f.owner_id = (select auth.uid()) and f.friend_id = profiles.id
    )
  );

-- Tìm theo email chính xác rồi thêm vào bạn bè. Không thấy → trả về rỗng.
create or replace function public.add_friend_by_email(p_email text)
returns setof public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.profiles;
begin
  select * into v from public.profiles
  where lower(email) = lower(trim(p_email))
    and id <> auth.uid()
  limit 1;

  if v.id is null then
    return;
  end if;

  insert into public.friends (owner_id, friend_id)
  values (auth.uid(), v.id)
  on conflict do nothing;

  return next v;
end;
$$;

revoke execute on function public.add_friend_by_email(text) from public, anon;
grant  execute on function public.add_friend_by_email(text) to authenticated;
