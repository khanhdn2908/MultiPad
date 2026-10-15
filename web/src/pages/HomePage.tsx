import { Link } from 'react-router'
import {
  CalendarDays,
  FileText,
  ListChecks,
  SquareKanban,
  Table2,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useShell } from '../shell'

interface Feature {
  label: string
  icon: LucideIcon
  /** Chưa có `to` = chức năng sắp ra mắt. */
  to?: string
}

const FEATURES: Feature[] = [
  { label: 'Quản lý nợ', icon: Wallet, to: '/debts' },
  { label: 'Tài liệu', icon: FileText },
  { label: 'Bảng tính', icon: Table2 },
  { label: 'Lịch trình', icon: CalendarDays },
  { label: 'Kanban', icon: SquareKanban },
  { label: 'Checklist', icon: ListChecks },
]

/** Màn hình chính: các nút chức năng chỉ có biểu tượng. */
export default function HomePage() {
  const { myName } = useShell()

  return (
    <main>
      <p className="muted greeting">Xin chào, {myName.split(' ').at(-1)}</p>
      <nav className="launcher" aria-label="Chức năng">
        {FEATURES.map(({ label, icon: Icon, to }) =>
          to ? (
            <Link key={label} to={to} className="tile" aria-label={label} title={label}>
              <Icon size={40} strokeWidth={1.75} />
            </Link>
          ) : (
            <span
              key={label}
              className="tile soon"
              role="img"
              aria-label={`${label} (sắp ra mắt)`}
              title={`${label} · sắp ra mắt`}
            >
              <Icon size={40} strokeWidth={1.75} />
            </span>
          ),
        )}
      </nav>
    </main>
  )
}
