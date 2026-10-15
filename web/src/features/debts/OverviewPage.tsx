import { Link } from 'react-router'
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react'
import Balance from '../../components/Balance'
import PersonAmounts from '../../components/PersonAmounts'
import { formatVnd } from '../../lib/format'
import { displayName } from '../../types'
import DebtItem from '../../components/DebtItem'
import { useDebts } from './context'

export default function OverviewPage() {
  const { totals, incoming, people, actions, loading } = useDebts()
  // Ai còn khoản chưa trả (theo từng chiều, không bù trừ)
  const open = people.filter((p) => p.owedToMe > 0 || p.iOwe > 0)
  const net = totals.owedToMe - totals.iOwe

  return (
    <>
      <section className="summary">
        <div className="card stat in">
          <span className="muted small">Người khác nợ tôi</span>
          <strong className="pos">
            <ArrowDownLeft size={22} strokeWidth={2.5} aria-hidden />
            {formatVnd(totals.owedToMe)}
          </strong>
        </div>
        <div className="card stat out">
          <span className="muted small">Tôi nợ người khác</span>
          <strong className="neg">
            <ArrowUpRight size={22} strokeWidth={2.5} aria-hidden />
            {formatVnd(totals.iOwe)}
          </strong>
        </div>
      </section>
      {(totals.owedToMe > 0 || totals.iOwe > 0) && (
        <p className="small net">
          <span className="muted">Nếu bù trừ hết:</span>{' '}
          {net === 0 ? <b>Hoà, không ai nợ ai</b> : <Balance value={net} />}
        </p>
      )}

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

      {open.length > 0 && (
        <section className="card">
          <h2>Khoản chưa trả</h2>
          <ul className="list">
            {open.map(({ profile, owedToMe, iOwe }) => (
              <li key={profile.id}>
                <Link to={`/debts/people/${profile.id}`} className="friend">
                  <span>{displayName(profile)}</span>
                  <span className="row">
                    <PersonAmounts owedToMe={owedToMe} iOwe={iOwe} />
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
