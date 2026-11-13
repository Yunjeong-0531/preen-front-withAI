import type { ComponentType, ReactNode } from 'react'
import {
  Navigate,
  Outlet,
  useLocation,
  useSearchParams,
} from 'react-router-dom'
import { LoadingBlock } from '@/common/components/StatusViews'
import { loginPathFor, safeRedirectPath } from '@/common/auth/redirect'
import { useSession } from '@/common/auth/session'

interface GuardProps {
  children?: ReactNode
}

const SOCIAL_SIGNUP_PATH = '/signup/social'

/** 로그인 + 가입 완료. `allowIncomplete`면 가입 미완료 세션도 통과한다. */
export function RequireAuth({
  children,
  allowIncomplete = false,
}: GuardProps & { allowIncomplete?: boolean }) {
  const session = useSession()
  const location = useLocation()
  if (session.status === 'loading') return <LoadingBlock fullPage />
  if (!session.isAuthenticated) {
    return (
      <Navigate
        to={loginPathFor(location.pathname + location.search)}
        replace
      />
    )
  }
  if (!allowIncomplete && !session.signupCompleted) {
    return <Navigate to={SOCIAL_SIGNUP_PATH} replace />
  }
  return <>{children ?? <Outlet />}</>
}

/** 역할 HOST. GUEST는 사업자 등록으로 보낸다. */
export function RequireHost({ children }: GuardProps) {
  const session = useSession()
  const location = useLocation()
  if (session.status === 'loading') return <LoadingBlock fullPage />
  if (!session.isAuthenticated) {
    return (
      <Navigate
        to={loginPathFor(location.pathname + location.search)}
        replace
      />
    )
  }
  if (!session.signupCompleted) {
    return <Navigate to={SOCIAL_SIGNUP_PATH} replace />
  }
  if (!session.isHost) return <Navigate to="/host/register" replace />
  return <>{children ?? <Outlet />}</>
}

/** 비로그인만. 로그인 직후에는 `redirect` 쿼리 또는 `/`로 보낸다. */
export function GuestOnly({ children }: GuardProps) {
  const session = useSession()
  const [params] = useSearchParams()
  if (session.status === 'loading') return <LoadingBlock fullPage />
  if (session.isAuthenticated) {
    if (!session.signupCompleted) {
      return <Navigate to={SOCIAL_SIGNUP_PATH} replace />
    }
    return <Navigate to={safeRedirectPath(params.get('redirect'))} replace />
  }
  return <>{children ?? <Outlet />}</>
}

/** 라우트 정의에서 쓰는 헬퍼: 가드로 감싼 페이지 컴포넌트를 만든다. */
export function guarded(
  Guard: ComponentType<GuardProps>,
  Page: ComponentType,
): ComponentType {
  function GuardedPage() {
    return (
      <Guard>
        <Page />
      </Guard>
    )
  }
  return GuardedPage
}

export function allowIncompleteAuth(Page: ComponentType): ComponentType {
  function IncompleteAllowedPage() {
    return (
      <RequireAuth allowIncomplete>
        <Page />
      </RequireAuth>
    )
  }
  return IncompleteAllowedPage
}
