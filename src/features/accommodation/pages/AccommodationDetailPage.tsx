import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { NotFoundView } from '@/common/components/Screens'
import { ErrorState, LoadingBlock } from '@/common/components/StatusViews'
import { statusOf } from '@/common/utils/error'
import { formatPrice, formatTime } from '@/common/utils/format'
import { FALLBACK_IMAGE } from '@/features/accommodation/components/AccommodationCard'
import { RefundPolicyTable } from '@/features/accommodation/components/RefundPolicyTable'
import { useFavoriteBinding } from '@/features/accommodation/favoriteBinding'
import { useAccommodationDetail } from '@/features/accommodation/hooks/useAccommodationQueries'
import type { AccommodationDetail } from '@/features/accommodation/types'
import '@/features/accommodation/accommodation.css'

/** 다른 feature가 채우는 영역. accommodation은 inventory·review를 import하지 않는다. */
export interface AccommodationDetailSlots {
  /** 날짜·인원 선택 + 객실 목록 (inventory) */
  renderRooms?: (detail: AccommodationDetail) => ReactNode
  /** 이 숙소의 음악, 리뷰 목록 (review) */
  renderReviews?: (detail: AccommodationDetail) => ReactNode
}

export function AccommodationDetailPage({
  renderRooms,
  renderReviews,
}: AccommodationDetailSlots) {
  const params = useParams()
  const id = Number(params.id)
  const valid = Number.isInteger(id) && id > 0
  const query = useAccommodationDetail(valid ? id : undefined)
  const favorites = useFavoriteBinding()

  if (!valid) return <NotFoundView />
  if (query.isPending) return <LoadingBlock fullPage />
  if (query.isError) {
    // 공개(LISTED)가 아닌 숙소는 조회되지 않는다.
    if (statusOf(query.error) === 404) {
      return <NotFoundView title="숙소를 찾을 수 없습니다" />
    }
    return (
      <main>
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </main>
    )
  }

  const detail = query.data
  const images =
    detail.imageUrls.length > 0 ? detail.imageUrls : [FALLBACK_IMAGE]
  const isFavorite = favorites.isFavorite(detail.id)

  return (
    <main className="medium">
      <div className="gallery">
        {images.slice(0, 5).map((url, index) => (
          <img
            key={url + index}
            src={url}
            loading={index === 0 ? 'eager' : 'lazy'}
            alt={
              index === 0
                ? `${detail.name} 대표 사진`
                : `${detail.name} 사진 ${index + 1}`
            }
          />
        ))}
      </div>

      <section className="stack">
        <div className="page-title">
          <h2>{detail.name}</h2>
          <button
            type="button"
            className="btn btn-small"
            aria-pressed={isFavorite}
            onClick={() => favorites.toggle(detail.id)}
          >
            {isFavorite ? '♥ 찜 해제' : '♡ 찜하기'}
          </button>
        </div>
        <small>
          {detail.regionName} · {detail.categoryName} · {detail.address}
        </small>
        <small>
          체크인 {formatTime(detail.checkInTime)} · 체크아웃{' '}
          {formatTime(detail.checkOutTime)}
        </small>
        {detail.description && <p className="pre-line">{detail.description}</p>}
      </section>

      {detail.amenities.length > 0 && (
        <section className="stack">
          <h3>편의시설</h3>
          <ul className="chips">
            {detail.amenities.map((amenity) => (
              <li key={amenity.id} className="badge">
                {amenity.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="stack">
        <h3>객실</h3>
        {renderRooms ? (
          renderRooms(detail)
        ) : (
          <ul className="stack plain-list">
            {detail.rooms.map((room) => (
              <li key={room.id} className="list-card">
                <div>
                  <p>{room.name}</p>
                  <small>
                    기준 {room.capacity}명 · 최대 {room.maxCapacity}명
                  </small>
                </div>
                <p>{formatPrice(room.nightlyPrice)} / 1박</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stack">
        <h3>환불정책</h3>
        <RefundPolicyTable
          policyText={detail.refundPolicy?.policyText}
          rules={detail.refundPolicy?.rules}
        />
      </section>

      {renderReviews?.(detail)}
    </main>
  )
}
