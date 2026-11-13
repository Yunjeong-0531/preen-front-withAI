import { http } from '@/common/api/http'
import type { UpdateMeRequest, UserMe } from '@/features/user/types'

export const userApi = {
  getMe: () => http.get<UserMe>('/api/users/me'),
  updateMe: (body: UpdateMeRequest) =>
    http.patch<UserMe>('/api/users/me', body),
  withdraw: () => http.delete<void>('/api/users/me'),
}
