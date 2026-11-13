import { http } from '@/common/api/http'
import type { Term } from '@/features/terms/types'

export const termsApi = {
  list: () => http.get<Term[]>('/api/terms'),
}
