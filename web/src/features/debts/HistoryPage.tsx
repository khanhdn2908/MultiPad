import { needsMyAction } from '../../types'
import DebtItem from '../../components/DebtItem'
import { useDebts } from './context'

export default function HistoryPage() {
  const { me, debts, actions, loading } = useDebts()
  // Việc cần xác nhận đã nằm ở Tổng quan
  const history = debts.filter((d) => !needsMyAction(d, me))

  return (
    <section className="card">
      <h2>Lịch sử</h2>
      {loading ? (
        <p className="muted">Đang tải…</p>
      ) : history.length === 0 ? (
        <p className="muted">Chưa có khoản nào.</p>
      ) : (
        <ul className="list">
          {history.map((d) => (
            <DebtItem key={d.id} debt={d} {...actions} />
          ))}
        </ul>
      )}
    </section>
  )
}
