import { useQuery, useQueryClient } from '@tanstack/react-query'
import { accommodationKeys } from '@/features/accommodation/public'
import { inventoryKeys } from '@/features/inventory/public'
import { hostApi, hostKeys } from '@/features/host/api/hostApi'

export function useMyBusiness(enabled = true) {
  return useQuery({
    queryKey: hostKeys.business(),
    queryFn: hostApi.myBusiness,
    enabled,
  })
}

export function useHostAccommodations() {
  return useQuery({
    queryKey: hostKeys.accommodations(),
    queryFn: hostApi.accommodations,
  })
}

export function useHostAccommodation(id: number | undefined) {
  return useQuery({
    queryKey: hostKeys.accommodation(id ?? 0),
    queryFn: () => hostApi.accommodation(id as number),
    enabled: id !== undefined,
  })
}

/** 숙소·객실·환불정책이 바뀌면 호스트 목록·상세, 재고 조회, 공개 화면을 무효화한다. */
export function useInvalidateHost() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: hostKeys.all })
    void queryClient.invalidateQueries({ queryKey: accommodationKeys.all })
    void queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
  }
}
