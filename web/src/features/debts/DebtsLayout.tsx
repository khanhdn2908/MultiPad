import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { History, Landmark, LayoutDashboard, SquarePlus, Users } from 'lucide-react'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { formatVnd } from '../../lib/format'
import { useShell } from '../../shell'
import { counterparty, displayName, needsMyAction, signedAmount, type Debt, type NewDebt, type Profile } from '../../types'
import type { DebtActions } from '../../components/DebtItem'
import type { DebtsContext, Person } from './context'

const DEBT_SELECT =
  '*, creditor:profiles!debts_creditor_id_fkey(*), debtor:profiles!debts_debtor_id_fkey(*)'

const TABS = [
  { to: '/debts', end: true, label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/debts/new', label: 'Tạo', icon: SquarePlus },
  { to: '/debts/people', label: 'Mọi người', icon: Users },
  { to: '/debts/history', label: 'Lịch sử', icon: History },
  { to: '/debts/bank', label: 'Ngân hàng', icon: Landmark },
]

/** Chức năng Quản lý nợ: tải dữ liệu 1 lần, thanh nav chuyển giữa các trang con. */
export default function DebtsLayout() {
  const { session, myName } = useShell()
  const me = session.user.id
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('debts')
      .select(DEBT_SELECT)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setDebts((data ?? []) as Debt[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    // Tải lại khi có yêu cầu mới / bên kia chấp nhận / báo trả
    const channel = supabase
      .channel('debts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  /** Chạy một thao tác ghi rồi tải lại dữ liệu. */
  const run = useCallback(
    async (op: PromiseLike<{ error: PostgrestError | null }>) => {
      const { error } = await op
      if (error) {
        setError(error.message)
        return false
      }
      setError(null)
      await load()
      return true
    },
    [load],
  )

  // Những người từng giao dịch + số dư (chỉ tính khoản đã chấp nhận, chưa trả)
  const people = useMemo(() => {
    const map = new Map<string, Person>()
    for (const d of debts) {
      const p = counterparty(d, me)
      const entry = map.get(p.id) ?? { profile: p, balance: 0 }
      if (d.status === 'accepted' && !d.paid_at) entry.balance += signedAmount(d, me)
      map.set(p.id, entry)
    }
    return [...map.values()].sort((a, b) => displayName(a.profile).localeCompare(displayName(b.profile)))
  }, [debts, me])

  const totals = useMemo(() => {
    let owedToMe = 0
    let iOwe = 0
    for (const { balance } of people) {
      if (balance > 0) owedToMe += balance
      else iOwe -= balance
    }
    return { owedToMe, iOwe }
  }, [people])

  const incoming = useMemo(() => debts.filter((d) => needsMyAction(d, me)), [debts, me])

  async function createDebt({ email, direction, amount, note }: NewDebt) {
    const { data, error } = await supabase.rpc('find_user_by_email', { p_email: email })
    if (error) {
      setError(error.message)
      return false
    }
    const other = (data as Profile[])[0]
    if (!other) {
      setError(`Không tìm thấy "${email}". Người đó cần đăng nhập MultiPad ít nhất 1 lần.`)
      return false
    }
    return run(
      supabase.from('debts').insert({
        creditor_id: direction === 'they_owe' ? me : other.id,
        debtor_id: direction === 'they_owe' ? other.id : me,
        amount,
        note,
      }),
    )
  }

  const actions: DebtActions = {
    me,
    onRespond: (d, accept) => run(supabase.rpc('respond_debt', { p_id: d.id, p_accept: accept })),
    onSetPaid: (d, paid) => run(supabase.rpc('set_debt_paid', { p_id: d.id, p_paid: paid })),
    onClaimPaid: (list, claim) =>
      run(supabase.rpc('claim_debt_paid', { p_ids: list.map((d) => d.id), p_claim: claim })),
    onDelete: (d) => {
      if (confirm(`Xoá khoản ${formatVnd(d.amount)}?`)) run(supabase.from('debts').delete().eq('id', d.id))
    },
  }

  const context: DebtsContext = {
    me,
    myName,
    debts,
    loading,
    people,
    totals,
    incoming,
    actions,
    createDebt,
  }

  return (
    <div className="module">
      <nav className="tabs" aria-label="Quản lý nợ">
        {TABS.map(({ to, end, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className="tab">
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
            {to === '/debts' && incoming.length > 0 && <b className="count">{incoming.length}</b>}
          </NavLink>
        ))}
      </nav>

      <main className="stack module-body">
        {error && <p className="error">{error}</p>}
        <Outlet context={context} />
      </main>
    </div>
  )
}
