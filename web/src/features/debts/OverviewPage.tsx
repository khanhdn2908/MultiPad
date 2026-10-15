import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { formatVnd } from '../../lib/format'
import { displayName } from '../../types'
import DebtItem from '../../components/DebtItem'
import { useDebts } from './context'

export default function OverviewPage() {
  const { totals, incoming, people, actions, loading } = useDebts()
  const owing = people.filter((p) => p.balance < 0)

  return (
    <>
      <section className="summary">
        <div className="card stat">
          <span className="muted small">Người khác nợ tôi</span>
          <strong className="pos">{formatVnd(totals.owedToMe)}</strong>
        </div>
        <div className="card stat">
          <span className="muted small">Tôi nợ người khác</span>
          <strong className="neg">{formatVnd(totals.iOwe)}</strong>
        </div>
      </section>

      {incoming.length > 0 ? (
        <section className="card requests">
          <h2>Chờ bạn xác nhận ({incoming.length})</h2>
          <ul className="list">
            {incoming.map((d) => (
              <DebtItem key={d.id} debt={d} {...actions} />
            ))}
          </ul>
        </section>
      ) : (
        !loading && (
          <section className="card">
            <h2>Chờ bạn xác nhận</h2>
            <p className="muted">Không có yêu cầu nào.</p>
          </section>
        )
      )}

      {owing.length > 0 && (
        <section className="card">
          <h2>Bạn đang nợ</h2>
          <ul className="list">
            {owing.map(({ profile, balance }) => (
              <li key={profile.id}>
                <Link to={`/debts/people/${profile.id}`} className="friend">
                  <span>{displayName(profile)}</span>
                  <span className="row">
                    <span className="neg">{formatVnd(-balance)}</span>
                    <ChevronRight size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
