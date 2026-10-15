import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { fetchBanks, toAscii, type Bank } from '../lib/vietqr'
import type { BankAccount } from '../types'

/** Cài đặt tài khoản ngân hàng nhận tiền của chính mình. */
export default function BankAccountForm({ me }: { me: string }) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [bankBin, setBankBin] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [accountName, setAccountName] = useState('')
  const [saved, setSaved] = useState<BankAccount | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchBanks()
      .then(setBanks)
      .catch(() => setMessage('Không tải được danh sách ngân hàng'))
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', me)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setSaved(data)
        setBankBin(data.bank_bin)
        setAccountNo(data.account_no)
        setAccountName(data.account_name)
      })
  }, [me])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const bank = banks.find((b) => b.bin === bankBin)
    if (!bank) return
    setBusy(true)
    const row = {
      user_id: me,
      bank_bin: bank.bin,
      bank_name: bank.shortName,
      account_no: accountNo.trim(),
      account_name: toAscii(accountName).toUpperCase(),
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('bank_accounts').upsert(row)
    setBusy(false)
    if (error) setMessage(error.message)
    else {
      setSaved(row)
      setAccountName(row.account_name)
      setMessage('Đã lưu')
    }
  }

  return (
    <>
      {saved && (
        <p className="small">
          Đang dùng: <b>{saved.bank_name}</b> · {saved.account_no} · {saved.account_name}
        </p>
      )}
      <form onSubmit={submit} className="stack">
        <select required value={bankBin} onChange={(e) => setBankBin(e.target.value)}>
          <option value="" disabled>
            Chọn ngân hàng
          </option>
          {banks.map((b) => (
            <option key={b.bin} value={b.bin}>
              {b.shortName} — {b.name}
            </option>
          ))}
        </select>
        <input
          required
          inputMode="numeric"
          placeholder="Số tài khoản"
          value={accountNo}
          onChange={(e) => setAccountNo(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
        />
        <input
          required
          placeholder="Tên chủ tài khoản (VD: NGUYEN VAN A)"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
        <button type="submit" disabled={busy || !bankBin || !accountNo || !accountName.trim()}>
          {busy ? 'Đang lưu…' : 'Lưu'}
        </button>
        {message && <p className="muted small">{message}</p>}
      </form>
    </>
  )
}
