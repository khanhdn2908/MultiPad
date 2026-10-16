import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { displayName, type FriendRequest } from '../../types'
import { formatDate } from '../../lib/format'
import PersonAmounts from '../../components/PersonAmounts'
import FriendCodeCard from '../../components/FriendCodeCard'
import { useDebts, type Person } from './context'

function PersonRow({ person }: { person: Person }) {
  const { profile, owedToMe, iOwe } = person
  return (
    <li>
      <Link to={`/debts/people/${profile.id}`} className="friend">
        <span>{displayName(profile)}</span>
        <span className="row">
          <PersonAmounts owedToMe={owedToMe} iOwe={iOwe} />
          <ChevronRight size={18} />
        </span>
      </Link>
    </li>
  )
}

function RequestRow({ request, children }: { request: FriendRequest; children: ReactNode }) {
  return (
    <li className="debt">
      <div>
        <b>{displayName(request.from)}</b>
        <div className="muted small">{formatDate(request.created_at)}</div>
      </div>
      <div className="row">{children}</div>
    </li>
  )
}

export default function PeoplePage() {
  const { people, loading, friendRequests, sendFriendRequest, respondFriendRequest, cancelFriendRequest } =
    useDebts()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const friends = people.filter((p) => p.isFriend)
  const others = people.filter((p) => !p.isFriend)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setBusy(true)
    const res = await sendFriendRequest(code)
    setBusy(false)
    if ('profile' in res) {
      setCode('')
      setResult({ ok: true, text: `Đã gửi lời mời tới ${displayName(res.profile)}. Chờ họ đồng ý.` })
    } else {
      setResult({ ok: false, text: res.error })
    }
  }

  return (
    <>
      {friendRequests.incoming.length > 0 && (
        <section className="card requests">
          <h2>Lời mời kết bạn ({friendRequests.incoming.length})</h2>
          <ul className="list">
            {friendRequests.incoming.map((r) => (
              <RequestRow key={r.id} request={r}>
                <button onClick={() => respondFriendRequest(r.id, true)}>Đồng ý</button>
                <button className="ghost danger" onClick={() => respondFriendRequest(r.id, false)}>
                  Từ chối
                </button>
              </RequestRow>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Mã kết bạn của bạn</h2>
        <p className="muted small">Tạo mã rồi gửi cho bạn bè. Mã có hiệu lực 5 phút.</p>
        <FriendCodeCard />
      </section>

      <section className="card">
        <h2>Nhập mã của bạn bè</h2>
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

      {friendRequests.outgoing.length > 0 && (
        <section className="card">
          <h2>Đã gửi, chờ đồng ý</h2>
          <ul className="list">
            {friendRequests.outgoing.map((r) => (
              <li key={r.id} className="debt">
                <div>
                  <b>{displayName(r.to)}</b>
                  <div className="muted small">{formatDate(r.created_at)}</div>
                </div>
                <button className="ghost danger" onClick={() => cancelFriendRequest(r.id)}>
                  Huỷ
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Bạn bè ({friends.length})</h2>
        {loading ? (
          <p className="muted">Đang tải…</p>
        ) : friends.length === 0 ? (
          <p className="muted">Chưa có bạn nào. Trao đổi mã kết bạn ở trên.</p>
        ) : (
          <ul className="list">
            {friends.map((p) => (
              <PersonRow key={p.profile.id} person={p} />
            ))}
          </ul>
        )}
        {people.some((p) => p.iOwe > 0) && (
          <p className="muted small">Chọn người bạn đang nợ để hiện QR trả tiền.</p>
        )}
      </section>

      {others.length > 0 && (
        <section className="card">
          <h2>Từng giao dịch</h2>
          <p className="muted small">Chưa là bạn bè. Muốn kết bạn thì trao đổi mã như trên.</p>
          <ul className="list">
            {others.map((p) => (
              <PersonRow key={p.profile.id} person={p} />
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
