import { useOutletContext } from 'react-router'
import type { DebtActions } from '../../components/DebtItem'
import type { Debt, NewDebt, Profile } from '../../types'

export interface Person {
  profile: Profile
  /** Dương = họ nợ mình, âm = mình nợ họ (chỉ khoản đã chấp nhận, chưa trả). */
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
  /** Trả về profile vừa thêm, hoặc null nếu không tìm thấy / lỗi (lỗi đã được hiển thị). */
  addFriendByEmail: (email: string) => Promise<Profile | null>
  addFriend: (id: string) => Promise<boolean>
  removeFriend: (id: string) => Promise<boolean>
}

/** Dữ liệu nợ dùng chung cho các trang con của DebtsLayout. */
export const useDebts = () => useOutletContext<DebtsContext>()
