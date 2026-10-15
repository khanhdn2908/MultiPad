import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import NewDebtForm from '../../components/NewDebtForm'
import { useDebts } from './context'

export default function NewDebtPage() {
  const { friends, people, loading, createDebt, addFriendByEmail } = useDebts()
  const [params] = useSearchParams()
  const [sent, setSent] = useState(false)

  // /debts/new?to=<id>: chọn sẵn người đó, kể cả khi chưa là bạn bè
  const to = params.get('to') ?? undefined
  const preset = people.find((p) => p.profile.id === to && !p.isFriend)
  const contacts = preset ? [preset.profile, ...friends] : friends

  return (
    <section className="card">
      <h2>Tạo khoản nợ</h2>
      {loading ? (
        <p className="muted">Đang tải…</p>
      ) : (
        <NewDebtForm
          contacts={contacts}
          initialOtherId={to}
          onAddByEmail={addFriendByEmail}
          onCreate={async (input) => {
            const ok = await createDebt(input)
            setSent(ok)
            return ok
          }}
        />
      )}
      {sent && (
        <p className="small">
          Đã gửi yêu cầu, chờ người kia xác nhận. <Link to="/debts/history">Xem lịch sử</Link>
        </p>
      )}
    </section>
  )
}
