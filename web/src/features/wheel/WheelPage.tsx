import { useEffect, useMemo, useState } from 'react'
import { Shuffle, Trash2, Users, X } from 'lucide-react'
import { useShell } from '../../shell'
import { displayName } from '../../types'
import Wheel from './Wheel'
import { randomFloat, randomInt, shuffle } from './random'

const STORAGE_KEY = 'multipad.wheel.options'
const MAX_OPTIONS = 50
const DEFAULT_OPTIONS = ['Bún bò', 'Phở', 'Cơm tấm', 'Bánh mì', 'Mì cay', 'Lẩu'].join('\n')

function loadText() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_OPTIONS
  } catch {
    return DEFAULT_OPTIONS
  }
}

/** Vòng quay ngẫu nhiên: mỗi dòng 1 lựa chọn, lưu trên trình duyệt này. */
export default function WheelPage() {
  const { friends } = useShell()
  const [text, setText] = useState(loadText)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])

  const options = useMemo(
    () =>
      text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_OPTIONS),
    [text],
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, text)
    } catch {
      // trình duyệt chặn storage: vẫn dùng được trong phiên này
    }
  }, [text])

  function spin() {
    if (spinning || options.length < 2) return
    const n = options.length
    const slice = 360 / n
    const winner = randomInt(n)
    // Góc trên vòng quay sẽ dừng dưới mũi tên: trong ô thắng, tránh sát mép
    const landing = (winner + 0.15 + randomFloat() * 0.7) * slice
    const base = rotation - (rotation % 360)
    const turns = 5 + randomInt(3)
    setPending(options[winner])
    setResult(null)
    setSpinning(true)
    setRotation(base + 360 * turns + (360 - landing))
  }

  function onSpinEnd() {
    if (!spinning) return
    setSpinning(false)
    setResult(pending)
    if (pending) setHistory((h) => [pending, ...h].slice(0, 10))
  }

  function removeResult() {
    if (!result) return
    const lines = text.split('\n')
    const i = lines.findIndex((l) => l.trim() === result)
    if (i >= 0) lines.splice(i, 1)
    setText(lines.join('\n'))
    setResult(null)
  }

  function addFriends() {
    const names = friends.friends.map(displayName).filter((name) => !options.includes(name))
    if (names.length) setText([...options, ...names].join('\n'))
  }

  return (
    <main className="stack module-body">
      <h2 className="page-title">Vòng quay ngẫu nhiên</h2>

      <div className="pair wheel-layout">
        <section className="card stack wheel-card">
          {options.length >= 2 ? (
            <button
              type="button"
              className="wheel-button"
              onClick={spin}
              disabled={spinning}
              aria-label="Quay"
            >
              <Wheel options={options} rotation={rotation} spinning={spinning} onSpinEnd={onSpinEnd} />
            </button>
          ) : (
            <p className="muted">Cần ít nhất 2 lựa chọn để quay.</p>
          )}

          <button type="button" className="spin-btn" onClick={spin} disabled={spinning || options.length < 2}>
            {spinning ? 'Đang quay…' : 'Quay!'}
          </button>

          <div className="wheel-result" aria-live="polite">
            {result && (
              <>
                <span className="muted small">Kết quả</span>
                <strong>{result}</strong>
                <button type="button" className="ghost small" onClick={removeResult}>
                  <X size={14} /> Loại khỏi vòng quay
                </button>
              </>
            )}
          </div>
        </section>

        <section className="card stack">
          <div className="row between">
            <h2>Lựa chọn ({options.length})</h2>
            <span className="muted small">Mỗi dòng 1 lựa chọn</span>
          </div>
          <textarea
            className="wheel-options"
            rows={10}
            value={text}
            disabled={spinning}
            onChange={(e) => {
              setText(e.target.value)
              setResult(null)
            }}
            placeholder={'Lựa chọn 1\nLựa chọn 2\n…'}
            aria-label="Các lựa chọn, mỗi dòng một lựa chọn"
          />
          {text.split('\n').filter((s) => s.trim()).length > MAX_OPTIONS && (
            <p className="muted small">Chỉ dùng {MAX_OPTIONS} lựa chọn đầu tiên.</p>
          )}
          <div className="row wrap">
            <button
              type="button"
              className="ghost"
              disabled={spinning || options.length < 2}
              onClick={() => setText(shuffle(options).join('\n'))}
            >
              <Shuffle size={16} /> Trộn
            </button>
            <button
              type="button"
              className="ghost"
              disabled={spinning || friends.friends.length === 0}
              onClick={addFriends}
              title={friends.friends.length === 0 ? 'Chưa có bạn bè' : 'Thêm tên bạn bè vào vòng quay'}
            >
              <Users size={16} /> Thêm bạn bè
            </button>
            <button
              type="button"
              className="ghost danger"
              disabled={spinning || !text}
              onClick={() => {
                setText('')
                setResult(null)
              }}
            >
              <Trash2 size={16} /> Xoá hết
            </button>
          </div>

          {history.length > 0 && (
            <>
              <h2>Lần quay gần đây</h2>
              <ol className="wheel-history">
                {history.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
