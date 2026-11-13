import { http } from '@/common/api/http'
import type {
  AccommodationDetail,
  ListingStatus,
  RefundPolicy,
  RefundRule,
  Room,
  RoomStatus,
} from '@/features/accommodation/public'

export interface Business {
  id: number
  businessName: string
  businessRegistrationNo: string
  approvalStatus: string
  createdAt: string
}

/** 역할이 HOST로 바뀌므로 새 액세스 토큰이 함께 온다. */
export interface RegisterBusinessResponse {
  business: Business
  accessToken: string
  accessTokenExpiresIn: number
}

/** 내 숙소 목록의 한 줄. 공개 상태와 관계없이 모두 나온다. */
export interface HostAccommodationSummary {
  id: number
  name: string
  address: string
  regionId: number
  regionName: string
  categoryId: number
  categoryName: string
  thumbnailUrl?: string
  listingStatus: ListingStatus
  roomCount: number
  activeRoomCount: number
  hasRefundPolicy: boolean
  /** 판매 중인 객실과 환불정책이 있어 공개할 수 있는지 */
  readyToList: boolean
}

export interface AccommodationBody {
  regionId: number
  categoryId: number
  name: string
  description?: string
  address: string
  /** HH:mm */
  checkInTime: string
  checkOutTime: string
  /** 수정 시 보내면 통째로 교체된다. 항상 전체 배열을 보낸다. */
  imageUrls: string[]
  amenityIds: number[]
}

export interface RoomBody {
  name: string
  capacity: number
  maxCapacity: number
  extraPersonFee: number
  nightlyPrice: number
  imageUrls: string[]
}

export interface RefundPolicyBody {
  policyText?: string
  rules: RefundRule[]
}

const BASE = '/api/host/accommodations'

export const hostApi = {
  registerBusiness: (body: {
    businessName: string
    businessRegistrationNo: string
  }) => http.post<RegisterBusinessResponse>('/api/host-businesses', body),
  myBusiness: () => http.get<Business>('/api/host/business'),

  accommodations: () => http.get<HostAccommodationSummary[]>(BASE),
  accommodation: (id: number) => http.get<AccommodationDetail>(`${BASE}/${id}`),
  createAccommodation: (body: AccommodationBody) =>
    http.post<AccommodationDetail>(BASE, body),
  updateAccommodation: (id: number, body: Partial<AccommodationBody>) =>
    http.patch<AccommodationDetail>(`${BASE}/${id}`, body),
  changeListingStatus: (id: number, listingStatus: ListingStatus) =>
    http.patch<AccommodationDetail>(`${BASE}/${id}/listing-status`, {
      listingStatus,
    }),

  addRoom: (accommodationId: number, body: RoomBody) =>
    http.post<Room>(`${BASE}/${accommodationId}/rooms`, body),
  updateRoom: (
    accommodationId: number,
    roomId: number,
    body: Partial<RoomBody> & { status?: RoomStatus },
  ) => http.patch<Room>(`${BASE}/${accommodationId}/rooms/${roomId}`, body),

  putRefundPolicy: (accommodationId: number, body: RefundPolicyBody) =>
    http.put<RefundPolicy>(`${BASE}/${accommodationId}/refund-policy`, body),
}

export const hostKeys = {
  all: ['host'] as const,
  business: () => [...hostKeys.all, 'business'] as const,
  accommodations: () => [...hostKeys.all, 'accommodations'] as const,
  accommodation: (id: number) =>
    [...hostKeys.all, 'accommodation', id] as const,
}

export const HOST_LAST_ACTIVE_ROOM = 'ACCOMMODATION-010'

export const hostErrorMessages: Record<string, string> = {
  'HOST-001': '사업자등록번호 형식이 올바르지 않습니다.',
  'HOST-002': '이미 사업자를 등록한 회원입니다.',
  'HOST-003': '이미 등록된 사업자등록번호입니다.',
  'HOST-004': '등록된 사업자 정보가 없습니다.',
  'ACCOMMODATION-001': '숙소를 찾을 수 없습니다.',
  'ACCOMMODATION-002': '본인 소유의 숙소가 아닙니다.',
  'ACCOMMODATION-003': '존재하지 않는 지역입니다.',
  'ACCOMMODATION-004': '존재하지 않는 편의시설이 포함되어 있습니다.',
  'ACCOMMODATION-005': '객실을 찾을 수 없습니다.',
  'ACCOMMODATION-006': '최대 인원은 기준 인원 이상이어야 합니다.',
  'ACCOMMODATION-007':
    '판매 중인 객실과 환불정책을 등록해야 숙소를 공개할 수 있습니다.',
  'ACCOMMODATION-008': '같은 일수의 환불 규칙이 중복되었습니다.',
  'ACCOMMODATION-009': '존재하지 않는 카테고리입니다.',
  'ACCOMMODATION-010':
    '공개 중인 숙소의 마지막 판매 객실은 중지할 수 없습니다. 숙소를 먼저 숨김으로 바꿔 주세요.',
}
