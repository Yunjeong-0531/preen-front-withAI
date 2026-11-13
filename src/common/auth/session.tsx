import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { http } from '@/common/api/http'
import { refreshAccessToken } from '@/common/auth/refresh'
import {
  onSessionExpired,
  REFRESH_TOKEN_KEY,
  tokenStore,
} from '@/common/auth/tokenStore'
import type { SessionUser } from '@/common/auth/types'

type SessionStatus = 'loading' | 'anonymous' | 'authenticated'

interface SessionValue {
  status: SessionStatus
  user: SessionUser | null
  isAuthenticated: boolean
  signupCompleted: boolean
  isHost: boolean
  /** 로그인·재발급 응답의 토큰으로 세션을 시작하고 사용자를 조회한다. */
  signIn: (tokens: {
    accessToken: string
    refreshToken: string
  }) => Promise<SessionUser>
  /** 새 액세스 토큰(사업자 등록 응답 등)으로 교체하고 사용자를 다시 조회한다. */
  replaceAccessToken: (accessToken: string) => Promise<SessionUser>
  reloadUser: () => Promise<SessionUser>
  /** 서버에 로그아웃을 알리고 토큰과 캐시를 비운다. */
  signOut: () => Promise<void>
  /** 서버 호출 없이 토큰과 캐시만 비운다. 탈퇴·비밀번호 재설정 성공 시 쓴다. */
  clearSession: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [user, setUser] = useState<SessionUser | null>(null)
  const bootstrapped = useRef(false)

  const becomeAnonymous = useCallback(() => {
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  const loadUser = useCallback(async () => {
    const me = await http.get<SessionUser>('/api/users/me')
    setUser(me)
    setStatus('authenticated')
    return me
  }, [])

  // 앱 시작: 리프레시 토큰이 있으면 재발급 → 사용자 조회
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    void (async () => {
      if (!tokenStore.getRefreshToken()) {
        setStatus('anonymous')
        return
      }
      const accessToken = await refreshAccessToken()
      if (!accessToken) {
        setStatus('anonymous')
        return
      }
      try {
        await loadUser()
      } catch {
        setStatus('anonymous')
      }
    })()
  }, [loadUser])

  // 재발급 실패로 세션이 끝난 경우, 다른 탭의 로그아웃
  useEffect(() => {
    const offExpired = onSessionExpired(becomeAnonymous)
    const onStorage = (event: StorageEvent) => {
      if (event.key === REFRESH_TOKEN_KEY && event.newValue === null) {
        tokenStore.setAccessToken(null)
        becomeAnonymous()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      offExpired()
      window.removeEventListener('storage', onStorage)
    }
  }, [becomeAnonymous])

  const signIn = useCallback<SessionValue['signIn']>(
    async ({ accessToken, refreshToken }) => {
      tokenStore.setTokens(accessToken, refreshToken)
      queryClient.clear()
      return loadUser()
    },
    [loadUser, queryClient],
  )

  const replaceAccessToken = useCallback<SessionValue['replaceAccessToken']>(
    async (accessToken) => {
      tokenStore.setAccessToken(accessToken)
      return loadUser()
    },
    [loadUser],
  )

  const clearSession = useCallback(() => {
    tokenStore.clear()
    becomeAnonymous()
  }, [becomeAnonymous])

  const signOut = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken()
    try {
      if (refreshToken) await http.post('/api/auth/logout', { refreshToken })
    } catch {
      // 응답과 관계없이 로컬 세션은 비운다.
    }
    clearSession()
  }, [clearSession])

  const value = useMemo<SessionValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      signupCompleted: user?.signupCompleted ?? false,
      isHost: user?.role === 'HOST',
      signIn,
      replaceAccessToken,
      reloadUser: loadUser,
      signOut,
      clearSession,
    }),
    [status, user, signIn, replaceAccessToken, loadUser, signOut, clearSession],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('SessionProvider 안에서만 사용할 수 있습니다.')
  return value
}
