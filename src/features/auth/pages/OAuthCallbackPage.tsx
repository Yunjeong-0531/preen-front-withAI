import { useEffect, useRef, useState } from 'react'
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { useSession } from '@/common/auth/session'
import { safeRedirectPath } from '@/common/auth/redirect'
import { LoadingBlock } from '@/common/components/StatusViews'
import { useToast } from '@/common/components/Toast'
import { errorCodeOf, getErrorMessage } from '@/common/utils/error'
import { authApi, type SocialProvider } from '@/features/auth/api/authApi'
import {
  AUTH_SOCIAL_EMAIL_ALREADY_REGISTERED,
  authErrorMessages,
} from '@/features/auth/errorMessages'
import { takeSocialFlow } from '@/features/auth/socialFlow'

function isProvider(value: string | undefined): value is SocialProvider {
  return value === 'kakao' || value === 'naver'
}

/** code는 일회용이다. 같은 값으로 두 번 나가지 않게 모듈 수준에서 막는다. */
const handledCodes = new Set<string>()

export function OAuthCallbackPage() {
  const { provider } = useParams()
  const [params] = useSearchParams()
  const session = useSession()
  const navigate = useNavigate()
  const toast = useToast()
  const [error, setError] = useState<{ message: string; code?: string } | null>(
    null,
  )
  const started = useRef(false)

  const code = params.get('code')
  const state = params.get('state')
  const providerId = isProvider(provider) ? provider : undefined

  useEffect(() => {
    if (started.current || !providerId || !code || !state) return
    // 연결(link)은 로그인 상태가 확정된 뒤에 호출한다.
    if (session.status === 'loading') return
    started.current = true
    if (handledCodes.has(code)) return
    handledCodes.add(code)

    const { mode, redirect } = takeSocialFlow()
    void (async () => {
      try {
        if (mode === 'link') {
          await authApi.socialLink(providerId, { code, state })
          toast.show('소셜 계정을 연결했습니다.', 'success')
          navigate('/me', { replace: true })
          return
        }
        const token = await authApi.socialLogin(providerId, { code, state })
        await session.signIn(token)
        navigate(
          token.signupCompleted ? safeRedirectPath(redirect) : '/signup/social',
          {
            replace: true,
          },
        )
      } catch (caught) {
        setError({
          message: getErrorMessage(caught, authErrorMessages),
          code: errorCodeOf(caught),
        })
      }
    })()
  }, [code, state, providerId, session, navigate, toast])

  // 사용자가 제공자 화면에서 취소하면 code가 없다. 로그인 화면으로 돌려보낸다.
  if (!providerId || !code || !state) return <Navigate to="/login" replace />

  if (error) {
    return (
      <main className="narrow centered">
        <h2>소셜 로그인에 실패했습니다</h2>
        <p role="alert">{error.message}</p>
        <div className="actions">
          <Link className="btn btn-primary" to="/login">
            로그인으로
          </Link>
          {error.code === AUTH_SOCIAL_EMAIL_ALREADY_REGISTERED && (
            <small>
              기존 계정으로 로그인한 뒤 내 정보에서 연결할 수 있어요.
            </small>
          )}
        </div>
      </main>
    )
  }

  return <LoadingBlock fullPage label="로그인 중입니다" />
}
