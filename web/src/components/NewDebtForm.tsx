import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { UserPlus } from 'lucide-react'
import { formatNumber, parseAmount } from '../lib/format'
import { displayName, type Direction, type NewDebt, type Profile } from '../types'

interface Props {
  /** Người có thể chọn nhanh (bạn bè). */
  contacts: Profile[]
  /** Chọn sẵn 1 người (vd mở từ trang chi tiết người đó). */
  initialOtherId?: string
  /** Thêm bạn mới bằng email; trả về profile hoặc null nếu không tìm thấy. */
  onAddByEmail: (email: string) => Promise<Profile | null>
  onCreate: (input: NewDebt) => Promise<boolean>
}

export default function NewDebtForm({ contacts, initialOtherId, onAddByEmail, onCreate }: Props) {
  const [otherId, setOtherId] = useState<string | null>(initialOtherId ?? null)
  const [showEmail, setShowEmail] = useState(contacts.length === 0)
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [direction, setDirection] = useState<Direction>('they_owe')
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const selected = contacts.find((p) => p.id === otherId)

  async function addByEmail() {
    if (!email.trim()) return
    setAdding(true)
    const profile = await onAddByEmail(email.trim())
    setAdding(false)
    if (profile) {
      setOtherId(profile.id)
      setEmail('')
      setShowEmail(false)
    }
  }

  // Enter trong ô email = thêm bạn, không gửi cả form
  function onEmailKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addByEmail()
    }
  }

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
        <button
          type="button"
          className={`chip add ${showEmail ? 'on' : ''}`}
          onClick={() => setShowEmail((v) => !v)}
          aria-expanded={showEmail}
        >
          <UserPlus size={16} /> Thêm bạn
        </button>
      </div>

      {showEmail && (
        <div className="row">
          <input
            type="email"
            placeholder="Email Google của bạn mới"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onEmailKey}
          />
          <button type="button" onClick={addByEmail} disabled={adding || !email.trim()}>
            {adding ? 'Đang tìm…' : 'Thêm'}
          </button>
        </div>
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
