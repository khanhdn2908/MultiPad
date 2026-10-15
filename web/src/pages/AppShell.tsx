import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { House, LogOut, UserRound } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { ShellContext } from '../shell'
import type { Profile } from '../types'
import ThemeToggle from '../components/ThemeToggle'

/** Khung chung: thanh trên cùng (nút về Home, hồ sơ, theme, đăng xuất) + nội dung trang. */
export default function AppShell({ session }: { session: Session }) {
  const me = session.user.id
  const meta = session.user.user_metadata
  const [profile, setProfile] = useState<Profile | null>(null)
  const atHome = useLocation().pathname === '/'

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('id', me)
      .maybeSingle()
      .then(({ data }) => setProfile(data))
  }, [me])

  const myName: string = profile?.display_name || meta.full_name || session.user.email || ''

  async function updateDisplayName(name: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: name })
      .eq('id', me)
      .select()
      .single()
    if (error) return error.message
    setProfile(data)
    return null
  }

  const context: ShellContext = { session, profile, myName, updateDisplayName }

  return (
    <div className="page">
      <header className="topbar">
        <div className="row">
          {!atHome && (
            <Link to="/" className="home-btn" aria-label="Về trang chủ" title="Về trang chủ">
              <House size={20} />
            </Link>
          )}
          <h1>MultiPad</h1>
        </div>
        <div className="row">
          <Link to="/profile" className="me" title="Hồ sơ của bạn" aria-label="Hồ sơ của bạn">
            {meta.avatar_url ? (
              <img className="avatar" src={meta.avatar_url} alt="" referrerPolicy="no-referrer" />
            ) : (
              <UserRound size={22} />
            )}
            <span className="small user-name">{myName}</span>
          </Link>
          <ThemeToggle />
          <button
            className="ghost icon"
            onClick={() => supabase.auth.signOut()}
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <Outlet context={context} />
    </div>
  )
}
