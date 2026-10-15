-- MultiPad: sổ nợ giữa các người dùng (đăng nhập Google)
-- Chạy file này trong Supabase Dashboard → SQL Editor → New query → Run.
--
-- Luồng:
--   1. A chọn người dùng B (theo email), ghi số tiền → khoản nợ 'pending'.
--   2. B chấp nhận / từ chối.
--   3. Người nợ quét VietQR (STK của chủ nợ trong bank_accounts) rồi báo "đã trả".
--   4. Chủ nợ xác nhận đã nhận tiền → khoản nợ được gạch.

-- ⚠️ Xoá và tạo lại các bảng dữ liệu nợ → MẤT TOÀN BỘ dữ liệu trong debts / bank_accounts.
--    Chỉ chạy khi cài mới. profiles được giữ lại.
drop table if exists public.bank_accounts cascade;
drop table if exists public.debts cascade;
drop table if exists public.friends cascade;   -- bảng của bản đầu tiên, không còn dùng

-- ═════════════════════════════════════════════════════════════════════
-- Profiles: 1 dòng cho mỗi user, tự tạo khi đăng nhập lần đầu
-- ═════════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

-- Tên hiển thị: 1–50 ký tự (NOT VALID: không kiểm tra lại các dòng cũ lấy từ Google)
alter table public.profiles drop constraint if exists profiles_display_name_check;
alter table public.profiles
  add constraint profiles_display_name_check
  check (display_name is null or length(trim(display_name)) between 1 and 50) not valid;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tạo profile cho các user đã đăng nhập trước khi có trigger
insert into public.profiles (id, email, display_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
where u.email is not null
on conflict (id) do nothing;

-- ═════════════════════════════════════════════════════════════════════
-- Debts
-- ═════════════════════════════════════════════════════════════════════

create table public.debts (
  id               uuid primary key default gen_random_uuid(),
  creditor_id      uuid not null references public.profiles (id) on delete cascade,  -- người cho nợ
  debtor_id        uuid not null references public.profiles (id) on delete cascade,  -- người nợ
  created_by       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  amount           bigint not null check (amount > 0),                                -- VND, số nguyên
  note             text,
  status           text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at       timestamptz not null default now(),
  responded_at     timestamptz,
  paid_claimed_at  timestamptz,                                                       -- người nợ báo đã trả
  paid_at          timestamptz,                                                       -- chủ nợ xác nhận; null = chưa trả
  check (creditor_id <> debtor_id),
  check (created_by in (creditor_id, debtor_id)),
  check (paid_at is null or status = 'accepted'),
  check (paid_claimed_at is null or status = 'accepted')
);

create index debts_creditor_idx on public.debts (creditor_id);
create index debts_debtor_idx   on public.debts (debtor_id);

-- ═════════════════════════════════════════════════════════════════════
-- Bank accounts: STK nhận tiền (người nợ quét VietQR để trả)
-- ═════════════════════════════════════════════════════════════════════

create table public.bank_accounts (
  user_id       uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  bank_bin      text not null check (bank_bin ~ '^\d{6}$'),                 -- mã BIN Napas, vd 970422 = MB
  bank_name     text not null,                                             -- tên ngắn để hiển thị
  account_no    text not null check (account_no ~ '^[0-9A-Za-z]{4,30}$'),
  account_name  text not null check (length(trim(account_name)) > 0),      -- IN HOA, không dấu
  updated_at    timestamptz not null default now()
);

-- ═════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═════════════════════════════════════════════════════════════════════

alter table public.profiles      enable row level security;
alter table public.debts         enable row level security;
alter table public.bank_accounts enable row level security;

-- Chỉ thấy profile của mình và của những người có chung khoản nợ.
-- Tìm người mới thì dùng hàm find_user_by_email (phải biết chính xác email).
drop policy if exists "profiles: self or counterparty" on public.profiles;
create policy "profiles: self or counterparty" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.debts d
      where (d.creditor_id = profiles.id and d.debtor_id = (select auth.uid()))
         or (d.debtor_id = profiles.id and d.creditor_id = (select auth.uid()))
    )
  );

