import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { displayName } from '../../types'
import Balance from '../../components/Balance'
import { useDebts } from './context'

export default function PeoplePage() {
  const { people, loading } = useDebts()

  return (
    <section className="card">
      <h2>Mọi người</h2>
      {loading ? (
        <p className="muted">Đang tải…</p>
      ) : people.length === 0 ? (
        <p className="muted">
          Chưa giao dịch với ai. <Link to="/debts/new">Tạo khoản nợ đầu tiên</Link>
        </p>
      ) : (
        <>
          <ul className="list">
            {people.map(({ profile, balance }) => (
              <li key={profile.id}>
                <Link to={`/debts/people/${profile.id}`} className="friend">
                  <span>{displayName(profile)}</span>
                  <span className="row">
                    <Balance value={balance} />
                    <ChevronRight size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {people.some((p) => p.balance < 0) && (
            <p className="muted small">Chọn người bạn đang nợ để hiện QR trả tiền.</p>
          )}
        </>
      )}
    </section>
  )
}
