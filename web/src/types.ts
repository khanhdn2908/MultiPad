export type Direction = 'they_owe' | 'i_owe'
export type DebtStatus = 'pending' | 'accepted' | 'rejected'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
}

export interface Debt {
  id: string
  creditor_id: string
  debtor_id: string
  created_by: string
  amount: number
  note: string | null
  status: DebtStatus
  created_at: string
  responded_at: string | null
  paid_at: string | null
  /** Người nợ báo đã trả, chờ chủ nợ xác nhận. */
  paid_claimed_at: string | null
  creditor: Profile
  debtor: Profile
}

export interface NewDebt {
  otherId: string
  direction: Direction
  amount: number
  note: string | null
}

export const displayName = (p: Profile) => p.display_name || p.email

/** Người còn lại trong khoản nợ (không phải mình). */
export const counterparty = (d: Debt, me: string) => (d.creditor_id === me ? d.debtor : d.creditor)

/** Việc mình cần xử lý: yêu cầu nợ người khác gửi tới, hoặc lời báo đã trả cần xác nhận. */
export const needsMyAction = (d: Debt, me: string) =>
  (d.status === 'pending' && d.created_by !== me) ||
  (d.status === 'accepted' && d.creditor_id === me && !d.paid_at && !!d.paid_claimed_at)

/** Dương = họ nợ mình, âm = mình nợ họ. */
export const signedAmount = (d: Debt, me: string) => (d.creditor_id === me ? d.amount : -d.amount)

export interface BankAccount {
  user_id: string
  bank_bin: string
  bank_name: string
  account_no: string
  account_name: string
}

export interface FriendRequest {
  id: string
  from_id: string
  to_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  from: Profile
  to: Profile
}

export interface FriendCode {
  code: string
  expires_at: string
}
