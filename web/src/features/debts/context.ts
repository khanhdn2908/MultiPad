import { useOutletContext } from 'react-router'
import type { DebtActions } from '../../components/DebtItem'
import type { Debt, FriendRequest, NewDebt, Profile } from '../../types'

/** Các con số chỉ tính khoản đã chấp nhận, chưa trả. */
export interface Person {
  profile: Profile
  /** Tổng họ nợ mình. */
  owedToMe: number
  /** Tổng mình nợ họ. */
  iOwe: number
  /** Sau bù trừ: dương = họ nợ mình, âm = mình nợ họ. */
  balance: number
  isFriend: boolean
}

export interface DebtsContext {
  me: string
  myName: string
  debts: Debt[]
  loading: boolean
  /** Bạn bè + những người từng giao dịch. */
  people: Person[]
  friends: Profile[]
  totals: { owedToMe: number; iOwe: number }
  /** Việc mình cần xác nhận. */
  incoming: Debt[]
  actions: DebtActions
  createDebt: (input: NewDebt) => Promise<boolean>
  /** Lời mời kết bạn đang chờ: người khác gửi mình / mình gửi người khác. */
  friendRequests: { incoming: FriendRequest[]; outgoing: FriendRequest[] }
  /** Nhập mã 6 số của người kia để gửi lời mời. */
  sendFriendRequest: (code: string) => Promise<{ error: string } | { profile: Profile }>
  respondFriendRequest: (id: string, accept: boolean) => Promise<boolean>
  cancelFriendRequest: (id: string) => Promise<boolean>
  /** Huỷ kết bạn (cả 2 chiều). */
  removeFriend: (id: string) => Promise<boolean>
}

/** Dữ liệu nợ dùng chung cho các trang con của DebtsLayout. */
export const useDebts = () => useOutletContext<DebtsContext>()
