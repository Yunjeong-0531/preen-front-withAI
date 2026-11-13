import { http } from '@/common/api/http'
import type { PageResponse } from '@/common/types/api'
import type { AccommodationSummary } from '@/features/accommodation/public'

export interface Favorite {
  accommodation: AccommodationSummary
  favoritedAt: string
}

export const favoriteApi = {
  add: (accommodationId: number) =>
    http.post<void>(`/api/favorites/${accommodationId}`),
  remove: (accommodationId: number) =>
    http.delete<void>(`/api/favorites/${accommodationId}`),
  /** page는 1부터 받아 API의 0부터로 바꾼다. */
  mine: (page: number, size: number) =>
    http.get<PageResponse<Favorite>>('/api/favorites/me', {
      query: { page: page - 1, size },
    }),
}

/** 찜한 숙소 ID 전체. hasNext가 false가 될 때까지 이어서 받는다. */
export async function fetchAllFavoriteIds(): Promise<number[]> {
  const ids: number[] = []
  for (let page = 1; ; page += 1) {
    const result = await favoriteApi.mine(page, 50)
    ids.push(...result.content.map((item) => item.accommodation.id))
    if (!result.hasNext) return ids
  }
}
