-- MultiPad: cho phép người dùng sửa tên hiển thị của mình.
-- Dành cho database ĐÃ chạy schema.sql (không mất dữ liệu, chạy lại nhiều lần được).
-- Cài mới thì chỉ cần schema.sql — nội dung này đã có sẵn trong đó.

-- Tên hiển thị: 1–50 ký tự (NOT VALID: không kiểm tra lại các dòng cũ lấy từ Google)
alter table public.profiles drop constraint if exists profiles_display_name_check;
alter table public.profiles
  add constraint profiles_display_name_check
  check (display_name is null or length(trim(display_name)) between 1 and 50) not valid;

-- Chỉ sửa được profile của chính mình
drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- …và chỉ cột display_name. Email dùng để tìm người, không cho tự đổi (tránh mạo danh).
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;
