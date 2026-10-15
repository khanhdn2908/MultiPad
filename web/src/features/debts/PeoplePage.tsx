import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ChevronRight, UserPlus } from 'lucide-react'
import { displayName } from '../../types'
import PersonAmounts from '../../components/PersonAmounts'
import { useDebts, type Person } from './context'

function PersonRow({ person, onAdd }: { person: Person; onAdd?: () => void }) {
  const { profile, owedToMe, iOwe } = person
  return (
    <li className="person-row">
      <Link to={`/debts/people/${profile.id}`} className="friend">
        <span>{displayName(profile)}</span>
        <span className="row">
          <PersonAmounts owedToMe={owedToMe} iOwe={iOwe} />
          <ChevronRight size={18} />
        </span>
      </Link>
      {onAdd && (
        <button className="ghost icon" onClick={onAdd} aria-label="Thêm vào bạn bè" title="Thêm vào bạn bè">
          <UserPlus size={18} />
        </button>
      )}
    </li>
  )
}

export default function PeoplePage() {
  const { people, loading, addFriendByEmail, addFriend } = useDebts()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState<string | null>(null)

  const friends = people.filter((p) => p.isFriend)
  const others = people.filter((p) => !p.isFriend)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    const profile = await addFriendByEmail(email.trim())
    setBusy(false)
    if (profile) {
      setEmail('')
      setAdded(displayName(profile))
    }
  }

  return (
    <>
      <section className="card">
        <h2>Thêm bạn</h2>
        <form onSubmit={submit} className="row">
          <input
            type="email"
            required
            placeholder="Email Google của bạn bè"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setAdded(null)
            }}
          />
          <button type="submit" disabled={busy || !email.trim()}>
            {busy ? 'Đang tìm…' : 'Thêm'}
          </button>
        </form>
        {added && <p className="small">Đã thêm {added} vào bạn bè.</p>}
        <p className="muted small">Người đó cần đăng nhập MultiPad ít nhất 1 lần.</p>
      </section>

      <section className="card">
        <h2>Bạn bè ({friends.length})</h2>
        {loading ? (
          <p className="muted">Đang tải…</p>
        ) : friends.length === 0 ? (
          <p className="muted">Chưa có bạn nào. Thêm bằng email ở trên.</p>
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
          <p className="muted small">Chưa có trong danh sách bạn bè.</p>
          <ul className="list">
            {others.map((p) => (
              <PersonRow key={p.profile.id} person={p} onAdd={() => addFriend(p.profile.id)} />
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
