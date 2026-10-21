import { useState } from 'react'
import { supabase } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'

export default function LoginPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    // Thành công thì trình duyệt chuyển sang Google, chỉ quay lại đây khi lỗi
    if (error) {
      setError(error.message)
      setBusy(false)
    }
  }

  return (
    <main className="center">
      <div className="card login stack">
        <div className="row between">
          <h1>MultiPad</h1>
          <ThemeToggle />
        </div>
        <button onClick={signIn} disabled={busy}>
          {busy ? 'Đang chuyển hướng…' : 'Tiếp tục với Google'}
        </button>
        <p className="muted small">
          Chưa có tài khoản? Đăng nhập Google lần đầu sẽ tự tạo tài khoản MultiPad cho bạn.
        </p>
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  )
}
