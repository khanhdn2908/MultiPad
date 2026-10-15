import { useState, type FormEvent } from 'react'
import { formatNumber, parseAmount } from '../lib/format'
import { displayName, type Direction, type NewDebt, type Profile } from '../types'

interface Props {
  /** Những người đã từng giao dịch — gợi ý khi gõ email. */
  contacts: Profile[]
  onCreate: (input: NewDebt) => Promise<boolean>
}

export default function NewDebtForm({ contacts, onCreate }: Props) {
  const [email, setEmail] = useState('')
  const [direction, setDirection] = useState<Direction>('they_owe')
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !amount) return
    setBusy(true)
    const ok = await onCreate({ email: email.trim(), direction, amount, note: note.trim() || null })
    setBusy(false)
    if (ok) {
      setAmount(0)
      setNote('')
    }
  }

  return (
    <form onSubmit={submit} className="stack">
      <input
        type="email"
        list="contacts"
        required
        placeholder="Email Google của người kia"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <datalist id="contacts">
        {contacts.map((p) => (
          <option key={p.id} value={p.email}>
            {displayName(p)}
          </option>
        ))}
      </datalist>

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

      <button type="submit" disabled={busy || !email.trim() || !amount}>
        {busy ? 'Đang gửi…' : 'Gửi yêu cầu'}
      </button>
    </form>
  )
}
