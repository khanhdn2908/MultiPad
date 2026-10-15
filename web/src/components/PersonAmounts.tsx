import Balance from './Balance'

/** Số tiền 2 chiều với 1 người (không bù trừ): xanh = họ nợ mình, đỏ = mình nợ họ. */
export default function PersonAmounts({ owedToMe, iOwe }: { owedToMe: number; iOwe: number }) {
  if (!owedToMe && !iOwe) return <Balance value={0} />
  return (
    <span className="row">
      {owedToMe > 0 && <Balance value={owedToMe} />}
      {iOwe > 0 && <Balance value={-iOwe} />}
    </span>
  )
}
