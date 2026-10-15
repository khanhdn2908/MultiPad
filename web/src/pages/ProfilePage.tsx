import { useState, type FormEvent } from 'react'
import { useShell } from '../shell'

const MAX_LENGTH = 50

/** Hồ sơ: sửa tên hiển thị (người khác thấy tên này trong các khoản nợ). */
export default function ProfilePage() {
  const { session, profile, myName, updateDisplayName } = useShell()
  // null = chưa sửa gì, hiển thị tên hiện tại
  const [draft, setDraft] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const value = draft ?? myName
  const trimmed = value.trim()
  const changed = trimmed !== myName

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!trimmed || !changed) return
    setBusy(true)
    const error = await updateDisplayName(trimmed)
    setBusy(false)
    if (error) setMessage({ ok: false, text: error })
    else {
      setDraft(null)
      setMessage({ ok: true, text: 'Đã lưu tên hiển thị' })
    }
  }

  return (
    <main className="stack module-body">
      <section className="card">
        <h2>Hồ sơ</h2>
        <form onSubmit={submit} className="stack">
          <label className="stack field">
            <span className="small muted">Tên hiển thị</span>
            <input
              value={value}
              maxLength={MAX_LENGTH}
              placeholder="Tên bạn bè sẽ thấy"
              disabled={!profile}
              onChange={(e) => {
                setDraft(e.target.value)
                setMessage(null)
              }}
            />
          </label>
          <p className="muted small">
            Bạn bè thấy tên này trong các khoản nợ và yêu cầu. Nội dung chuyển khoản khi bạn trả nợ cũng dùng
            tên này (không dấu).
          </p>
          <div className="row">
            <button type="submit" disabled={busy || !trimmed || !changed}>
              {busy ? 'Đang lưu…' : 'Lưu'}
            </button>
            {changed && (
              <button type="button" className="ghost" onClick={() => setDraft(null)}>
                Huỷ
              </button>
            )}
          </div>
          {message && <p className={message.ok ? 'small' : 'error'}>{message.text}</p>}
        </form>
      </section>

      <section className="card">
        <h2>Tài khoản</h2>
        <dl className="pay-info">
          <dt>Email</dt>
          <dd>{session.user.email}</dd>
          <dt>Đăng nhập bằng</dt>
          <dd>Google</dd>
        </dl>
      </section>
    </main>
  )
}
