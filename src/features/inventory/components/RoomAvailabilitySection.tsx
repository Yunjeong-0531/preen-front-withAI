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

// PREEN 데모 프로토타입에서 정의된 객실 대표 이미지
const DEMO_ROOM_IMAGES = [
  '/images/demo-room-1.jpg',
  '/images/demo-room-2.jpg',
  '/images/demo-room-3.jpg',
]

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
      <div className="availability-filter-box">
        <div className="availability-filter-header">
          <strong>날짜와 인원을 선택하고 객실을 확인하세요</strong>
          <span>
            {datesChosen
              ? `선택 일정 ${query.data?.[0]?.nights ?? 1}박 · 성인 ${guestCount}명`
              : '체크인/체크아웃 날짜를 선택해주세요'}
          </span>
        </div>
        <div className="availability-inputs">
          <label className="field">
            <span>체크인</span>
            <input
              type="date"
              min={today}
              value={checkIn ?? ''}
              onChange={(event) => changeCheckIn(event.target.value)}
            />
          </label>
          <label className="field">
            <span>체크아웃</span>
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
            <span>인원</span>
            <select
              value={guestCount}
              onChange={(event) => patch({ guestCount: event.target.value })}
            >
              {GUEST_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  성인 {count}명 · 객실 1개
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn-search"
            onClick={() => void query.refetch()}
          >
            가능 객실 확인
          </button>
        </div>
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
        {rooms.map((room, index) => {
          const availability = query.data?.find(
            (item) => item.roomId === room.id,
          )
          const roomImage =
            DEMO_ROOM_IMAGES[index % DEMO_ROOM_IMAGES.length] ??
            room.imageUrls[0] ??
            FALLBACK_IMAGE
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
                src={roomImage}
                alt={room.name}
              />
              <div className="room-info">
                <p>{room.name}</p>
                <small>
                  기준 {room.capacity}명 · 최대 {room.maxCapacity}명
                  {room.extraPersonFee > 0 &&
                    ` · 추가 인원 1명당 ${formatPrice(room.extraPersonFee)} / 1박`}
                </small>
                {overCapacity ? (
                  <small className="field-error">
                    최대 인원({room.maxCapacity}명)을 넘어 선택할 수 없습니다.
                  </small>
                ) : soldOut ? (
                  <span className="room-badge-soldout">선택 날짜 예약 마감</span>
                ) : (
                  <span className="room-badge-available">
                    예약 가능 · 잔여 1실
                  </span>
                )}
              </div>
              <div className="room-price">
                {bookable && availability?.totalPrice !== undefined ? (
                  <>
                    <p>{formatPrice(availability.totalPrice + extraFee)}</p>
                    <small>
                      총 {formatPrice(availability.totalPrice + extraFee)} · 세금 포함 ({availability.nights}박)
                    </small>
                  </>
                ) : (
                  <>
                    <p>{formatPrice(room.nightlyPrice)} / 1박</p>
                    <small>1박 기본 요금 · 세금 별도</small>
                  </>
                )}
                {soldOut ? (
                  <button type="button" className="btn" disabled>
                    예약 마감
                  </button>
                ) : bookable ? (
                  <Link className="btn" to={reservePath}>
                    객실 예약
                  </Link>
                ) : (
                  <button type="button" className="btn" disabled>
                    객실 예약
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
