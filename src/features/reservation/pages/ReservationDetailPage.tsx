import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '@/common/components/Dialog'
import { NotFoundView } from '@/common/components/Screens'
import { ErrorState, LoadingBlock } from '@/common/components/StatusViews'
import { useToast } from '@/common/components/Toast'
import { getErrorMessage, statusOf } from '@/common/utils/error'
import { formatDateTime, formatPrice, formatRate } from '@/common/utils/format'
import { RefundPolicyTable } from '@/features/accommodation/public'
import { reservationApi } from '@/features/reservation/api/reservationApi'
import {
  HoldCountdown,
  PriceBreakdown,
  ReservationStatusBadge,
  stayText,
} from '@/features/reservation/components/ReservationParts'
import { reservationErrorMessages } from '@/features/reservation/errorMessages'
import {
  useHoldRemaining,
  useInvalidateReservations,
  useReservation,
} from '@/features/reservation/hooks/useReservations'
import type { CancelResult } from '@/features/reservation/types'

export function ReservationDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const valid = Number.isInteger(id) && id > 0
  const query = useReservation(valid ? id : undefined)
  const invalidate = useInvalidateReservations()
  const toast = useToast()
  const remaining = useHoldRemaining(query.data)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelResult, setCancelResult] = useState<CancelResult | null>(null)
  const expired = remaining === 0
  const { refetch } = query

  // 제한 시간이 끝나면 예약을 다시 조회한다.
  useEffect(() => {
    if (expired) void refetch()
  }, [expired, refetch])

  if (!valid) return <NotFoundView />
  if (query.isPending) return <LoadingBlock fullPage />
  if (query.isError) {
    if (statusOf(query.error) === 404)
      return <NotFoundView title="예약을 찾을 수 없습니다" />
    return (
      <main className="narrow">
        <ErrorState
          error={query.error}
          messages={reservationErrorMessages}
          onRetry={() => void refetch()}
        />
      </main>
    )
  }

  const reservation = query.data
  const wasPaid = reservation.status === 'CONFIRMED'
  const cancellable =
    reservation.status === 'CONFIRMED' ||
    (reservation.status === 'PENDING' && !expired)

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const result = await reservationApi.cancel(reservation.id)
      // 환불 금액은 취소 응답에만 있다. 이 화면에서만 보여줄 수 있다.
      setCancelResult(result)
      invalidate(reservation.accommodationId)
      toast.show('예약을 취소했습니다.', 'success')
    } catch (error) {
      toast.show(getErrorMessage(error, reservationErrorMessages), 'error')
      void refetch()
    } finally {
      setCancelling(false)
      setConfirmOpen(false)
    }
  }

  return (
    <main className="narrow">
      <div className="page-title">
        <h2>예약 상세</h2>
        <ReservationStatusBadge reservation={reservation} />
      </div>

      {reservation.status === 'PENDING' && remaining !== null && (
        <HoldCountdown remaining={remaining} />
      )}

      {cancelResult && cancelResult.refundRate !== undefined && (
        <section className="card card-muted" role="status">
          <h3>환불 안내</h3>
          <div className="price-row">
            <span>환불 비율</span>
            <span>{formatRate(cancelResult.refundRate)}</span>
          </div>
          <div className="price-row">
            <span>환불 예정 금액</span>
            <span>{formatPrice(cancelResult.refundAmount)}</span>
          </div>
          <div className="price-row">
            <span>위약금</span>
            <span>{formatPrice(cancelResult.penaltyAmount)}</span>
          </div>
          <small>
            환불은 결제 수단으로 처리됩니다. 환불이 확인되지 않으면
            고객센터(1544-0000)로 문의해 주세요. 이 안내는 화면을 벗어나면 다시
            볼 수 없습니다.
          </small>
        </section>
      )}

      <dl className="kv">
        <dt>예약번호</dt>
        <dd>{reservation.reservationNo}</dd>
        <dt>숙소</dt>
        <dd>
          <Link
            className="btn-link"
            to={`/accommodations/${reservation.accommodationId}`}
          >
            {reservation.accommodationName}
          </Link>
        </dd>
        <dt>객실</dt>
        <dd>{reservation.roomName}</dd>
        <dt>일정</dt>
        <dd>{stayText(reservation)}</dd>
        <dt>예약자</dt>
        <dd>
          {reservation.guestName}
          {reservation.guestPhone && ` · ${reservation.guestPhone}`}
        </dd>
        <dt>예약 일시</dt>
        <dd>{formatDateTime(reservation.createdAt)}</dd>
        {reservation.cancelledAt && (
          <>
            <dt>취소 일시</dt>
            <dd>{formatDateTime(reservation.cancelledAt)}</dd>
          </>
        )}
      </dl>

      <section className="card">
        <h3>요금</h3>
        <PriceBreakdown
          items={reservation.priceItems}
          total={reservation.totalPrice}
        />
      </section>

      <section className="card">
        <h3>환불정책 (예약 시점 기준)</h3>
        <RefundPolicyTable
          policyText={reservation.refundPolicy?.policyText}
          rules={reservation.refundPolicy?.rules}
        />
      </section>

      <div className="actions">
        {reservation.status === 'PENDING' && !expired && (
          <Link
            className="btn btn-primary"
            to={`/reservations/${reservation.id}/payment`}
          >
            결제하기
          </Link>
        )}
        {reservation.status === 'COMPLETED' && (
          <Link
            className="btn btn-primary"
            to={`/reservations/${reservation.id}/review`}
          >
            리뷰 남기기
          </Link>
        )}
        {cancellable && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setConfirmOpen(true)}
          >
            예약 취소
          </button>
        )}
        <Link className="btn" to="/me/reservations">
          목록으로
        </Link>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="예약을 취소할까요?"
        confirmLabel="예약 취소"
        cancelLabel="닫기"
        danger
        pending={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
      >
        {wasPaid ? (
          <div className="stack">
            <span>
              취소 시점에 따라 아래 환불정책이 적용됩니다. 취소 후에는 되돌릴 수
              없습니다.
            </span>
            <RefundPolicyTable
              policyText={reservation.refundPolicy?.policyText}
              rules={reservation.refundPolicy?.rules}
            />
          </div>
        ) : (
          '결제 전 예약이라 환불 없이 바로 취소됩니다.'
        )}
      </ConfirmDialog>
    </main>
  )
}
