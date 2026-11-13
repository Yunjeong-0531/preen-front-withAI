import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ForbiddenView, NotFoundView } from '@/common/components/Screens'
import { ErrorState, LoadingBlock } from '@/common/components/StatusViews'
import { useToast } from '@/common/components/Toast'
import { fieldErrorsOf, getErrorMessage, statusOf } from '@/common/utils/error'
import type {
  AccommodationDetail,
  ListingStatus,
} from '@/features/accommodation/public'
import {
  hostApi,
  hostErrorMessages,
  type AccommodationBody,
} from '@/features/host/api/hostApi'
import { AccommodationForm } from '@/features/host/components/AccommodationForm'
import { RefundPolicyEditor } from '@/features/host/components/RefundPolicyEditor'
import { RoomManager } from '@/features/host/components/RoomManager'
import {
  useHostAccommodation,
  useInvalidateHost,
} from '@/features/host/hooks/useHostQueries'
import { LISTING_LABELS } from '@/features/host/pages/HostHomePage'
import '@/features/host/host.css'

function ListingPanel({
  detail,
  onChanged,
}: {
  detail: AccommodationDetail
  onChanged: () => void
}) {
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const hasActiveRoom = detail.rooms.some((room) => room.status === 'ACTIVE')
  const hasRefundPolicy = !!detail.refundPolicy
  const ready = hasActiveRoom && hasRefundPolicy
  const status = LISTING_LABELS[detail.listingStatus]

  const change = async (listingStatus: ListingStatus) => {
    setPending(true)
    try {
      await hostApi.changeListingStatus(detail.id, listingStatus)
      toast.show('공개 상태를 바꿨습니다.', 'success')
      onChanged()
    } catch (error) {
      toast.show(getErrorMessage(error, hostErrorMessages), 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="card card-muted">
      <div className="page-title">
        <h3>공개 상태</h3>
        <span className={status.className}>{status.label}</span>
      </div>
      {detail.listingStatus !== 'LISTED' && (
        <ul className="plain-list stack checklist">
          <li>{hasActiveRoom ? '✓' : '·'} 판매 중인 객실 등록</li>
          <li>{hasRefundPolicy ? '✓' : '·'} 환불정책 설정</li>
        </ul>
      )}
      <div className="actions">
        {detail.listingStatus !== 'LISTED' && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready || pending}
            onClick={() => void change('LISTED')}
          >
            공개하기
          </button>
        )}
        {detail.listingStatus === 'LISTED' && (
          <>
            <button
              type="button"
              className="btn"
              disabled={pending}
              onClick={() => void change('HIDDEN')}
            >
              숨기기
            </button>
            <Link className="btn" to={`/accommodations/${detail.id}`}>
              공개 화면 보기
            </Link>
          </>
        )}
        {detail.listingStatus === 'HIDDEN' && (
          <button
            type="button"
            className="btn"
            disabled={pending}
            onClick={() => void change('DRAFT')}
          >
            작성 중으로 되돌리기
          </button>
        )}
      </div>
      {!ready && detail.listingStatus !== 'LISTED' && (
        <small>
          판매 중인 객실과 환불정책을 모두 등록해야 공개할 수 있습니다.
        </small>
      )}
    </section>
  )
}

/** 숙소 관리: 공개 상태, 정보, 객실, 환불정책 */
export function HostAccommodationPage() {
  const params = useParams()
  const id = Number(params.id)
  const valid = Number.isInteger(id) && id > 0
  const query = useHostAccommodation(valid ? id : undefined)
  const invalidate = useInvalidateHost()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  if (!valid) return <NotFoundView />
  if (query.isPending) return <LoadingBlock fullPage />
  if (query.isError) {
    const status = statusOf(query.error)
    if (status === 404) return <NotFoundView title="숙소를 찾을 수 없습니다" />
    // 본인 소유가 아닌 숙소는 서버가 거부한다.
    if (status === 403) return <ForbiddenView />
    return (
      <main>
        <ErrorState
          error={query.error}
          messages={hostErrorMessages}
          onRetry={() => void query.refetch()}
        />
      </main>
    )
  }

  const detail = query.data

  const handleSave = async (body: AccommodationBody) => {
    setSaving(true)
    setFormError('')
    setServerErrors({})
    try {
      await hostApi.updateAccommodation(detail.id, body)
      invalidate()
      toast.show('숙소 정보를 저장했습니다.', 'success')
    } catch (error) {
      setServerErrors(fieldErrorsOf(error))
      setFormError(getErrorMessage(error, hostErrorMessages))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="medium">
      <div className="page-title">
        <h2>{detail.name}</h2>
        <Link className="btn btn-small" to="/host">
          목록으로
        </Link>
      </div>
      <ListingPanel detail={detail} onChanged={invalidate} />
      <RoomManager detail={detail} onChanged={invalidate} />
      <RefundPolicyEditor
        key={detail.refundPolicy?.id ?? 'none'}
        detail={detail}
        onChanged={invalidate}
      />
      <section className="stack">
        <h3>숙소 정보</h3>
        <AccommodationForm
          initial={detail}
          submitLabel="숙소 정보 저장"
          submitting={saving}
          serverErrors={serverErrors}
          formError={formError}
          onSubmit={handleSave}
        />
      </section>
    </main>
  )
}
