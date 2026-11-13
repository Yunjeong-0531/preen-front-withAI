import { http } from '@/common/api/http'
import type { PageResponse } from '@/common/types/api'
import type {
  AccommodationDetail,
  AccommodationSummary,
  Amenity,
  Category,
  Region,
  SearchConditions,
} from '@/features/accommodation/types'

export const DEFAULT_PAGE_SIZE = 12

/**
 * 숙소명(keyword)·날짜(checkIn, checkOut) 조건은 백엔드 목록 API에 아직 없다.
 * 프론트 필터로 흉내 내지 않고 URL에만 유지한다. 백엔드에 파라미터가 생기면 true로 바꾼다.
 */
export const SERVER_SUPPORTS_KEYWORD_AND_DATES = false

export interface SearchRequest extends SearchConditions {
  size?: number
}

export const accommodationApi = {
  regions: () => http.get<Region[]>('/api/regions'),
  categories: () => http.get<Category[]>('/api/categories'),
  amenities: () => http.get<Amenity[]>('/api/amenities'),
  search: (request: SearchRequest) =>
    http.get<PageResponse<AccommodationSummary>>('/api/accommodations', {
      query: {
        regionId: request.regionId,
        categoryId: request.categoryId,
        guestCount: request.guestCount,
        ...(SERVER_SUPPORTS_KEYWORD_AND_DATES
          ? {
              keyword: request.keyword,
              checkIn: request.checkIn,
              checkOut: request.checkOut,
            }
          : {}),
        // 페이지 번호는 API에서 0부터. 변환은 여기 한 곳에서만 한다.
        page: request.page - 1,
        size: request.size ?? DEFAULT_PAGE_SIZE,
      },
    }),
  detail: (id: number) =>
    http.get<AccommodationDetail>(`/api/accommodations/${id}`),
}
