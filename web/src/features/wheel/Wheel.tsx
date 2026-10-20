interface Props {
  options: string[]
  /** Góc xoay hiện tại (độ, theo chiều kim đồng hồ). */
  rotation: number
  spinning: boolean
  onSpinEnd: () => void
}

const C = 100 // tâm
const R = 96 // bán kính

/** Điểm trên vòng tròn, góc tính từ đỉnh theo chiều kim đồng hồ. */
function point(deg: number, r = R) {
  const rad = (deg * Math.PI) / 180
  return [C + r * Math.sin(rad), C - r * Math.cos(rad)] as const
}

function shorten(label: string, max: number) {
  return label.length > max ? label.slice(0, max - 1) + '…' : label
}

/** Vòng quay SVG: các ô xen kẽ 2 màu theo theme, mũi tên cố định ở đỉnh. */
export default function Wheel({ options, rotation, spinning, onSpinEnd }: Props) {
  const n = options.length
  const slice = 360 / n
  const fontSize = n <= 6 ? 9 : n <= 12 ? 7.5 : n <= 20 ? 6 : 4.5
  const maxChars = n <= 6 ? 16 : n <= 12 ? 14 : 12

  // Ô thứ i: đậm/nhạt xen kẽ; số lẻ ô thì ô cuối dùng màu thứ 3 để không trùng ô đầu
  const tone = (i: number) => (n % 2 === 1 && i === n - 1 ? 'mid' : i % 2 === 0 ? 'dark' : 'light')

  return (
    <span className="wheel-wrap">
      <span className="wheel-pointer" aria-hidden />
      <svg
        viewBox="0 0 200 200"
        className={`wheel ${spinning ? 'spinning' : ''}`}
        style={{ transform: `rotate(${rotation}deg)` }}
        onTransitionEnd={onSpinEnd}
        role="img"
        aria-label={`Vòng quay ${n} lựa chọn`}
      >
        {n === 1 ? (
          <circle cx={C} cy={C} r={R} className="seg dark" />
        ) : (
          options.map((_, i) => {
            const [x1, y1] = point(i * slice)
            const [x2, y2] = point((i + 1) * slice)
            const large = slice > 180 ? 1 : 0
            return (
              <path
                key={i}
                className={`seg ${tone(i)}`}
                d={`M${C} ${C} L${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`}
              />
            )
          })
        )}
        {options.map((label, i) => {
          const mid = (i + 0.5) * slice
          // Nửa trái: lật chữ 180° để không bị đọc ngược
          const flip = mid > 180
          return (
            <text
              key={i}
              className={`seg-label ${tone(i)}`}
              x={flip ? C - R * 0.58 : C + R * 0.58}
              y={C}
              fontSize={fontSize}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${flip ? mid + 90 : mid - 90} ${C} ${C})`}
            >
              {shorten(label, maxChars)}
            </text>
          )
        })}
        <circle cx={C} cy={C} r={R} className="wheel-rim" />
        <circle cx={C} cy={C} r={10} className="wheel-hub" />
      </svg>
    </span>
  )
}
