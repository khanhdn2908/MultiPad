import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { formatVnd } from '../lib/format'

/** Hiển thị số dư: dương = họ nợ mình (xanh ↙), âm = mình nợ họ (đỏ ↗). */
export default function Balance({ value, long = false }: { value: number; long?: boolean }) {
  if (value === 0) return <span className="muted small">{long ? 'Không ai nợ ai' : 'Hết nợ'}</span>
  if (value > 0)
    return (
      <span className="pos amount">
        <ArrowDownLeft size={16} strokeWidth={2.5} aria-hidden />
        {long ? `Nợ bạn ${formatVnd(value)}` : `+${formatVnd(value)}`}
      </span>
    )
  return (
    <span className="neg amount">
      <ArrowUpRight size={16} strokeWidth={2.5} aria-hidden />
      {long ? `Bạn nợ ${formatVnd(-value)}` : `−${formatVnd(-value)}`}
    </span>
  )
}
