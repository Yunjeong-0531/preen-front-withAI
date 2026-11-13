import type { RouteObject } from 'react-router-dom'
import { GuestOnly, allowIncompleteAuth, guarded } from '@/common/auth/guards'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { OAuthCallbackPage } from '@/features/auth/pages/OAuthCallbackPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { SocialSignupPage } from '@/features/auth/pages/SocialSignupPage'

export const authRoutes: RouteObject[] = [
  { path: 'login', Component: guarded(GuestOnly, LoginPage) },
  { path: 'signup', Component: guarded(GuestOnly, SignupPage) },
  { path: 'signup/social', Component: allowIncompleteAuth(SocialSignupPage) },
  { path: 'oauth/:provider/callback', Component: OAuthCallbackPage },
  {
    path: 'password/forgot',
    Component: guarded(GuestOnly, ForgotPasswordPage),
  },
  { path: 'password/reset', Component: ResetPasswordPage },
  // 백엔드 메일 링크의 기본값(passwordResetUrl)과 맞추기 위한 별칭
  { path: 'reset-password', Component: ResetPasswordPage },
]
