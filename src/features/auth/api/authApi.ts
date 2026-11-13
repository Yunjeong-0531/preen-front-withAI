import { http } from '@/common/api/http'
import type { TokenResponse } from '@/common/auth/types'

export type SocialProvider = 'kakao' | 'naver'

export const SOCIAL_PROVIDERS: { id: SocialProvider; label: string }[] = [
  { id: 'kakao', label: '카카오' },
  { id: 'naver', label: '네이버' },
]

export interface SignupRequest {
  email: string
  password: string
  name: string
  phone?: string
  birthDate: string
  agreedTermIds: number[]
}

export interface SocialCallbackRequest {
  code: string
  state: string
}

export const authApi = {
  checkEmail: (email: string) =>
    http.get<{ available: boolean }>('/api/auth/check-email', {
      query: { email },
    }),
  sendEmailCode: (email: string) =>
    http.post<void>('/api/auth/email/resend', { email }),
  verifyEmail: (email: string, code: string) =>
    http.post<void>('/api/auth/email/verify', { email, code }),
  signup: (body: SignupRequest) =>
    http.post<{ userId: number }>('/api/auth/signup', body),
  login: (email: string, password: string) =>
    http.post<TokenResponse>('/api/auth/login', { email, password }),
  forgotPassword: (email: string) =>
    http.post<void>('/api/auth/password/forgot', { email }),
  resetPassword: (token: string, newPassword: string) =>
    http.post<void>('/api/auth/password/reset', { token, newPassword }),
  socialAuthorizationUrl: (provider: SocialProvider) =>
    http.get<{ authorizationUrl: string }>(`/api/auth/social/${provider}`),
  socialLogin: (provider: SocialProvider, body: SocialCallbackRequest) =>
    http.post<TokenResponse>(`/api/auth/social/${provider}`, body),
  socialLink: (provider: SocialProvider, body: SocialCallbackRequest) =>
    http.post<void>(`/api/auth/social/${provider}/link`, body),
  completeSignup: (body: { birthDate: string; agreedTermIds: number[] }) =>
    http.post<void>('/api/auth/signup/complete', body),
}
