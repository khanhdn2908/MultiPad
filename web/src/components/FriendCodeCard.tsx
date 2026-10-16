import { useEffect, useState } from 'react'
import { Copy, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { FriendCode } from '../types'

/** Mã kết bạn 6 số của mình: tạo mới, đếm ngược 5 phút, sao chép. */
export default function FriendCodeCard() {
  const [code, setCode] = useState<FriendCode | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Mã còn hiệu lực từ lần trước (RLS chỉ trả về mã của mình)
  useEffect(() => {
    supabase
      .from('friend_codes')
      .select('code, expires_at')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCode(data)
          setNow(Date.now())
        }
      })
  }, [])

  // Đếm ngược mỗi giây khi đang có mã
  useEffect(() => {
    if (!code) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [code])

  const secondsLeft = code ? Math.max(0, Math.ceil((Date.parse(code.expires_at) - now) / 1000)) : 0
  const active = secondsLeft > 0

  async function generate() {
    setBusy(true)
    setMessage(null)
    const { data, error } = await supabase.rpc('create_friend_code')
    setBusy(false)
    if (error) setMessage(error.message)
    else {
      setCode(data as FriendCode)
      setNow(Date.now())
    }
  }

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code.code)
      setMessage('Đã sao chép mã')
    } catch {
      setMessage('Không sao chép được, hãy đọc mã cho bạn bè')
    }
  }

  const mm = Math.floor(secondsLeft / 60)
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="stack">
      {active && code ? (
        <>
          <div className="friend-code" aria-label={`Mã kết bạn ${code.code.split('').join(' ')}`}>
            {code.code.slice(0, 3)}
            <span aria-hidden> </span>
            {code.code.slice(3)}
          </div>
          <div className="row between wrap">
            <span className="small">
              Còn <b className="countdown">{mm}:{ss}</b>
            </span>
            <div className="row">
              <button type="button" className="ghost" onClick={copy}>
                <Copy size={16} /> Sao chép
              </button>
              <button type="button" className="ghost" onClick={generate} disabled={busy}>
                <RefreshCw size={16} /> Mã mới
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {code && <p className="muted small">Mã cũ đã hết hạn.</p>}
          <button type="button" onClick={generate} disabled={busy}>
            {busy ? 'Đang tạo…' : 'Tạo mã kết bạn'}
          </button>
        </>
      )}
      {message && <p className="muted small">{message}</p>}
    </div>
  )
}
