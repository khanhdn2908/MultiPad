import { Link } from 'react-router'
import { ChevronRight, Users } from 'lucide-react'
import { displayName } from '../../types'
import PersonAmounts from '../../components/PersonAmounts'
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

/** Số tiền nợ theo từng người. Kết bạn / huỷ kết bạn nằm ở chức năng Bạn bè. */
export default function PeoplePage() {
  const { people, loading } = useDebts()
  const friends = people.filter((p) => p.isFriend)
  const others = people.filter((p) => !p.isFriend)

  return (
    <>
      <section className="card">
        <div className="row between">
          <h2>Bạn bè ({friends.length})</h2>
          <Link to="/friends" className="small back">
            <Users size={16} /> Quản lý bạn bè
          </Link>
        </div>
        {loading ? (
          <p className="muted">Đang tải…</p>
        ) : friends.length === 0 ? (
          <p className="muted">
            Chưa có bạn nào. <Link to="/friends">Kết bạn bằng mã 6 số</Link>
          </p>
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
          <p className="muted small">Chưa là bạn bè.</p>
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
