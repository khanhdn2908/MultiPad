import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { FriendRequest, Profile } from '../../types'

const FRIEND_SELECT = 'friend:profiles!friends_friend_id_fkey(*)'
const REQUEST_SELECT =
  '*, from:profiles!friend_requests_from_id_fkey(*), to:profiles!friend_requests_to_id_fkey(*)'

export interface FriendsState {
  friends: Profile[]
  /** Lời mời người khác gửi mình. */
  incoming: FriendRequest[]
  /** Lời mời mình gửi, chờ họ đồng ý. */
  outgoing: FriendRequest[]
  loading: boolean
  error: string | null
  /** Nhập mã 6 số của người kia để gửi lời mời. */
  sendRequest: (code: string) => Promise<{ error: string } | { profile: Profile }>
  respond: (requestId: string, accept: boolean) => Promise<boolean>
  cancel: (requestId: string) => Promise<boolean>
  /** Huỷ kết bạn (cả 2 chiều). */
  remove: (friendId: string) => Promise<boolean>
}

/**
 * Dữ liệu bạn bè dùng chung cho cả app (gọi 1 lần ở AppShell).
 * Các chức năng khác (sổ nợ, …) đọc danh sách bạn bè qua useShell().friends.
 */
export function useFriendsData(me: string): FriendsState {
  const [friends, setFriends] = useState<Profile[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [f, r] = await Promise.all([
      supabase.from('friends').select(FRIEND_SELECT),
      supabase
        .from('friend_requests')
        .select(REQUEST_SELECT)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])
    const err = f.error ?? r.error
    if (err) setError(err.message)
    else {
      setFriends(
        ((f.data ?? []) as unknown as { friend: Profile }[])
          .map((x) => x.friend)
          .sort((a, b) => (a.display_name || a.email).localeCompare(b.display_name || b.email)),
      )
      setRequests((r.data ?? []) as FriendRequest[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    // Lời mời mới / bên kia đồng ý → tải lại
    const channel = supabase
      .channel('friend_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load, me])

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

  const incoming = useMemo(() => requests.filter((r) => r.to_id === me), [requests, me])
  const outgoing = useMemo(() => requests.filter((r) => r.from_id === me), [requests, me])

  async function sendRequest(code: string) {
    const { data, error } = await supabase.rpc('send_friend_request', { p_code: code })
    if (error) return { error: error.message }
    const result = data as { error?: string; profile?: Profile }
    if (result.profile) {
      await load()
      return { profile: result.profile }
    }
    return { error: result.error ?? 'Không gửi được lời mời.' }
  }

  return {
    friends,
    incoming,
    outgoing,
    loading,
    error,
    sendRequest,
    respond: (id, accept) => run(supabase.rpc('respond_friend_request', { p_id: id, p_accept: accept })),
    cancel: (id) => run(supabase.from('friend_requests').delete().eq('id', id)),
    remove: (friendId) => run(supabase.rpc('remove_friend', { p_friend_id: friendId })),
  }
}
