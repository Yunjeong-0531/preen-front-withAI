export interface Region {
  id: number
  parentId?: number
  name: string
  /** 1: 시·도, 2: 시·군·구 */
  level: number
}

export interface Category {
  id: number
  name: string
}

export interface Amenity {
  id: number
  name: string
}

/** GET /api/accommodations 항목. 값이 null인 필드는 응답에서 빠진다. */
export interface AccommodationSummary {
  id: number
  name: string
  address: string
  regionId: number
  regionName: string
  categoryId: number
  categoryName: string
  thumbnailUrl?: string
  /** 판매 중인 객실이 없으면 없다 */
  minNightlyPrice?: number
}

/** 기존 시안의 이름. 목록 API 응답으로 교체했다. */
export type Accommodation = AccommodationSummary

export type ListingStatus = 'DRAFT' | 'LISTED' | 'HIDDEN'
export type RoomStatus = 'ACTIVE' | 'INACTIVE'

export interface Room {
  id: number
  name: string
  /** 기준 인원 */
  capacity: number
  maxCapacity: number
  extraPersonFee: number
  nightlyPrice: number
  status: RoomStatus
  imageUrls: string[]
}

export interface RefundRule {
  /** 체크인 N일 전까지 */
  daysBefore: number
  /** 0~1 */
  refundRate: number
}

export interface RefundPolicy {
  id: number
  version: string
  policyText?: string
  rules: RefundRule[]
}

export interface AccommodationDetail {
  id: number
  name: string
  description?: string
  address: string
  regionId: number
  regionName: string
  categoryId: number
  categoryName: string
  latitude?: number
  longitude?: number
  /** HH:mm:ss */
  checkInTime: string
  checkOutTime: string
  listingStatus: ListingStatus
  imageUrls: string[]
  amenities: Amenity[]
  rooms: Room[]
  refundPolicy?: RefundPolicy
}

/** URL 쿼리 스트링이 유일한 상태다. page는 1부터. */
export interface SearchConditions {
  regionId?: number
  categoryId?: number
  keyword?: string
  checkIn?: string
  checkOut?: string
  guestCount?: number
  /** 타일로 들어온 탐색 화면. 서버로는 보내지 않는다. */
  view?: SearchView
  page: number
}

export type SearchView = 'weekend' | 'region'

/** 찜 상태와 토글 핸들러. 카드와 상세는 props로 받는다. */
export interface FavoriteBinding {
  isFavorite: (accommodationId: number) => boolean
  toggle: (accommodationId: number) => void
}
