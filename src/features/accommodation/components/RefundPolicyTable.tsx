import { formatRate } from '@/common/utils/format'
import type { RefundRule } from '@/features/accommodation/types'

interface RefundPolicyTableProps {
  policyText?: string
  rules?: RefundRule[]
}

/** "체크인 N일 전까지 M% 환불" 규칙 표. 숙소 상세와 예약 스냅샷이 같이 쓴다. */
export function RefundPolicyTable({
  policyText,
  rules = [],
}: RefundPolicyTableProps) {
  const sorted = [...rules].sort((a, b) => b.daysBefore - a.daysBefore)
  if (!policyText && sorted.length === 0) {
    return <small>등록된 환불정책이 없습니다.</small>
  }
  return (
    <div className="stack">
      {policyText && <p className="pre-line">{policyText}</p>}
      {sorted.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">취소 시점</th>
              <th scope="col">환불 비율</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((rule) => (
              <tr key={rule.daysBefore}>
                <td>
                  {rule.daysBefore === 0
                    ? '체크인 당일까지'
                    : `체크인 ${rule.daysBefore}일 전까지`}
                </td>
                <td>{formatRate(rule.refundRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <small>위 기간에 해당하지 않으면 환불되지 않습니다.</small>
    </div>
  )
}
