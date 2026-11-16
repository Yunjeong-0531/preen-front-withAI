import { useState, type ReactNode } from 'react'
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
  const [activeTab, setActiveTab] = useState('detail-rooms')

  const goToTab = (sectionId: string) => {
    setActiveTab(sectionId)
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

  const activeRooms = detail.rooms.filter((r) => r.status === 'ACTIVE')
  const minPrice =
    activeRooms.length > 0
      ? Math.min(...activeRooms.map((r) => r.nightlyPrice))
      : 0

  // 렌더되지 않는 섹션의 탭은 노출하지 않는다.
  const tabs = [
    { id: 'detail-rooms', label: '객실 선택', show: true },
    { id: 'detail-intro', label: '숙소 소개', show: true },
    {
      id: 'detail-amenities',
      label: '시설·서비스',
      show: detail.amenities.length > 0,
    },
    { id: 'detail-policy', label: '위치·이용 안내', show: true },
    { id: 'detail-reviews', label: '음악 리뷰', show: Boolean(renderReviews) },
  ].filter((tab) => tab.show)

  return (
    <main className="page">
      <div className="detail-header-box">
        <div className="detail-header-left">
          <h2>{detail.name}</h2>
          <div className="meta">
            {detail.regionName} · {detail.categoryName} · {detail.address} · ★ 4.9 (리뷰 128개)
          </div>
        </div>
        <div className="detail-header-right">
          {minPrice > 0 && (
            <div className="price-start">
              1박 {formatPrice(minPrice)}부터
            </div>
          )}
          <button
            type="button"
            className="btn btn-small"
            aria-pressed={isFavorite}
            onClick={() => favorites.toggle(detail.id)}
          >
            {isFavorite ? '♥ 찜 해제' : '♡ 찜하기'}
          </button>
        </div>
      </div>

      <div className="gallery">
        <div className="gallery-main">
          <img
            src={images[0]}
            alt={`${detail.name} 대표 사진`}
            loading="eager"
          />
        </div>
        {images.length > 1 && (
          <div className="gallery-side">
            <div className="gallery-side-item">
              <img
                src={images[1]}
                alt={`${detail.name} 사진 2`}
                loading="lazy"
              />
            </div>
            <div className="gallery-side-item">
              <img
                src={images[2] ?? images[0]}
                alt={`${detail.name} 사진 3`}
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>

      <ul className="detail-tabs" role="tablist">
        {tabs.map((tab) => (
          <li key={tab.id} role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`detail-tab-item${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => goToTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <section className="stack detail-section" id="detail-rooms">
        <h3>객실별 가격 · 예약 가능 여부</h3>
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

      <section className="stack detail-section" id="detail-intro">
        <h3>숙소 소개</h3>
        {detail.description && <p className="pre-line">{detail.description}</p>}
        <small>
          체크인 {formatTime(detail.checkInTime)} 이후 · 체크아웃{' '}
          {formatTime(detail.checkOutTime)} 이전
        </small>
      </section>

      {detail.amenities.length > 0 && (
        <section className="stack detail-section" id="detail-amenities">
          <h3>시설 · 서비스</h3>
          <ul className="chips">
            {detail.amenities.map((amenity) => (
              <li key={amenity.id} className="chip-item">
                {amenity.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="stack detail-section" id="detail-policy">
        <h3>환불정책</h3>
        <RefundPolicyTable
          policyText={detail.refundPolicy?.policyText}
          rules={detail.refundPolicy?.rules}
        />
      </section>

      {renderReviews && (
        <div className="detail-section" id="detail-reviews">
          {renderReviews(detail)}
        </div>
      )}
    </main>
  )
}
