import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { UserMinus, Wallet } from 'lucide-react'
import { useShell } from '../../shell'
import { formatDate } from '../../lib/format'
import { displayName } from '../../types'
import FriendCodeCard from './FriendCodeCard'

/** Chức năng Bạn bè: mã kết bạn, lời mời, danh sách bạn bè. */
export default function FriendsPage() {
  const { friends: state } = useShell()
  const { friends, incoming, outgoing, loading, error, sendRequest, respond, cancel, remove } = state
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setBusy(true)
    const res = await sendRequest(code)
    setBusy(false)
    if ('profile' in res) {
      setCode('')
      setResult({ ok: true, text: `Đã gửi lời mời tới ${displayName(res.profile)}. Chờ họ đồng ý.` })
    } else {
      setResult({ ok: false, text: res.error })
    }
  }

  return (
    <main className="stack module-body">
      <h2 className="page-title">Bạn bè</h2>
      {error && <p className="error">{error}</p>}

      {incoming.length > 0 && (
        <section className="card requests">
          <h2>Lời mời kết bạn ({incoming.length})</h2>
          <ul className="list">
            {incoming.map((r) => (
              <li key={r.id} className="debt">
                <div>
                  <b>{displayName(r.from)}</b>
                  <div className="muted small">{formatDate(r.created_at)}</div>
                </div>
                <div className="row">
                  <button onClick={() => respond(r.id, true)}>Đồng ý</button>
                  <button className="ghost danger" onClick={() => respond(r.id, false)}>
                    Từ chối
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="pair">
        <section className="card">
          <h2>Mã của bạn</h2>
          <p className="muted small">Tạo mã rồi gửi cho bạn bè. Mã có hiệu lực 5 phút.</p>
          <FriendCodeCard />
        </section>

        <section className="card">
          <h2>Nhập mã của bạn bè</h2>
          <p className="muted small">Nhập 6 số bạn bè gửi để gửi lời mời kết bạn.</p>
          <form onSubmit={submit} className="row">
            <input
              className="code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              aria-label="Mã kết bạn 6 số"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                setResult(null)
              }}
            />
            <button type="submit" disabled={busy || code.length !== 6}>
              {busy ? 'Đang gửi…' : 'Gửi lời mời'}
            </button>
          </form>
          {result && <p className={result.ok ? 'small' : 'error'}>{result.text}</p>}
        </section>
      </div>

      {outgoing.length > 0 && (
        <section className="card">
          <h2>Đã gửi, chờ đồng ý</h2>
          <ul className="list">
            {outgoing.map((r) => (
              <li key={r.id} className="debt">
                <div>
                  <b>{displayName(r.to)}</b>
                  <div className="muted small">{formatDate(r.created_at)}</div>
                </div>
                <button className="ghost danger" onClick={() => cancel(r.id)}>
                  Huỷ
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Danh sách bạn bè ({friends.length})</h2>
        {loading ? (
          <p className="muted">Đang tải…</p>
        ) : friends.length === 0 ? (
          <p className="muted">Chưa có bạn nào. Trao đổi mã kết bạn ở trên.</p>
        ) : (
          <ul className="list">
            {friends.map((p) => (
              <li key={p.id} className="debt">
                <div>
                  <b>{displayName(p)}</b>
                  <div className="muted small">{p.email}</div>
                </div>
                <div className="row">
                  <Link
                    to={`/debts/people/${p.id}`}
                    className="btn ghost-link"
                    aria-label={`Sổ nợ với ${displayName(p)}`}
                    title="Sổ nợ"
                  >
                    <Wallet size={16} />
                  </Link>
                  <button
                    className="ghost danger icon"
                    aria-label={`Huỷ kết bạn với ${displayName(p)}`}
                    title="Huỷ kết bạn"
                    onClick={() => {
                      if (confirm(`Huỷ kết bạn với ${displayName(p)}? Các khoản nợ vẫn giữ nguyên.`)) remove(p.id)
                    }}
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
