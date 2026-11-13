import { Link, useSearchParams } from 'react-router-dom'
import { ErrorState, LoadingBlock } from '@/common/components/StatusViews'
import { addDays, isIsoDate, todayKst } from '@/common/utils/date'
import { formatPrice } from '@/common/utils/format'
import { buildQueryString } from '@/common/api/client'
import {
  FALLBACK_IMAGE,
  type AccommodationDetail,
} from '@/features/accommodation/public'
import { useAvailability } from '@/features/inventory/hooks/useInventoryQueries'
import { estimateExtraPersonFee } from '@/features/inventory/pricePreview'
import '@/features/inventory/inventory.css'

const GUEST_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1)

/** 숙소 상세의 날짜·인원 선택과 객실 목록. 날짜와 인원은 URL 쿼리에 둔다. */
export function RoomAvailabilitySection({
  detail,
}: {
  detail: AccommodationDetail
}) {
  const [params, setParams] = useSearchParams()
  const today = todayKst()
  const rawCheckIn = params.get('checkIn')
  const rawCheckOut = params.get('checkOut')
  // 체크인은 오늘(KST)부터, 체크아웃은 체크인 다음 날부터.
  const checkIn =
    isIsoDate(rawCheckIn) && rawCheckIn >= today ? rawCheckIn : undefined
  const checkOut =
    checkIn && isIsoDate(rawCheckOut) && rawCheckOut > checkIn
      ? rawCheckOut
      : undefined
  const guestCount = Math.max(1, Number(params.get('guestCount')) || 2)
  const query = useAvailability(detail.id, checkIn, checkOut)
  const datesChosen = checkIn !== undefined && checkOut !== undefined

  const patch = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const changeCheckIn = (value: string) => {
    if (!value) return patch({ checkIn: undefined, checkOut: undefined })
    patch({
      checkIn: value,
      checkOut: checkOut && checkOut > value ? checkOut : addDays(value, 1),
    })
  }

  const rooms = detail.rooms.filter((room) => room.status === 'ACTIVE')

  return (
    <div className="stack">
      <div className="field-row">
        <label className="field">
          <span className="field-label">체크인</span>
          <input
            type="date"
            min={today}
            value={checkIn ?? ''}
            onChange={(event) => changeCheckIn(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">체크아웃</span>
          <input
            type="date"
            min={addDays(checkIn ?? today, 1)}
            value={checkOut ?? ''}
            disabled={!checkIn}
            onChange={(event) =>
              patch({ checkOut: event.target.value || undefined })
            }
          />
        </label>
        <label className="field">
          <span className="field-label">인원</span>
          <select
            value={guestCount}
            onChange={(event) => patch({ guestCount: event.target.value })}
          >
            {GUEST_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}명
              </option>
            ))}
          </select>
        </label>
      </div>

      {!datesChosen && (
        <small>날짜를 선택하면 예약 가능 여부와 요금을 확인할 수 있어요.</small>
      )}
      {datesChosen && query.isPending && (
        <LoadingBlock label="예약 가능 여부를 확인하는 중입니다" />
      )}
      {datesChosen && query.isError && (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      )}

      {rooms.length === 0 && <small>판매 중인 객실이 없습니다.</small>}
      <ul className="stack plain-list">
        {rooms.map((room) => {
          const availability = query.data?.find(
            (item) => item.roomId === room.id,
          )
          const overCapacity = guestCount > room.maxCapacity
          const soldOut =
            datesChosen &&
            query.isSuccess &&
            (!availability ||
              !availability.available ||
              availability.totalPrice === undefined)
          const bookable =
            datesChosen &&
            !!availability &&
            !soldOut &&
            !overCapacity &&
            query.isSuccess
          const extraFee =
            availability && bookable
              ? estimateExtraPersonFee(guestCount, availability)
              : 0
          const reservePath = `/reservations/new${buildQueryString({
            accommodationId: detail.id,
            roomId: room.id,
            checkIn,
            checkOut,
            guestCount,
          })}`
          return (
            <li key={room.id} className="room-card">
              <img
                loading="lazy"
                src={room.imageUrls[0] ?? FALLBACK_IMAGE}
                alt=""
              />
              <div className="room-info">
                <p>{room.name}</p>
                <small>
                  기준 {room.capacity}명 · 최대 {room.maxCapacity}명
                  {room.extraPersonFee > 0 &&
                    ` · 추가 인원 1명당 ${formatPrice(room.extraPersonFee)} / 1박`}
                </small>
                {overCapacity && (
                  <small className="field-error">
                    최대 인원({room.maxCapacity}명)을 넘어 선택할 수 없습니다.
                  </small>
                )}
              </div>
              <div className="room-price">
                {bookable && availability?.totalPrice !== undefined ? (
                  <>
                    <p>{formatPrice(availability.totalPrice + extraFee)}</p>
                    <small>
                      {availability.nights}박 예상 금액
                      {extraFee > 0 &&
                        ` (추가 인원 ${formatPrice(extraFee)} 포함)`}
                    </small>
                  </>
                ) : (
                  <>
                    <p>{formatPrice(room.nightlyPrice)}</p>
                    <small>1박 기본 요금</small>
                  </>
                )}
                {soldOut ? (
                  <button type="button" className="btn" disabled>
                    예약 마감
                  </button>
                ) : bookable ? (
                  <Link className="btn btn-primary" to={reservePath}>
                    예약하기
                  </Link>
                ) : (
                  <button type="button" className="btn btn-primary" disabled>
                    예약하기
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
