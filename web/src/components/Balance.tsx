import { formatVnd } from '../lib/format'

/** Hiển thị số dư: dương = họ nợ mình, âm = mình nợ họ. */
export default function Balance({ value, long = false }: { value: number; long?: boolean }) {
  if (value === 0) return <span className="muted small">{long ? 'Không ai nợ ai' : 'Hết nợ'}</span>
  if (value > 0)
    return <span className="pos">{long ? `Nợ bạn ${formatVnd(value)}` : `+${formatVnd(value)}`}</span>
  return <span className="neg">{long ? `Bạn nợ ${formatVnd(-value)}` : `−${formatVnd(-value)}`}</span>
}
