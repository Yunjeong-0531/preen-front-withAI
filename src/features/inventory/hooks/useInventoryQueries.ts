import { useQuery } from '@tanstack/react-query'
import { monthRange } from '@/common/utils/date'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'

export const inventoryKeys = {
  all: ['inventory'] as const,
  availabilityOf: (accommodationId: number) =>
    [...inventoryKeys.all, 'availability', accommodationId] as const,
  availability: (accommodationId: number, checkIn: string, checkOut: string) =>
    [
      ...inventoryKeys.availabilityOf(accommodationId),
      checkIn,
      checkOut,
    ] as const,
  hostRoom: (roomId: number) => [...inventoryKeys.all, 'host', roomId] as const,
  hostMonth: (roomId: number, month: string) =>
    [...inventoryKeys.hostRoom(roomId), month] as const,
}

/** 예약 가능 여부는 변동이 잦으므로 캐시하지 않는다. 날짜를 고르기 전에는 조회하지 않는다. */
export function useAvailability(
  accommodationId: number | undefined,
  checkIn: string | undefined,
  checkOut: string | undefined,
) {
  const enabled =
    accommodationId !== undefined &&
    !!checkIn &&
    !!checkOut &&
    checkOut > checkIn
  return useQuery({
    queryKey: inventoryKeys.availability(
      accommodationId ?? 0,
      checkIn ?? '',
      checkOut ?? '',
    ),
    queryFn: () =>
      inventoryApi.availability(accommodationId as number, checkIn!, checkOut!),
    enabled,
    staleTime: 0,
  })
}

/** 호스트 재고 달력. 한 번에 한 달씩 조회한다. */
export function useHostInventories(roomId: number, month: string) {
  const { first, last } = monthRange(month)
  return useQuery({
    queryKey: inventoryKeys.hostMonth(roomId, month),
    queryFn: () => inventoryApi.hostInventories(roomId, first, last),
    staleTime: 0,
  })
}