-- Chỉ sửa được profile của chính mình, và chỉ cột display_name.
-- Email dùng để tìm người, không cho tự đổi (tránh mạo danh).
drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Hai bên của khoản nợ đều xem được
create policy "debts: parties can read" on public.debts
  for select to authenticated
  using ((select auth.uid()) in (creditor_id, debtor_id));

-- Chỉ tạo yêu cầu mới (pending) mà mình là một bên
create policy "debts: create request" on public.debts
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select auth.uid()) in (creditor_id, debtor_id)
    and status = 'pending'
    and responded_at is null
    and paid_claimed_at is null
    and paid_at is null
  );

-- Người tạo được huỷ khi chưa được chấp nhận
create policy "debts: creator cancels" on public.debts
  for delete to authenticated
  using (created_by = (select auth.uid()) and status <> 'accepted');

-- Không có policy UPDATE cho debts: mọi thay đổi trạng thái đi qua các hàm bên dưới.

create policy "bank: owner manages" on public.bank_accounts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Người khác chỉ thấy STK của bạn khi họ đang nợ bạn (khoản đã chấp nhận, chưa trả)
create policy "bank: debtors can read" on public.bank_accounts
  for select to authenticated
  using (
    exists (
      select 1 from public.debts d
      where d.creditor_id = bank_accounts.user_id
        and d.debtor_id = (select auth.uid())
        and d.status = 'accepted'
        and d.paid_at is null
    )
  );

-- ═════════════════════════════════════════════════════════════════════
-- Hàm (RPC)
-- ═════════════════════════════════════════════════════════════════════

create or replace function public.find_user_by_email(p_email text)
returns setof public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.profiles
  where lower(email) = lower(trim(p_email))
    and id <> auth.uid()
  limit 1;
$$;

-- Người nhận yêu cầu chấp nhận / từ chối
create or replace function public.respond_debt(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.debts
  set status = case when p_accept then 'accepted' else 'rejected' end,
      responded_at = now()
  where id = p_id
    and status = 'pending'
    and created_by <> auth.uid()
    and auth.uid() in (creditor_id, debtor_id);

  if not found then
    raise exception 'Không thể phản hồi yêu cầu này';
  end if;
end;
$$;

-- Người nợ báo đã trả (p_claim = true) hoặc huỷ báo (false), cho nhiều khoản cùng lúc
create or replace function public.claim_debt_paid(p_ids uuid[], p_claim boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.debts
  set paid_claimed_at = case when p_claim then now() else null end
  where id = any (p_ids)
    and debtor_id = auth.uid()
    and status = 'accepted'
    and paid_at is null;

  if not found then
    raise exception 'Không có khoản nợ hợp lệ để báo trả';
  end if;
end;
$$;

-- Chủ nợ: p_paid = true → xác nhận đã nhận tiền; false → bỏ đánh dấu / từ chối lời báo trả
create or replace function public.set_debt_paid(p_id uuid, p_paid boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.debts
  set paid_at = case when p_paid then now() else null end,
      paid_claimed_at = null
  where id = p_id
    and status = 'accepted'
    and creditor_id = auth.uid();

  if not found then
    raise exception 'Chỉ chủ nợ mới đánh dấu được khoản đã chấp nhận';
  end if;
end;
$$;

revoke execute on function public.find_user_by_email(text)        from public, anon;
revoke execute on function public.respond_debt(uuid, boolean)      from public, anon;
revoke execute on function public.claim_debt_paid(uuid[], boolean) from public, anon;
revoke execute on function public.set_debt_paid(uuid, boolean)     from public, anon;
grant  execute on function public.find_user_by_email(text)        to authenticated;
grant  execute on function public.respond_debt(uuid, boolean)      to authenticated;
grant  execute on function public.claim_debt_paid(uuid[], boolean) to authenticated;
grant  execute on function public.set_debt_paid(uuid, boolean)     to authenticated;

-- ═════════════════════════════════════════════════════════════════════
-- Realtime: bên kia thấy yêu cầu / xác nhận mới ngay, không cần tải lại trang
-- ═════════════════════════════════════════════════════════════════════

do $$
begin
  alter publication supabase_realtime add table public.debts;
exception when duplicate_object then null;
end;
$$;
