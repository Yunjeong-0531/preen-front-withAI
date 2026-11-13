import { http } from '@/common/api/http'
import type { PageResponse } from '@/common/types/api'

export type ReviewSort = 'LATEST' | 'RATING_DESC' | 'RATING_ASC'

/** 리뷰는 별점과 음악(Spotify 트랙)만 있다. */
export interface Review {
  id: number
  accommodationId: number
  /** 이름의 첫 글자만 보이게 가린 작성자 이름 */
  authorName: string
  rating: number
  spotifyTrackId: string
  createdAt: string
}

export interface AccommodationTrack {
  spotifyTrackId: string
  reviewCount: number
  lastAddedAt: string
}

/** Spotify 검색 결과의 한 곡. 고르면 id만 리뷰 작성 요청에 담는다. */
export interface SpotifyTrack {
  id: string
  name: string
  artists: string[]
  albumName?: string
  albumImageUrl?: string
  durationMs: number
  spotifyUrl?: string
}

export const REVIEW_PAGE_SIZE = 10

export interface ReviewListRequest {
  accommodationId: number
  sort: ReviewSort
  rating?: number
  /** 1부터 */
  page: number
}

export const reviewApi = {
  list: ({ accommodationId, sort, rating, page }: ReviewListRequest) =>
    http.get<PageResponse<Review>>(
      `/api/accommodations/${accommodationId}/reviews`,
      {
        query: { sort, rating, page: page - 1, size: REVIEW_PAGE_SIZE },
      },
    ),
  tracks: (accommodationId: number) =>
    http.get<AccommodationTrack[]>(
      `/api/accommodations/${accommodationId}/tracks`,
    ),
  create: (body: {
    reservationId: number
    rating: number
    spotifyTrackId: string
  }) => http.post<Review>('/api/reviews', body),
  /** 보내지 않은 항목은 바꾸지 않는다. */
  update: (id: number, body: { rating?: number; spotifyTrackId?: string }) =>
    http.patch<Review>(`/api/reviews/${id}`, body),
  remove: (id: number) => http.delete<void>(`/api/reviews/${id}`),
  searchTracks: (q: string, signal?: AbortSignal) =>
    http.get<SpotifyTrack[]>('/api/spotify/tracks/search', {
      query: { q },
      signal,
    }),
}

export const REVIEW_ALREADY_EXISTS = 'REVIEW-004'

export const reviewErrorMessages: Record<string, string> = {
  'REVIEW-001': '리뷰를 찾을 수 없습니다.',
  'REVIEW-002': '본인의 예약에만 리뷰를 쓸 수 있습니다.',
  'REVIEW-003': '투숙이 끝난 예약에만 리뷰를 쓸 수 있습니다.',
  'REVIEW-004': '이미 이 예약의 리뷰를 작성했습니다.',
  'REVIEW-005': '본인이 쓴 리뷰만 수정하거나 삭제할 수 있습니다.',
  'REVIEW-006': '숙소를 찾을 수 없습니다.',
  'REVIEW-007': '음악 검색을 지금 사용할 수 없습니다.',
  'REVIEW-008':
    '음악 검색 서비스와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.',
}

export const reviewKeys = {
  all: ['review'] as const,
  ofAccommodation: (accommodationId: number) =>
    [...reviewKeys.all, accommodationId] as const,
  list: (request: ReviewListRequest) =>
    [
      ...reviewKeys.ofAccommodation(request.accommodationId),
      'list',
      request,
    ] as const,
  tracks: (accommodationId: number) =>
    [...reviewKeys.ofAccommodation(accommodationId), 'tracks'] as const,
  search: (q: string) => [...reviewKeys.all, 'spotify', q] as const,
}
