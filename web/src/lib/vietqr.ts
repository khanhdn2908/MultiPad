export interface Bank {
  bin: string
  shortName: string
  name: string
}

let banksCache: Promise<Bank[]> | null = null

/** Danh sách ngân hàng hỗ trợ VietQR (API công khai của vietqr.io). */
export function fetchBanks(): Promise<Bank[]> {
  banksCache ??= fetch('https://api.vietqr.io/v2/banks')
    .then((r) => r.json())
    .then((json: { data: Bank[] }) => json.data.map(({ bin, shortName, name }) => ({ bin, shortName, name })))
    .catch((err) => {
      banksCache = null
      throw err
    })
  return banksCache
}

/** Bỏ dấu tiếng Việt + ký tự đặc biệt — nội dung chuyển khoản và tên TK chỉ nhận ASCII. */
export function toAscii(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

interface QrInput {
  bankBin: string
  accountNo: string
  accountName: string
  amount: number
  info: string
}

/** Ảnh VietQR (Quick Link của vietqr.io), quét được bằng mọi app ngân hàng VN. */
export function vietQrUrl({ bankBin, accountNo, accountName, amount, info }: QrInput) {
  const params = new URLSearchParams({ addInfo: info, accountName })
  if (amount > 0) params.set('amount', String(amount))
  return `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?${params}`
}
