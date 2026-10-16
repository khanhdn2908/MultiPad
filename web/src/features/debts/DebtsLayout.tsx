import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { History, Landmark, LayoutDashboard, SquarePlus, Users } from 'lucide-react'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { formatVnd } from '../../lib/format'
import { useShell } from '../../shell'
import {
  counterparty,
  displayName,
  needsMyAction,
  signedAmount,
  type Debt,
  type FriendRequest,
  type NewDebt,
  type Profile,
} from '../../types'
import type { DebtActions } from '../../components/DebtItem'
import type { DebtsContext, Person } from './context'

const DEBT_SELECT =
  '*, creditor:profiles!debts_creditor_id_fkey(*), debtor:profiles!debts_debtor_id_fkey(*)'
const FRIEND_SELECT = 'friend:profiles!friends_friend_id_fkey(*)'
const REQUEST_SELECT =
  '*, from:profiles!friend_requests_from_id_fkey(*), to:profiles!friend_requests_to_id_fkey(*)'

const TABS = [
  { to: '/debts', end: true, label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/debts/new', label: 'Tạo', icon: SquarePlus },
  { to: '/debts/people', label: 'Bạn bè', icon: Users },
  { to: '/debts/history', label: 'Lịch sử', icon: History },
  { to: '/debts/bank', label: 'Ngân hàng', icon: Landmark },
]

/** Chức năng Quản lý nợ: tải dữ liệu 1 lần, thanh nav chuyển giữa các trang con. */
export default function DebtsLayout() {
  const { session, myName } = useShell()
  const me = session.user.id
  const [debts, setDebts] = useState<Debt[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [d, f, r] = await Promise.all([
      supabase.from('debts').select(DEBT_SELECT).order('created_at', { ascending: false }),
      supabase.from('friends').select(FRIEND_SELECT),
      supabase
        .from('friend_requests')
        .select(REQUEST_SELECT)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])
    const err = d.error ?? f.error ?? r.error
    if (err) setError(err.message)
    else {
      setDebts((d.data ?? []) as Debt[])
      setFriends(((f.data ?? []) as unknown as { friend: Profile }[]).map((x) => x.friend))
      setRequests((r.data ?? []) as FriendRequest[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    // Tải lại khi có yêu cầu nợ / lời mời kết bạn mới, bên kia chấp nhận, báo trả…
    const channel = supabase
      .channel('debts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => load())
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

  // Bạn bè + những người từng giao dịch, kèm số dư (chỉ tính khoản đã chấp nhận, chưa trả)
  const people = useMemo(() => {
    const map = new Map<string, Person>()
    const blank = (profile: Profile, isFriend: boolean): Person => ({
      profile,
      owedToMe: 0,
      iOwe: 0,
      balance: 0,
      isFriend,
    })
    for (const p of friends) map.set(p.id, blank(p, true))
    for (const d of debts) {
      const p = counterparty(d, me)
      const entry = map.get(p.id) ?? blank(p, false)
      if (d.status === 'accepted' && !d.paid_at) {
        if (d.creditor_id === me) entry.owedToMe += d.amount
        else entry.iOwe += d.amount
        entry.balance += signedAmount(d, me)
      }
      map.set(p.id, entry)
    }
    return [...map.values()].sort((a, b) => displayName(a.profile).localeCompare(displayName(b.profile)))
  }, [debts, friends, me])

  // Tổng thật từng chiều (không bù trừ), để A nợ B 100k và B nợ A 100k vẫn hiện đủ
  const totals = useMemo(() => {
    let owedToMe = 0
    let iOwe = 0
    for (const p of people) {
      owedToMe += p.owedToMe
      iOwe += p.iOwe
    }
    return { owedToMe, iOwe }
  }, [people])

  const incoming = useMemo(() => debts.filter((d) => needsMyAction(d, me)), [debts, me])

  function createDebt({ otherId, direction, amount, note }: NewDebt) {
    return run(
      supabase.from('debts').insert({
        creditor_id: direction === 'they_owe' ? me : otherId,
        debtor_id: direction === 'they_owe' ? otherId : me,
        amount,
        note,
      }),
    )
  }

  const friendRequests = useMemo(
    () => ({
      incoming: requests.filter((r) => r.to_id === me),
      outgoing: requests.filter((r) => r.from_id === me),
    }),
    [requests, me],
  )

  async function sendFriendRequest(code: string) {
    const { data, error } = await supabase.rpc('send_friend_request', { p_code: code })
    if (error) return { error: error.message }
    const result = data as { error?: string; profile?: Profile }
    if (result.profile) {
      await load()
      return { profile: result.profile }
    }
    return { error: result.error ?? 'Không gửi được lời mời.' }
  }

  const respondFriendRequest = (id: string, accept: boolean) =>
    run(supabase.rpc('respond_friend_request', { p_id: id, p_accept: accept }))
  const cancelFriendRequest = (id: string) => run(supabase.from('friend_requests').delete().eq('id', id))
  const removeFriend = (id: string) => run(supabase.rpc('remove_friend', { p_friend_id: id }))

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
    friends,
    totals,
    incoming,
    actions,
    createDebt,
    friendRequests,
    sendFriendRequest,
    respondFriendRequest,
    cancelFriendRequest,
    removeFriend,
  }

  return (
    <div className="module">
      <nav className="tabs" aria-label="Quản lý nợ">
        {TABS.map(({ to, end, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className="tab">
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
            {to === '/debts' && incoming.length > 0 && <b className="count">{incoming.length}</b>}
            {to === '/debts/people' && friendRequests.incoming.length > 0 && (
              <b className="count">{friendRequests.incoming.length}</b>
            )}
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
