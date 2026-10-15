import { useState } from 'react'

type Theme = 'light' | 'dark'

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme
  if (set === 'light' || set === 'dark') return set
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Nút chuyển sáng/tối. Mặc định theo hệ thống, lựa chọn được nhớ trong localStorage. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    // Thanh địa chỉ trên điện thoại đổi màu theo nền
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute('content', next === 'dark' ? '#161616' : '#f4f3ef')
    }
    try {
      localStorage.setItem('theme', next)
    } catch {
      // trình duyệt chặn storage: vẫn đổi được trong phiên này
    }
    setTheme(next)
  }

  return (
    <button className="ghost" onClick={toggle} aria-label="Đổi giao diện sáng/tối">
      {theme === 'dark' ? '☀ Sáng' : '☾ Tối'}
    </button>
  )
}
