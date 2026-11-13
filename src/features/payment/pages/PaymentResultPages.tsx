import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { LoadingBlock } from '@/common/components/StatusViews'
import { errorCodeOf, getErrorMessage } from '@/common/utils/error'
import { formatPrice } from '@/common/utils/format'
import {
  isHoldExpired,
  useInvalidateReservations,
  useReservation,
} from '@/features/reservation/public'
import {
  PAYMENT_ALREADY_PROCESSED,
  PAYMENT_AMOUNT_MISMATCH,
  PAYMENT_EXPIRED_REFUNDED,
  paymentApi,
  paymentErrorMessages,
  type PaymentResult,
} from '@/features/payment/api/paymentApi'

/**
 * 승인 요청은 주문당 한 번만 보낸다. StrictMode의 이중 실행이나 재렌더링으로
 * 같은 주문의 승인이 두 번 나가지 않도록 진행 중인 요청을 모듈 수준에서 공유한다.
 */
const confirmations = new Map<string, Promise<PaymentResult>>()

function confirmOnce(orderId: string, paymentKey: string, amount: number) {
  let pending = confirmations.get(orderId)
  if (!pending) {
    pending = paymentApi.confirm({ orderId, paymentKey, amount })
    confirmations.set(orderId, pending)
  }
  return pending
}

type Outcome =
  | { kind: 'confirming' }
  | { kind: 'paid'; amount: number }
  | { kind: 'processed' }
  | { kind: 'expired' }
  | { kind: 'failed'; message: string; retryable: boolean }

export function PaymentSuccessPage() {
  const params = useParams()
  const [search] = useSearchParams()
  const reservationId = Number(params.id)
  const orderId = search.get('orderId')
  const paymentKey = search.get('paymentKey')
  const amount = Number(search.get('amount'))
  const validQuery =
    !!orderId && !!paymentKey && Number.isFinite(amount) && amount > 0
  const invalidate = useInvalidateReservations()
  const [outcome, setOutcome] = useState<Outcome>(
    validQuery
      ? { kind: 'confirming' }
      : {
          kind: 'failed',
          message: '결제 정보가 올바르지 않습니다.',
          retryable: true,
        },
  )
  // 이미 처리된 주문이거나 만료된 예약이면 예약을 다시 조회해 결과를 보여준다.
  const reservation = useReservation(
    outcome.kind === 'processed' || outcome.kind === 'expired'
      ? reservationId
      : undefined,
  )

  useEffect(() => {
    if (!validQuery) return
    let active = true
    confirmOnce(orderId, paymentKey, amount)
      .then((result) => {
        if (active) setOutcome({ kind: 'paid', amount: result.amount })
      })
      .catch((error: unknown) => {
        if (!active) return
        const code = errorCodeOf(error)
        if (code === PAYMENT_ALREADY_PROCESSED)
          setOutcome({ kind: 'processed' })
        else if (code === PAYMENT_EXPIRED_REFUNDED)
          setOutcome({ kind: 'expired' })
        else {
          setOutcome({
            kind: 'failed',
            message: getErrorMessage(error, paymentErrorMessages),
            // 금액 불일치는 재시도하지 않고 예약 상세로 안내한다.
            retryable: code !== PAYMENT_AMOUNT_MISMATCH,
          })
        }
      })
      .finally(() => invalidate())
    return () => {
      active = false
    }
    // 주문 정보가 같으면 다시 보내지 않는다.
  }, [orderId, paymentKey, amount, validQuery])

  const detailPath = `/me/reservations/${reservationId}`

  if (
    outcome.kind === 'confirming' ||
    (outcome.kind === 'processed' && reservation.isPending)
  ) {
    return <LoadingBlock fullPage label="결제를 확인하는 중입니다" />
  }

  if (
    outcome.kind === 'paid' ||
    (outcome.kind === 'processed' && reservation.data?.status === 'CONFIRMED')
  ) {
    return (
      <main className="narrow centered">
        <h2>예약이 확정되었습니다</h2>
        {outcome.kind === 'paid' && (
          <small>{formatPrice(outcome.amount)} 결제가 완료되었어요.</small>
        )}
        <div className="actions">
          <Link className="btn btn-primary" to={detailPath}>
            예약 상세 보기
          </Link>
          <Link className="btn" to="/">
            메인으로
          </Link>
        </div>
      </main>
    )
  }

  if (outcome.kind === 'expired') {
    const accommodationId = reservation.data?.accommodationId
    return (
      <main className="narrow centered">
        <h2>결제 시간이 만료되었습니다</h2>
        <small>
          결제 시간이 만료되어 자동으로 환불되었습니다. 숙소 상세에서 다시
          예약해 주세요.
        </small>
        <div className="actions">
          <Link
            className="btn btn-primary"
            to={
              accommodationId
                ? `/accommodations/${accommodationId}`
                : detailPath
            }
          >
            {accommodationId ? '숙소 상세로' : '예약 상세 보기'}
          </Link>
        </div>
      </main>
    )
  }

  const retryable =
    outcome.kind === 'failed'
      ? outcome.retryable
      : !!reservation.data &&
        reservation.data.status === 'PENDING' &&
        !isHoldExpired(reservation.data)

  return (
    <main className="narrow centered">
      <h2>결제를 완료하지 못했습니다</h2>
      <small>
        {outcome.kind === 'failed'
          ? outcome.message
          : '결제 처리 결과를 확인하지 못했습니다. 예약 상세에서 상태를 확인해 주세요.'}
      </small>
      <div className="actions">
        {retryable && (
          <Link
            className="btn btn-primary"
            to={`/reservations/${reservationId}/payment`}
          >
            다시 결제하기
          </Link>
        )}
        <Link className="btn" to={detailPath}>
          예약 상세 보기
        </Link>
      </div>
    </main>
  )
}

/** PG 결제창이 실패 URL로 돌려보낸 경우. code, message가 쿼리로 온다. */
export function PaymentFailPage() {
  const params = useParams()
  const [search] = useSearchParams()
  const reservationId = Number(params.id)
  const cancelled = search.get('code') === 'PAY_PROCESS_CANCELED'
  return (
    <main className="narrow centered">
      <h2>{cancelled ? '결제를 취소했습니다' : '결제에 실패했습니다'}</h2>
      <small>{search.get('message') ?? '결제가 완료되지 않았습니다.'}</small>
      <small>결제 제한 시간이 남아 있으면 다시 결제할 수 있어요.</small>
      <div className="actions">
        <Link
          className="btn btn-primary"
          to={`/reservations/${reservationId}/payment`}
        >
          다시 결제하기
        </Link>
        <Link className="btn" to={`/me/reservations/${reservationId}`}>
          예약 상세 보기
        </Link>
      </div>
    </main>
  )
}
