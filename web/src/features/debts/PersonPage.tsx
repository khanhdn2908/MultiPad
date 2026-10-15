import { Link, useParams } from 'react-router'
import { ArrowLeft, SquarePlus, UserMinus, UserPlus } from 'lucide-react'
import { counterparty, displayName } from '../../types'
import Balance from '../../components/Balance'
import PersonAmounts from '../../components/PersonAmounts'
import DebtItem from '../../components/DebtItem'
import PayCard from '../../components/PayCard'
import { useDebts } from './context'

/** Chi tiết 1 người: số dư, QR trả nợ (nếu mình đang nợ), lịch sử với người đó. */
export default function PersonPage() {
  const { id } = useParams()
  const { me, myName, debts, people, actions, loading, addFriend, removeFriend } = useDebts()
  const person = people.find((p) => p.profile.id === id)

  const back = (
    <Link to="/debts/people" className="back small">
      <ArrowLeft size={16} /> Bạn bè
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
      <section className="card stack">
        <h2>{displayName(person.profile)}</h2>
        <span className="muted small">{person.profile.email}</span>
        <PersonAmounts owedToMe={person.owedToMe} iOwe={person.iOwe} />
        {person.owedToMe > 0 && person.iOwe > 0 && (
          <span className="small">
            <span className="muted">Nếu bù trừ:</span>{' '}
            {person.balance === 0 ? <b>Hoà, không ai nợ ai</b> : <Balance value={person.balance} long />}
          </span>
        )}
        <div className="row wrap">
          <Link to={`/debts/new?to=${person.profile.id}`} className="btn">
            <SquarePlus size={18} /> Tạo khoản nợ
          </Link>
          {person.isFriend ? (
            <button
              className="ghost danger"
              onClick={() => {
                if (confirm(`Xoá ${displayName(person.profile)} khỏi bạn bè? Các khoản nợ vẫn giữ nguyên.`))
                  removeFriend(person.profile.id)
              }}
            >
              <UserMinus size={16} /> Xoá bạn
            </button>
          ) : (
            <button className="ghost" onClick={() => addFriend(person.profile.id)}>
              <UserPlus size={16} /> Thêm bạn
            </button>
          )}
        </div>
      </section>

      {person.iOwe > 0 && (
        <section className="card">
          <h2>Trả nợ</h2>
          {person.owedToMe > 0 && (
            <p className="small muted">
              {displayName(person.profile)} cũng đang nợ bạn. Có thể thoả thuận bù trừ: mỗi bên bấm "Tôi đã
              trả" / "Đã nhận tiền" ở các khoản trong lịch sử bên dưới, chỉ chuyển phần chênh lệch (sửa số
              tiền trong QR).
            </p>
          )}
          <PayCard
            key={person.profile.id}
            creditor={person.profile}
            owed={person.iOwe}
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
