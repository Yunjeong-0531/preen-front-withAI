import type { SessionUser } from '@/common/auth/types'

export type UserMe = SessionUser

/** PATCH /api/users/me — 보내지 않은 항목은 바꾸지 않는다. */
export interface UpdateMeRequest {
  name?: string
  phone?: string
}
