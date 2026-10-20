import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import AppShell from './pages/AppShell'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import FriendsPage from './features/friends/FriendsPage'
import WheelPage from './features/wheel/WheelPage'
import DebtsLayout from './features/debts/DebtsLayout'
import OverviewPage from './features/debts/OverviewPage'
import NewDebtPage from './features/debts/NewDebtPage'
import PeoplePage from './features/debts/PeoplePage'
import PersonPage from './features/debts/PersonPage'
import HistoryPage from './features/debts/HistoryPage'
import BankPage from './features/debts/BankPage'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (loading) return <div className="center muted">Đang tải…</div>
  if (!session) return <LoginPage />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell session={session} />}>
          <Route index element={<HomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="wheel" element={<WheelPage />} />
          <Route path="debts" element={<DebtsLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="new" element={<NewDebtPage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="people/:id" element={<PersonPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="bank" element={<BankPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
