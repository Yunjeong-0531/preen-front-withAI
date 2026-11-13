import { useQuery } from '@tanstack/react-query'
import { termsApi } from '@/features/terms/api/termsApi'

export const termsKeys = {
  all: ['terms'] as const,
}

/** 약관은 길게 캐시한다. */
export function useTerms(enabled = true) {
  return useQuery({
    queryKey: termsKeys.all,
    queryFn: termsApi.list,
    staleTime: 60 * 60 * 1000,
    enabled,
  })
}
