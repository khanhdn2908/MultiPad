# MultiPad Web

Vite + React + TypeScript, dữ liệu trên Supabase, đăng nhập bằng Google.

## Cài đặt Supabase

1. **SQL Editor** → chạy [`../supabase/schema.sql`](../supabase/schema.sql) (một lần, khi cài mới).
   ⚠️ File này xoá và tạo lại bảng `debts`, `bank_accounts` — chạy lại sẽ mất dữ liệu nợ.
2. **Google OAuth**
   - Google Cloud Console → APIs & Services → Credentials → *Create OAuth client ID* (Web application).
   - *Authorized redirect URIs*: `https://<project-ref>.supabase.co/auth/v1/callback`
     (lấy đúng URL ở Supabase → Authentication → Sign In / Providers → Google).
   - Copy Client ID + Client Secret vào Supabase → Authentication → Providers → **Google** → Enable.
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:5173` (đổi sang domain Vercel khi deploy)
   - Redirect URLs: `http://localhost:5173`, `https://<app>.vercel.app`

## Chạy local

```sh
cp .env.example .env.local   # điền VITE_SUPABASE_URL, VITE_SUPABASE_KEY
npm install
npm run dev
```

## Deploy lên Vercel

Import repo, **Root Directory** = `web`, thêm 2 biến môi trường `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`.
