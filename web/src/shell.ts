import { useOutletContext } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from './types'
import type { FriendsState } from './features/friends/useFriendsData'

export interface ShellContext {
  session: Session
  /** Profile của mình (null khi đang tải). */
  profile: Profile | null
  /** Tên hiển thị: tên tự đặt → tên Google → email. */
  myName: string
  /** Trả về thông báo lỗi, hoặc null khi thành công. */
  updateDisplayName: (name: string) => Promise<string | null>
  /** Bạn bè dùng chung cho mọi chức năng. */
  friends: FriendsState
}

/** Dữ liệu dùng chung cho mọi trang bên trong AppShell. */
export const useShell = () => useOutletContext<ShellContext>()
