-- MultiPad: sổ nợ giữa các người dùng (đăng nhập Google)
-- Chạy file này trong Supabase Dashboard → SQL Editor → New query → Run.
--
-- Luồng:
--   0. Kết bạn: B tạo mã 6 số (5 phút), A nhập mã → lời mời → B chấp nhận.
--   1. A chọn bạn B, ghi số tiền → khoản nợ 'pending'.
--   2. B chấp nhận / từ chối.
--   3. Người nợ quét VietQR (STK của chủ nợ trong bank_accounts) rồi báo "đã trả".
--   4. Chủ nợ xác nhận đã nhận tiền → khoản nợ được gạch.

-- ⚠️ Xoá và tạo lại các bảng dữ liệu → MẤT TOÀN BỘ dữ liệu nợ, ngân hàng, bạn bè.
--    Chỉ chạy khi cài mới. profiles được giữ lại.
drop table if exists public.friend_code_attempts cascade;
drop table if exists public.friend_codes cascade;
drop table if exists public.friend_requests cascade;
drop table if exists public.friends cascade;
drop table if exists public.bank_accounts cascade;
drop table if exists public.debts cascade;

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
-- Friends: bạn bè hai chiều (tạo qua lời mời bằng mã, xem phần cuối file)
-- ═════════════════════════════════════════════════════════════════════

create table public.friends (
  owner_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  friend_id   uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (owner_id, friend_id),
  check (owner_id <> friend_id)
);

-- ═════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═════════════════════════════════════════════════════════════════════

alter table public.profiles      enable row level security;
alter table public.debts         enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.friends       enable row level security;

create policy "friends: owner reads" on public.friends
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "friends: owner removes" on public.friends
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Chỉ sửa được profile của chính mình, và chỉ cột display_name.
-- Email lấy từ Google, không cho tự đổi (tránh mạo danh).
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

revoke execute on function public.respond_debt(uuid, boolean)      from public, anon;
revoke execute on function public.claim_debt_paid(uuid[], boolean) from public, anon;
revoke execute on function public.set_debt_paid(uuid, boolean)     from public, anon;
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

-- ═════════════════════════════════════════════════════════════════════
-- Kết bạn bằng mã 6 số
-- ═════════════════════════════════════════════════════════════════════

-- ── Bảng ─────────────────────────────────────────────────────────────

-- Mã kết bạn: mỗi người tối đa 1 mã đang hiệu lực
create table if not exists public.friend_codes (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  code        text not null unique check (code ~ '^\d{6}$'),
  expires_at  timestamptz not null
);

create table if not exists public.friend_requests (
  id            uuid primary key default gen_random_uuid(),
  from_id       uuid not null references public.profiles (id) on delete cascade,
  to_id         uuid not null references public.profiles (id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  check (from_id <> to_id)
);

-- Giữa 2 người chỉ có 1 lời mời đang chờ (bất kể ai gửi)
create unique index if not exists friend_requests_one_pending
  on public.friend_requests (least(from_id, to_id), greatest(from_id, to_id))
  where status = 'pending';

-- Nhật ký nhập sai mã (chống dò 1 triệu mã)
create table if not exists public.friend_code_attempts (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  at       timestamptz not null default now()
);
create index if not exists friend_code_attempts_idx on public.friend_code_attempts (user_id, at);

-- ── RLS ──────────────────────────────────────────────────────────────

alter table public.friend_codes         enable row level security;
alter table public.friend_requests      enable row level security;
alter table public.friend_code_attempts enable row level security;  -- không policy: chỉ hàm bên dưới dùng

drop policy if exists "friend_codes: owner reads" on public.friend_codes;
create policy "friend_codes: owner reads" on public.friend_codes
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "friend_requests: parties read" on public.friend_requests;
create policy "friend_requests: parties read" on public.friend_requests
  for select to authenticated
  using ((select auth.uid()) in (from_id, to_id));

-- Người gửi huỷ lời mời đang chờ
drop policy if exists "friend_requests: sender cancels" on public.friend_requests;
create policy "friend_requests: sender cancels" on public.friend_requests
  for delete to authenticated
  using (from_id = (select auth.uid()) and status = 'pending');

-- Thấy profile của: mình, người có chung khoản nợ, bạn bè, người đang có lời mời kết bạn với mình
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
    or exists (
      select 1 from public.friend_requests r
      where (r.from_id = profiles.id and r.to_id = (select auth.uid()))
         or (r.to_id = profiles.id and r.from_id = (select auth.uid()))
    )
  );

