import { formatDate, formatVnd } from '../lib/format'
import { counterparty, displayName, type Debt } from '../types'

export interface DebtActions {
  me: string
  onRespond: (d: Debt, accept: boolean) => void
  onSetPaid: (d: Debt, paid: boolean) => void
  onClaimPaid: (debts: Debt[], claim: boolean) => void
  onDelete: (d: Debt) => void
}

export default function DebtItem({
  debt: d,
  me,
  onRespond,
  onSetPaid,
  onClaimPaid,
  onDelete,
}: DebtActions & { debt: Debt }) {
  const other = displayName(counterparty(d, me))
  const theyOweMe = d.creditor_id === me
  const mine = d.created_by === me
  const open = d.status === 'accepted' && !d.paid_at
  const claimed = open && !!d.paid_claimed_at

  const badge =
    d.status === 'pending'
      ? { cls: 'pending', text: mine ? 'Chờ xác nhận' : 'Cần bạn xác nhận' }
      : d.status === 'rejected'
        ? { cls: 'rejected', text: 'Bị từ chối' }
        : d.paid_at
          ? { cls: '', text: `Đã trả ${formatDate(d.paid_at)}` }
          : claimed
            ? { cls: 'pending', text: theyOweMe ? `${other} báo đã trả` : 'Chờ xác nhận đã trả' }
            : null

  return (
    <li className={`debt ${d.paid_at || d.status === 'rejected' ? 'done' : ''}`}>
      <div>
        <div>
          {theyOweMe ? `${other} nợ bạn ` : `Bạn nợ ${other} `}
          <strong className={theyOweMe ? 'pos' : 'neg'}>{formatVnd(d.amount)}</strong>
        </div>
        <div className="muted small">
          {formatDate(d.created_at)}
          {d.note && ` · ${d.note}`}
          {badge && <span className={`badge ${badge.cls}`}>{badge.text}</span>}
        </div>
      </div>

      <div className="row">
        {/* Yêu cầu nợ mới */}
        {d.status === 'pending' && !mine && (
          <>
            <button onClick={() => onRespond(d, true)}>Chấp nhận</button>
            <button className="ghost danger" onClick={() => onRespond(d, false)}>
              Từ chối
            </button>
          </>
        )}
        {d.status === 'pending' && mine && (
          <button className="ghost danger" onClick={() => onDelete(d)}>
            Huỷ
          </button>
        )}
        {d.status === 'rejected' && mine && (
          <button className="ghost danger" onClick={() => onDelete(d)}>
            Xoá
          </button>
        )}

        {/* Chủ nợ */}
        {theyOweMe && claimed && (
          <>
            <button onClick={() => onSetPaid(d, true)}>Đã nhận tiền</button>
            <button className="ghost danger" onClick={() => onSetPaid(d, false)}>
              Chưa nhận được
            </button>
          </>
        )}
        {theyOweMe && open && !claimed && (
          <button className="ghost" onClick={() => onSetPaid(d, true)}>
            Đã trả
          </button>
        )}
        {theyOweMe && d.paid_at && (
          <button className="ghost" onClick={() => onSetPaid(d, false)}>
            Bỏ đánh dấu
          </button>
        )}

        {/* Người nợ */}
        {!theyOweMe && open && !claimed && (
          <button className="ghost" onClick={() => onClaimPaid([d], true)}>
            Tôi đã trả
          </button>
        )}
        {!theyOweMe && claimed && (
          <button className="ghost" onClick={() => onClaimPaid([d], false)}>
            Huỷ báo trả
          </button>
        )}
      </div>
    </li>
  )
}
