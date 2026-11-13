import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Pagination } from '@/common/components/Pagination'
import { AsyncView, EmptyState } from '@/common/components/StatusViews'
import { formatFullDate } from '@/common/utils/format'
import {
  reviewApi,
  reviewErrorMessages,
  reviewKeys,
  type ReviewSort,
} from '@/features/review/api/reviewApi'
import { SpotifyEmbed, Stars } from '@/features/review/components/ReviewParts'

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: 'LATEST', label: '최신순' },
  { value: 'RATING_DESC', label: '별점 높은순' },
  { value: 'RATING_ASC', label: '별점 낮은순' },
]
const TRACKS_PREVIEW = 4

/** 숙소 상세의 "이 숙소의 음악" */
export function AccommodationTracks({
  accommodationId,
}: {
  accommodationId: number
}) {
  const [expanded, setExpanded] = useState(false)
  const query = useQuery({
    queryKey: reviewKeys.tracks(accommodationId),
    queryFn: () => reviewApi.tracks(accommodationId),
  })
  const tracks = query.data ?? []
  // 최대 50곡이므로 처음에는 일부만 보여준다.
  const visible = expanded ? tracks : tracks.slice(0, TRACKS_PREVIEW)

  return (
    <section className="stack">
      <h3>이 숙소의 음악</h3>
      <AsyncView
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        errorMessages={reviewErrorMessages}
        onRetry={() => void query.refetch()}
        isEmpty={tracks.length === 0}
        empty={<small>아직 남겨진 음악이 없습니다.</small>}
      >
        <ul className="track-grid plain-list">
          {visible.map((track) => (
            <li key={track.spotifyTrackId}>
              <SpotifyEmbed trackId={track.spotifyTrackId} />
              {track.reviewCount > 1 && (
                <small>{track.reviewCount}명이 남긴 곡</small>
              )}
            </li>
          ))}
        </ul>
        {tracks.length > TRACKS_PREVIEW && (
          <div className="actions">
            <button
              type="button"
              className="btn btn-small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded
                ? '접기'
                : `더 보기 (${tracks.length - TRACKS_PREVIEW}곡)`}
            </button>
          </div>
        )}
      </AsyncView>
    </section>
  )
}

/** 숙소 상세의 리뷰 목록. 리뷰 하나 = 별점 + 작성일 + 트랙. */
export function AccommodationReviews({
  accommodationId,
}: {
  accommodationId: number
}) {
  const [sort, setSort] = useState<ReviewSort>('LATEST')
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const request = { accommodationId, sort, rating, page }
  const query = useQuery({
    queryKey: reviewKeys.list(request),
    queryFn: () => reviewApi.list(request),
    placeholderData: keepPreviousData,
  })
  const reviews = query.data?.content ?? []

  return (
    <section className="stack">
      <div className="page-title">
        <h3>
          리뷰
          {query.data
            ? ` ${query.data.totalElements.toLocaleString('ko-KR')}`
            : ''}
        </h3>
        <label className="field review-sort">
          <span className="sr-only">정렬</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as ReviewSort)
              setPage(1)
            }}
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="tabs" role="group" aria-label="별점 필터">
        {[undefined, 5, 4, 3, 2, 1].map((value) => (
          <button
            key={value ?? 'all'}
            type="button"
            aria-pressed={rating === value}
            onClick={() => {
              setRating(value)
              setPage(1)
            }}
          >
            {value ? `${value}점` : '전체'}
          </button>
        ))}
      </div>
      <AsyncView
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        errorMessages={reviewErrorMessages}
        onRetry={() => void query.refetch()}
        isEmpty={reviews.length === 0}
        empty={<EmptyState title="아직 리뷰가 없습니다" />}
      >
        <ul className="stack plain-list">
          {reviews.map((review) => (
            <li key={review.id} className="card">
              <div className="price-row">
                <span>
                  <Stars rating={review.rating} /> {review.authorName}
                </span>
                <small>{formatFullDate(review.createdAt)}</small>
              </div>
              <SpotifyEmbed trackId={review.spotifyTrackId} />
            </li>
          ))}
        </ul>
        <Pagination
          page={page}
          totalPages={query.data?.totalPages ?? 0}
          onChange={setPage}
        />
      </AsyncView>
    </section>
  )
}
