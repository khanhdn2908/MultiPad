import BankAccountForm from '../../components/BankAccountForm'
import { useDebts } from './context'

export default function BankPage() {
  const { me } = useDebts()

  return (
    <section className="card">
      <h2>Tài khoản nhận tiền</h2>
      <p className="muted small">Người đang nợ bạn sẽ thấy tài khoản này dưới dạng VietQR để trả.</p>
      <BankAccountForm me={me} />
    </section>
  )
}
