import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  accommodationApi,
  type SearchRequest,
} from '@/features/accommodation/api/accommodationApi'

export const accommodationKeys = {
  all: ['accommodation'] as const,
  regions: () => [...accommodationKeys.all, 'regions'] as const,
  categories: () => [...accommodationKeys.all, 'categories'] as const,
  amenities: () => [...accommodationKeys.all, 'amenities'] as const,
  list: (request: SearchRequest) =>
    [...accommodationKeys.all, 'list', request] as const,
  detail: (id: number) => [...accommodationKeys.all, 'detail', id] as const,
}

const LONG_CACHE = 60 * 60 * 1000

/** 지역·카테고리·편의시설은 길게 캐시한다. */
export function useRegions() {
  return useQuery({
    queryKey: accommodationKeys.regions(),
    queryFn: accommodationApi.regions,
    staleTime: LONG_CACHE,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: accommodationKeys.categories(),
    queryFn: accommodationApi.categories,
    staleTime: LONG_CACHE,
  })
}

export function useAmenities() {
  return useQuery({
    queryKey: accommodationKeys.amenities(),
    queryFn: accommodationApi.amenities,
    staleTime: LONG_CACHE,
  })
}

/** 조회 조건은 전부 Query Key에 넣는다. 페이지 전환 중에는 이전 결과를 유지한다. */
export function useAccommodations(request: SearchRequest) {
  return useQuery({
    queryKey: accommodationKeys.list(request),
    queryFn: () => accommodationApi.search(request),
    placeholderData: keepPreviousData,
  })
}

export function useAccommodationDetail(id: number | undefined) {
  return useQuery({
    queryKey: accommodationKeys.detail(id ?? 0),
    queryFn: () => accommodationApi.detail(id as number),
    enabled: id !== undefined,
  })
}
