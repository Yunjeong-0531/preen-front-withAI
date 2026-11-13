export type UserRole = 'GUEST' | 'HOST' | 'ADMIN'

/** 로그인, 소셜 로그인, 재발급 응답 */
export interface TokenResponse {
  accessToken: string
  refreshToken: string
  /** 초 */
  accessTokenExpiresIn: number
  signupCompleted: boolean
}

/** GET /api/users/me */
export interface SessionUser {
  id: number
  name: string
  email?: string
  phone?: string
  birthDate?: string
  role: UserRole
  signupCompleted: boolean
}
