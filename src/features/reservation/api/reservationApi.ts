import { http } from '@/common/api/http'
import type { PageResponse } from '@/common/types/api'
import type {
  CancelResult,
  CreateReservationRequest,
  Reservation,
} from '@/features/reservation/types'

export const RESERVATION_PAGE_SIZE = 10

export const reservationApi = {
  create: (body: CreateReservationRequest) =>
    http.post<Reservation>('/api/reservations', body),
  /** 필터 없음, 최신순. page는 1부터 받아 API의 0부터로 바꾼다. */
  mine: (page: number) =>
    http.get<PageResponse<Reservation>>('/api/reservations/me', {
      query: { page: page - 1, size: RESERVATION_PAGE_SIZE },
    }),
  detail: (id: number) => http.get<Reservation>(`/api/reservations/${id}`),
  cancel: (id: number) =>
    http.post<CancelResult>(`/api/reservations/${id}/cancel`),
  /** 호스트 본인 숙소의 예약 목록 */
  forHost: (page: number) =>
    http.get<PageResponse<Reservation>>('/api/host/reservations', {
      query: { page: page - 1, size: RESERVATION_PAGE_SIZE },
    }),
}
