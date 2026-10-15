import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatNumber, formatVnd, parseAmount } from '../lib/format'
import { toAscii, vietQrUrl } from '../lib/vietqr'
import { displayName, type BankAccount, type Debt, type Profile } from '../types'

interface Props {
  creditor: Profile
  /** Số tiền mình đang nợ người này (dương). */
  owed: number
  payerName: string
  /** Các khoản mình còn nợ người này (đã chấp nhận, chưa trả). */
  debts: Debt[]
  onClaimPaid: (claim: boolean) => void
}

/** QR chuyển khoản tới tài khoản ngân hàng của chủ nợ. */
export default function PayCard({ creditor, owed, payerName, debts, onClaimPaid }: Props) {
  const [bank, setBank] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState(owed)

  useEffect(() => {
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', creditor.id)
      .maybeSingle()
      .then(({ data }) => {
        setBank(data)
        setLoading(false)
      })
  }, [creditor.id])

  const name = displayName(creditor)
  const info = `MultiPad ${toAscii(payerName)}`.slice(0, 25)

  const allClaimed = debts.length > 0 && debts.every((d) => d.paid_claimed_at)
  if (allClaimed)
    return (
      <div className="pay">
        <p>
          Bạn đã báo trả, đang chờ <b>{name}</b> xác nhận đã nhận tiền.{' '}
          <button className="ghost small" onClick={() => onClaimPaid(false)}>
            Huỷ báo trả
          </button>
        </p>
      </div>
    )

  if (loading) return <p className="muted">Đang tải thông tin ngân hàng…</p>
  if (!bank) return <p className="muted">{name} chưa cài đặt tài khoản nhận tiền.</p>

  return (
    <div className="pay">
      <img
        className="qr"
        alt={`VietQR chuyển khoản cho ${name}`}
        src={vietQrUrl({
          bankBin: bank.bank_bin,
          accountNo: bank.account_no,
          accountName: bank.account_name,
          amount,
          info,
        })}
      />
      <dl className="pay-info">
        <dt>Ngân hàng</dt>
        <dd>{bank.bank_name}</dd>
        <dt>Số tài khoản</dt>
        <dd>
          <b>{bank.account_no}</b>
        </dd>
        <dt>Chủ tài khoản</dt>
        <dd>{bank.account_name}</dd>
        <dt>Số tiền</dt>
        <dd>
          <input
            inputMode="numeric"
            value={amount ? formatNumber(amount) : ''}
            onChange={(e) => setAmount(parseAmount(e.target.value))}
          />
          {amount !== owed && (
            <button className="ghost small" onClick={() => setAmount(owed)}>
              Trả hết {formatVnd(owed)}
            </button>
          )}
        </dd>
        <dt>Nội dung</dt>
        <dd>{info}</dd>
      </dl>
      <p className="muted small">
        Quét bằng app ngân hàng để chuyển, rồi bấm nút bên dưới để {name} xác nhận đã nhận tiền.
      </p>
      <button onClick={() => onClaimPaid(true)} disabled={debts.length === 0}>
        Tôi đã chuyển khoản ({debts.length} khoản)
      </button>
    </div>
  )
}
