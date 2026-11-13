import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { NotFoundView } from '@/common/components/Screens'
import { ErrorState, LoadingBlock } from '@/common/components/StatusViews'
import { errorCodeOf, getErrorMessage, statusOf } from '@/common/utils/error'
import {
  HoldCountdown,
  PriceBreakdown,
  stayText,
  useHoldRemaining,
  useReservation,
} from '@/features/reservation/public'
import {
  PAYMENT_NOT_PAYABLE,
  paymentApi,
  paymentErrorMessages,
} from '@/features/payment/api/paymentApi'
import { PaymentGatewayError, gatewayFor } from '@/features/payment/gateway'

export function PaymentPage() {
  const params = useParams()
  const id = Number(params.id)
  const valid = Number.isInteger(id) && id > 0
  const query = useReservation(valid ? id : undefined)
  const remaining = useHoldRemaining(query.data)
  const [paying, setPaying] = useState(false)
  const [formError, setFormError] = useState('')
  const expired = remaining === 0
  const { refetch } = query

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
        <ErrorState error={query.error} onRetry={() => void refetch()} />
      </main>
    )
  }

  const reservation = query.data
  const detailPath = `/me/reservations/${reservation.id}`
  // 결제 대기 상태가 아니면 예약 상세로 돌려보낸다.
  if (reservation.status !== 'PENDING')
    return <Navigate to={detailPath} replace />

  const handlePay = async () => {
    setPaying(true)
    setFormError('')
    try {
      const prepared = await paymentApi.prepare(reservation.id)
      const base = `${window.location.origin}/reservations/${reservation.id}/payment`
      // 금액은 서버가 준 값을 쓴다.
      await gatewayFor(prepared.pgProvider).requestPayment({
        orderId: prepared.orderId,
        amount: prepared.amount,
        orderName: prepared.orderName,
        customerName: reservation.guestName,
        successUrl: `${base}/success`,
        failUrl: `${base}/fail`,
      })
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        setFormError(error.message)
      } else {
        setFormError(getErrorMessage(error, paymentErrorMessages))
        if (errorCodeOf(error) === PAYMENT_NOT_PAYABLE) void refetch()
      }
      setPaying(false)
    }
  }

  return (
    <main className="narrow">
      <h2>결제</h2>
      {remaining !== null && <HoldCountdown remaining={remaining} />}
      <section className="card card-muted">
        <h3>{reservation.accommodationName}</h3>
        <p>{reservation.roomName}</p>
        <small>{stayText(reservation)}</small>
        <small>예약번호 {reservation.reservationNo}</small>
      </section>
      <section className="card">
        <h3>결제 금액</h3>
        <PriceBreakdown
          items={reservation.priceItems}
          total={reservation.totalPrice}
          totalLabel="결제 금액"
        />
      </section>
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePay}
          disabled={paying || expired}
        >
          {paying ? '결제창을 여는 중…' : '결제하기'}
        </button>
        <Link className="btn" to={detailPath}>
          예약 상세
        </Link>
      </div>
    </main>
  )
}
