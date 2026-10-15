const vnd = new Intl.NumberFormat('vi-VN')

export const formatNumber = (n: number) => vnd.format(n)
export const formatVnd = (n: number) => `${vnd.format(n)}đ`
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN')

/** "50.000" / "50000đ" → 50000. Giới hạn 12 chữ số để không vượt quá số an toàn. */
export const parseAmount = (s: string) => Number(s.replace(/\D/g, '').slice(0, 12)) || 0
