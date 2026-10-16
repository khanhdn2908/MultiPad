import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { UserPlus } from 'lucide-react'
import { formatNumber, parseAmount } from '../lib/format'
import { displayName, type Direction, type NewDebt, type Profile } from '../types'

interface Props {
  /** Người có thể chọn (bạn bè). */
  contacts: Profile[]
  /** Chọn sẵn 1 người (vd mở từ trang chi tiết người đó). */
  initialOtherId?: string
  onCreate: (input: NewDebt) => Promise<boolean>
}

export default function NewDebtForm({ contacts, initialOtherId, onCreate }: Props) {
  const [otherId, setOtherId] = useState<string | null>(initialOtherId ?? null)
  const [direction, setDirection] = useState<Direction>('they_owe')
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const selected = contacts.find((p) => p.id === otherId)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!otherId || !amount) return
    setBusy(true)
    const ok = await onCreate({ otherId, direction, amount, note: note.trim() || null })
    setBusy(false)
    if (ok) {
      setAmount(0)
      setNote('')
    }
  }

  return (
    <form onSubmit={submit} className="stack">
      <span className="small muted">Gửi cho</span>
      <div className="chips" role="radiogroup" aria-label="Chọn người">
        {contacts.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === otherId}
            className={`chip ${p.id === otherId ? 'on' : ''}`}
            onClick={() => setOtherId(p.id)}
          >
            {displayName(p)}
          </button>
        ))}
        <Link to="/debts/people" className="chip add">
          <UserPlus size={16} /> Kết bạn
        </Link>
      </div>
      {contacts.length === 0 && (
        <p className="muted small">Chưa có bạn bè. Bấm "Kết bạn" để trao đổi mã 6 số.</p>
      )}

      <div className="segmented">
        <button
          type="button"
          className={direction === 'they_owe' ? 'on' : ''}
          onClick={() => setDirection('they_owe')}
        >
          Họ nợ tôi
        </button>
        <button
          type="button"
          className={direction === 'i_owe' ? 'on' : ''}
          onClick={() => setDirection('i_owe')}
        >
          Tôi nợ họ
        </button>
      </div>

      <div className="row wrap">
        <input
          inputMode="numeric"
          placeholder="Số tiền (đ)"
          value={amount ? formatNumber(amount) : ''}
          onChange={(e) => setAmount(parseAmount(e.target.value))}
        />
        <input placeholder="Ghi chú (tuỳ chọn)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <button type="submit" disabled={busy || !selected || !amount}>
        {busy ? 'Đang gửi…' : selected ? `Gửi yêu cầu cho ${displayName(selected)}` : 'Chọn người để gửi'}
      </button>
    </form>
  )
}
