import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '@/common/auth/session'
import { FormField } from '@/common/components/FormField'
import { NotFoundView } from '@/common/components/Screens'
import { ErrorState, LoadingBlock } from '@/common/components/StatusViews'
import { isIsoDate, todayKst } from '@/common/utils/date'
import {
  errorCodeOf,
  fieldErrorsOf,
  getErrorMessage,
} from '@/common/utils/error'
import { formatPrice } from '@/common/utils/format'
import {
  RefundPolicyTable,
  accommodationDetailPath,
  useAccommodationDetail,
} from '@/features/accommodation/public'
import {
  estimateExtraPersonFee,
  useAvailability,
} from '@/features/inventory/public'
import { reservationApi } from '@/features/reservation/api/reservationApi'
import { stayText } from '@/features/reservation/components/ReservationParts'
import {
  INVENTORY_SOLD_OUT,
  RESERVATION_ROOM_NOT_AVAILABLE,
  reservationErrorMessages,
} from '@/features/reservation/errorMessages'
import { useInvalidateReservations } from '@/features/reservation/hooks/useReservations'

const PHONE_PATTERN = /^[0-9\-+ ]{9,20}$/

function positiveInt(value: string | null) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export function ReservationNewPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const session = useSession()
  const invalidate = useInvalidateReservations()
  const accommodationId = positiveInt(params.get('accommodationId'))
  const roomId = positiveInt(params.get('roomId'))
  const guestCount = positiveInt(params.get('guestCount'))
  const rawCheckIn = params.get('checkIn')
  const rawCheckOut = params.get('checkOut')
  const checkIn =
    isIsoDate(rawCheckIn) && rawCheckIn >= todayKst() ? rawCheckIn : undefined
  const checkOut =
    checkIn && isIsoDate(rawCheckOut) && rawCheckOut > checkIn
      ? rawCheckOut
      : undefined
  const valid =
    !!accommodationId && !!roomId && !!guestCount && !!checkIn && !!checkOut

  const detail = useAccommodationDetail(valid ? accommodationId : undefined)
  const availability = useAvailability(
    valid ? accommodationId : undefined,
    checkIn,
    checkOut,
  )
  const [guestName, setGuestName] = useState(session.user?.name ?? '')
  const [guestPhone, setGuestPhone] = useState(session.user?.phone ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [soldOut, setSoldOut] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!valid) {
    return (
      <NotFoundView
        title="예약 정보를 확인할 수 없습니다"
        description="숙소 상세에서 날짜와 객실을 다시 선택해 주세요."
      />
    )
  }
  if (detail.isPending || availability.isPending)
    return <LoadingBlock fullPage />
  if (detail.isError || availability.isError) {
    return (
      <main className="narrow">
        <ErrorState
          error={detail.error ?? availability.error}
          onRetry={() => {
            void detail.refetch()
            void availability.refetch()
          }}
        />
      </main>
    )
  }

  const backPath = accommodationDetailPath(accommodationId, {
    checkIn,
    checkOut,
    guestCount,
  })
  const room = availability.data.find((item) => item.roomId === roomId)
  const unavailable =
    !room ||
    !room.available ||
    room.totalPrice === undefined ||
    guestCount > room.maxCapacity

  if (unavailable || soldOut) {
    return (
      <main className="narrow centered">
        <h2>예약할 수 없는 객실입니다</h2>
        <small>
          {room && guestCount > room.maxCapacity
            ? `이 객실의 최대 인원은 ${room.maxCapacity}명입니다.`
            : reservationErrorMessages[INVENTORY_SOLD_OUT]}
        </small>
        <div className="actions">
          <Link className="btn btn-primary" to={backPath}>
            다른 객실·날짜 고르기
          </Link>
        </div>
      </main>
    )
  }

  // 미리보기. 확정 금액은 예약 생성 응답의 요금 항목과 totalPrice다.
  const roomPrice = room.totalPrice as number
  const extraFee = estimateExtraPersonFee(guestCount, room)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const name = guestName.trim()
    const phone = guestPhone.trim()
    if (name.length > 50) next.guestName = '예약자 이름은 50자 이하여야 합니다.'
    if (phone && !PHONE_PATTERN.test(phone))
      next.guestPhone = '전화번호 형식이 올바르지 않습니다.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const reservation = await reservationApi.create({
        roomId,
        checkIn,
        checkOut,
        guestCount,
        ...(name ? { guestName: name } : {}),
        ...(phone ? { guestPhone: phone } : {}),
      })
      invalidate(accommodationId)
      navigate(`/reservations/${reservation.id}/payment`, { replace: true })
    } catch (error) {
      invalidate(accommodationId)
      const code = errorCodeOf(error)
      if (
        code === INVENTORY_SOLD_OUT ||
        code === RESERVATION_ROOM_NOT_AVAILABLE
      ) {
        setSoldOut(true)
        return
      }
      setErrors(fieldErrorsOf(error))
      setFormError(getErrorMessage(error, reservationErrorMessages))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="narrow">
      <h2>예약 정보 입력</h2>
      <section className="card card-muted">
        <h3>{detail.data.name}</h3>
        <p>{room.roomName}</p>
        <small>{stayText({ checkIn, checkOut, guestCount })}</small>
        <Link className="btn-link" to={backPath}>
          날짜·객실 다시 고르기
        </Link>
      </section>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="예약자 이름"
          htmlFor="guestName"
          error={errors.guestName}
          hint="비워 두면 회원 정보의 이름을 사용합니다."
        >
          <input
            id="guestName"
            value={guestName}
            maxLength={50}
            autoComplete="name"
            onChange={(event) => setGuestName(event.target.value)}
          />
        </FormField>
        <FormField
          label="예약자 전화번호"
          htmlFor="guestPhone"
          error={errors.guestPhone}
          hint="비워 두면 회원 정보의 전화번호를 사용합니다."
        >
          <input
            id="guestPhone"
            type="tel"
            value={guestPhone}
            autoComplete="tel"
            onChange={(event) => setGuestPhone(event.target.value)}
          />
        </FormField>

        <section className="card">
          <h3>예상 요금</h3>
          <div className="price-row">
            <span>객실 요금 ({room.nights}박)</span>
            <span>{formatPrice(roomPrice)}</span>
          </div>
          {extraFee > 0 && (
            <div className="price-row">
              <span>추가 인원 요금 ({guestCount - room.capacity}명)</span>
              <span>{formatPrice(extraFee)}</span>
            </div>
          )}
          <div className="price-row price-total">
            <span>예상 합계</span>
            <span>{formatPrice(roomPrice + extraFee)}</span>
          </div>
          <small>결제 금액은 예약이 만들어질 때 확정됩니다.</small>
        </section>

        <section className="card">
          <h3>환불정책</h3>
          <RefundPolicyTable
            policyText={detail.data.refundPolicy?.policyText}
            rules={detail.data.refundPolicy?.rules}
          />
        </section>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <small>
          예약하면 객실이 10분 동안 선점됩니다. 그 안에 결제를 마쳐 주세요.
        </small>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '예약 중…' : '예약하고 결제하기'}
        </button>
      </form>
    </main>
  )
}