-- ── Hàm (RPC) ────────────────────────────────────────────────────────

-- Tạo (hoặc thay) mã kết bạn của mình, hiệu lực 5 phút
create or replace function public.create_friend_code()
returns public.friend_codes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_row  public.friend_codes;
begin
  delete from public.friend_codes where expires_at < now();

  loop
    -- 32 bit ngẫu nhiên an toàn (gen_random_uuid dùng nguồn ngẫu nhiên của hệ thống)
    v_code := lpad(
      ((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint) % 1000000)::text,
      6, '0');
    begin
      insert into public.friend_codes (user_id, code, expires_at)
      values (auth.uid(), v_code, now() + interval '5 minutes')
      on conflict (user_id) do update
        set code = excluded.code, expires_at = excluded.expires_at
      returning * into v_row;
      exit;
    exception when unique_violation then
      -- trùng mã đang hiệu lực của người khác → thử mã khác
    end;
  end loop;

  return v_row;
end;
$$;

-- Nhập mã để gửi lời mời. Trả về {"profile": …} khi thành công, {"error": "…"} khi không.
-- (Không raise exception để lần nhập sai vẫn được ghi lại.)
create or replace function public.send_friend_request(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me     uuid := auth.uid();
  v_target uuid;
begin
  if (select count(*) from public.friend_code_attempts
      where user_id = v_me and at > now() - interval '10 minutes') >= 10 then
    return jsonb_build_object('error', 'Nhập sai quá nhiều lần. Thử lại sau 10 phút.');
  end if;

  select user_id into v_target from public.friend_codes
  where code = trim(p_code) and expires_at > now();

  if v_target is null then
    insert into public.friend_code_attempts (user_id) values (v_me);
    return jsonb_build_object('error', 'Mã không đúng hoặc đã hết hạn.');
  end if;

  if v_target = v_me then
    return jsonb_build_object('error', 'Đây là mã của chính bạn.');
  end if;

  if exists (select 1 from public.friends where owner_id = v_me and friend_id = v_target) then
    return jsonb_build_object('error', 'Hai bạn đã là bạn bè.');
  end if;

  if exists (select 1 from public.friend_requests
             where from_id = v_target and to_id = v_me and status = 'pending') then
    return jsonb_build_object('error', 'Người này đã gửi lời mời cho bạn — hãy chấp nhận ở mục Lời mời kết bạn.');
  end if;

  insert into public.friend_requests (from_id, to_id)
  values (v_me, v_target)
  on conflict do nothing;  -- đã gửi rồi thì thôi

  return jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_target)
  );
end;
$$;

-- Người nhận chấp nhận / từ chối. Chấp nhận → thành bạn của nhau (2 chiều).
create or replace function public.respond_friend_request(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from uuid;
begin
  update public.friend_requests
  set status = case when p_accept then 'accepted' else 'rejected' end,
      responded_at = now()
  where id = p_id
    and to_id = auth.uid()
    and status = 'pending'
  returning from_id into v_from;

  if v_from is null then
    raise exception 'Không thể phản hồi lời mời này';
  end if;

  if p_accept then
    insert into public.friends (owner_id, friend_id)
    values (auth.uid(), v_from), (v_from, auth.uid())
    on conflict do nothing;
  end if;
end;
$$;

-- Huỷ kết bạn: xoá cả 2 chiều
create or replace function public.remove_friend(p_friend_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.friends
  where (owner_id = auth.uid() and friend_id = p_friend_id)
     or (owner_id = p_friend_id and friend_id = auth.uid());
end;
$$;

revoke execute on function public.create_friend_code()                    from public, anon;
revoke execute on function public.send_friend_request(text)               from public, anon;
revoke execute on function public.respond_friend_request(uuid, boolean)   from public, anon;
revoke execute on function public.remove_friend(uuid)                     from public, anon;
grant  execute on function public.create_friend_code()                    to authenticated;
grant  execute on function public.send_friend_request(text)               to authenticated;
grant  execute on function public.respond_friend_request(uuid, boolean)   to authenticated;
grant  execute on function public.remove_friend(uuid)                     to authenticated;

-- ── Realtime: người nhận thấy lời mời ngay ───────────────────────────

do $$
begin
  alter publication supabase_realtime add table public.friend_requests;
exception when duplicate_object then null;
end;
$$;
