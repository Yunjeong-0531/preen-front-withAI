import { useState } from 'react'
import { Dialog } from '@/common/components/Dialog'
import { AsyncView } from '@/common/components/StatusViews'
import { useTerms } from '@/features/terms/hooks/useTerms'
import { termTitle } from '@/features/terms/termUtils'

const FOOTER_TYPES: { type: string; label: string }[] = [
  { type: 'SERVICE', label: '이용약관' },
  { type: 'PRIVACY', label: '개인정보처리방침' },
]

/** Footer의 이용약관 · 개인정보처리방침. 누르면 `GET /api/terms` 내용을 모달로 보여준다. */
export function TermsLinks() {
  const [openType, setOpenType] = useState<string | null>(null)
  // 모달을 열 때만 조회한다.
  const query = useTerms(openType !== null)
  const term = query.data?.find((item) => item.type === openType)

  return (
    <>
      {FOOTER_TYPES.map(({ type, label }) => (
        <button key={type} type="button" onClick={() => setOpenType(type)}>
          {label}
        </button>
      ))}
      <Dialog
        open={openType !== null}
        title={term ? termTitle(term) : '약관'}
        onClose={() => setOpenType(null)}
        footer={
          <button
            type="button"
            className="btn"
            onClick={() => setOpenType(null)}
          >
            닫기
          </button>
        }
      >
        <AsyncView
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          isEmpty={!term}
        >
          {term?.content}
        </AsyncView>
      </Dialog>
    </>
  )
}
