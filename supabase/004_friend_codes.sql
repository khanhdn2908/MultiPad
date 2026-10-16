-- MultiPad: kết bạn bằng mã 6 số (hết hạn sau 5 phút) + lời mời cần đồng ý.
-- Thay cho cách thêm bạn bằng email (003). Bạn bè giờ là HAI CHIỀU.
-- Dành cho database ĐÃ chạy schema.sql + 002 + 003 (không mất dữ liệu, chạy lại nhiều lần được).
-- Cài mới thì chỉ cần schema.sql — nội dung này đã có sẵn trong đó.

-- ── Bỏ cách tìm/thêm bằng email ─────────────────────────────────────

drop function if exists public.add_friend_by_email(text);
drop function if exists public.find_user_by_email(text);
-- Không thêm bạn trực tiếp nữa: chỉ qua lời mời được chấp nhận
drop policy if exists "friends: add counterparty" on public.friends;

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
