import { http } from '@/common/api/http'

/** 객실별 예약 가능 여부와 기간 합계 요금 */
export interface RoomAvailability {
  roomId: number
  roomName: string
  /** 기준 인원 */
  capacity: number
  maxCapacity: number
  extraPersonFee: number
  nights: number
  available: boolean
  /** 기준 인원 기준 합계. 재고가 없는 날이 있으면 없다 */
  totalPrice?: number
}

export interface Inventory {
  stayDate: string
  totalCount: number
  bookedCount: number
  heldCount: number
  price: number
  closed: boolean
}

/** startDate~endDate(양 끝 포함) 전체에 같은 값이 들어간다. 보내지 않은 항목은 바꾸지 않는다. */
export interface SetInventoriesRequest {
  startDate: string
  endDate: string
  totalCount?: number
  price?: number
  closed?: boolean
}

export const inventoryApi = {
  availability: (accommodationId: number, checkIn: string, checkOut: string) =>
    http.get<RoomAvailability[]>(
      `/api/accommodations/${accommodationId}/availability`,
      {
        query: { checkIn, checkOut },
      },
    ),
  hostInventories: (roomId: number, startDate: string, endDate: string) =>
    http.get<Inventory[]>(`/api/host/rooms/${roomId}/inventories`, {
      query: { startDate, endDate },
    }),
  setHostInventories: (roomId: number, body: SetInventoriesRequest) =>
    http.put<Inventory[]>(`/api/host/rooms/${roomId}/inventories`, body),
}
