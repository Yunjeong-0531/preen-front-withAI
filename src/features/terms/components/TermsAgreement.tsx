import { useState } from 'react'
import { AsyncView } from '@/common/components/StatusViews'
import { useTerms } from '@/features/terms/hooks/useTerms'
import { termTitle } from '@/features/terms/termUtils'

interface TermsAgreementProps {
  agreedIds: number[]
  onChange: (ids: number[]) => void
  error?: string
}

/** 약관 동의 체크 UI. 필수·선택을 구분해 보여주고 "전체 동의"를 제공한다. */
export function TermsAgreement({
  agreedIds,
  onChange,
  error,
}: TermsAgreementProps) {
  const query = useTerms()
  const [openId, setOpenId] = useState<number | null>(null)
  const terms = query.data ?? []
  const allAgreed =
    terms.length > 0 && terms.every((t) => agreedIds.includes(t.id))

  return (
    <fieldset className="card terms-agreement">
      <legend className="field-label">약관 동의</legend>
      <AsyncView
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={terms.length === 0}
      >
        <label className="check">
          <input
            type="checkbox"
            checked={allAgreed}
            onChange={(event) =>
              onChange(event.target.checked ? terms.map((t) => t.id) : [])
            }
          />
          <strong>전체 동의</strong>
        </label>
        {terms.map((term) => (
          <div key={term.id} className="stack">
            <div className="price-row">
              <label className="check">
                <input
                  type="checkbox"
                  checked={agreedIds.includes(term.id)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...agreedIds, term.id]
                        : agreedIds.filter((id) => id !== term.id),
                    )
                  }
                />
                <span>
                  [{term.required ? '필수' : '선택'}] {termTitle(term)}
                </span>
              </label>
              <button
                type="button"
                className="btn-link"
                aria-expanded={openId === term.id}
                onClick={() => setOpenId(openId === term.id ? null : term.id)}
              >
                {openId === term.id ? '닫기' : '보기'}
              </button>
            </div>
            {openId === term.id && (
              <small className="form-notice">{term.content}</small>
            )}
          </div>
        ))}
      </AsyncView>
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </fieldset>
  )
}
