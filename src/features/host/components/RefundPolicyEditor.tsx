import { useState, type FormEvent } from 'react'
import { useToast } from '@/common/components/Toast'
import { getErrorMessage } from '@/common/utils/error'
import type { AccommodationDetail } from '@/features/accommodation/public'
import { hostApi, hostErrorMessages } from '@/features/host/api/hostApi'

interface RuleRow {
  daysBefore: string
  /** 화면은 %로 입력받는다 */
  percent: string
}

interface RefundPolicyEditorProps {
  detail: AccommodationDetail
  onChanged: () => void
}

/** "체크인 N일 전까지 M% 환불" 규칙을 행으로 추가·삭제한다. */
export function RefundPolicyEditor({
  detail,
  onChanged,
}: RefundPolicyEditorProps) {
  const toast = useToast()
  const [policyText, setPolicyText] = useState(
    detail.refundPolicy?.policyText ?? '',
  )
  const [rows, setRows] = useState<RuleRow[]>(
    () =>
      detail.refundPolicy?.rules
        .slice()
        .sort((a, b) => b.daysBefore - a.daysBefore)
        .map((rule) => ({
          daysBefore: String(rule.daysBefore),
          percent: String(Math.round(rule.refundRate * 100)),
        })) ?? [{ daysBefore: '7', percent: '100' }],
  )
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updateRow = (index: number, patch: Partial<RuleRow>) =>
    setRows((previous) =>
      previous.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError('')
    if (rows.length === 0)
      return setFormError('환불 규칙을 한 개 이상 입력해 주세요.')
    const rules = rows.map((row) => ({
      daysBefore: Number(row.daysBefore),
      percent: Number(row.percent),
    }))
    const invalid = rules.some(
      (rule, index) =>
        rows[index].daysBefore === '' ||
        rows[index].percent === '' ||
        !Number.isInteger(rule.daysBefore) ||
        rule.daysBefore < 0 ||
        !Number.isInteger(rule.percent) ||
        rule.percent < 0 ||
        rule.percent > 100,
    )
    if (invalid) {
      return setFormError(
        '일수는 0 이상의 정수, 환불 비율은 0~100 사이의 정수로 입력해 주세요.',
      )
    }
    if (new Set(rules.map((rule) => rule.daysBefore)).size !== rules.length) {
      return setFormError(hostErrorMessages['ACCOMMODATION-008'])
    }

    setSubmitting(true)
    try {
      await hostApi.putRefundPolicy(detail.id, {
        policyText: policyText.trim() || undefined,
        // refundRate는 0~1, 소수 둘째 자리까지
        rules: rules.map((rule) => ({
          daysBefore: rule.daysBefore,
          refundRate: rule.percent / 100,
        })),
      })
      toast.show('환불정책을 저장했습니다.', 'success')
      onChanged()
    } catch (error) {
      setFormError(getErrorMessage(error, hostErrorMessages))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="stack">
      <h3>환불정책</h3>
      <small>
        저장하면 새 버전이 만들어집니다. 이미 들어온 예약은 예약 당시의
        환불정책을 그대로 따릅니다.
      </small>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <ul className="stack plain-list">
          {rows.map((row, index) => (
            <li key={index} className="rule-row">
              <span>체크인</span>
              <input
                className="input"
                type="number"
                min={0}
                aria-label={`규칙 ${index + 1} 일수`}
                value={row.daysBefore}
                onChange={(event) =>
                  updateRow(index, { daysBefore: event.target.value })
                }
              />
              <span>일 전까지</span>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                aria-label={`규칙 ${index + 1} 환불 비율`}
                value={row.percent}
                onChange={(event) =>
                  updateRow(index, { percent: event.target.value })
                }
              />
              <span>% 환불</span>
              <button
                type="button"
                className="btn btn-small"
                aria-label={`규칙 ${index + 1} 삭제`}
                onClick={() =>
                  setRows((previous) => previous.filter((_, i) => i !== index))
                }
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
        <div className="actions">
          <button
            type="button"
            className="btn btn-small"
            disabled={rows.length >= 20}
            onClick={() =>
              setRows((previous) => [
                ...previous,
                { daysBefore: '', percent: '' },
              ])
            }
          >
            규칙 추가
          </button>
        </div>
        <label className="field">
          <span className="field-label">안내 문구 (선택)</span>
          <textarea
            value={policyText}
            maxLength={5000}
            onChange={(event) => setPolicyText(event.target.value)}
          />
        </label>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? '저장 중…' : '환불정책 저장'}
          </button>
        </div>
      </form>
    </section>
  )
}
