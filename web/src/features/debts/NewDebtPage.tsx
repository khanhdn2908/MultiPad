import { useState } from 'react'
import { Link } from 'react-router'
import NewDebtForm from '../../components/NewDebtForm'
import { useDebts } from './context'

export default function NewDebtPage() {
  const { people, createDebt } = useDebts()
  const [sent, setSent] = useState(false)

  return (
    <section className="card">
      <h2>Tạo khoản nợ</h2>
      <NewDebtForm
        contacts={people.map((p) => p.profile)}
        onCreate={async (input) => {
          const ok = await createDebt(input)
          setSent(ok)
          return ok
        }}
      />
      {sent && (
        <p className="small">
          Đã gửi yêu cầu, chờ người kia xác nhận. <Link to="/debts/history">Xem lịch sử</Link>
        </p>
      )}
    </section>
  )
}
