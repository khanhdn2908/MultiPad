import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { counterparty, displayName } from '../../types'
import Balance from '../../components/Balance'
import DebtItem from '../../components/DebtItem'
import PayCard from '../../components/PayCard'
import { useDebts } from './context'

/** Chi tiết 1 người: số dư, QR trả nợ (nếu mình đang nợ), lịch sử với người đó. */
export default function PersonPage() {
  const { id } = useParams()
  const { me, myName, debts, people, actions, loading } = useDebts()
  const person = people.find((p) => p.profile.id === id)

  const back = (
    <Link to="/debts/people" className="back small">
      <ArrowLeft size={16} /> Mọi người
    </Link>
  )

  if (!person)
    return (
      <>
        {back}
        <p className="muted">{loading ? 'Đang tải…' : 'Không tìm thấy người này.'}</p>
      </>
    )

  const withPerson = debts.filter((d) => counterparty(d, me).id === id)
  const owedToThem = withPerson.filter(
    (d) => d.debtor_id === me && d.status === 'accepted' && !d.paid_at,
  )

  return (
    <>
      {back}
      <section className="card">
        <h2>{displayName(person.profile)}</h2>
        <Balance value={person.balance} long />
      </section>

      {person.balance < 0 && (
        <section className="card">
          <h2>Trả nợ</h2>
          <PayCard
            key={person.profile.id}
            creditor={person.profile}
            owed={-person.balance}
            payerName={myName}
            debts={owedToThem}
            onClaimPaid={(claim) => actions.onClaimPaid(owedToThem, claim)}
          />
        </section>
      )}

      <section className="card">
        <h2>Lịch sử</h2>
        {withPerson.length === 0 ? (
          <p className="muted">Chưa có khoản nào.</p>
        ) : (
          <ul className="list">
            {withPerson.map((d) => (
              <DebtItem key={d.id} debt={d} {...actions} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
