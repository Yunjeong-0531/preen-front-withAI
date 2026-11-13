import { HttpError, sendRequest } from '@/common/api/client'
import type { TokenResponse } from '@/common/auth/types'
import { emitSessionExpired, tokenStore } from '@/common/auth/tokenStore'

const LOCK_NAME = 'preen-token-refresh'

async function runRefresh(): Promise<string | null> {
  // 락을 얻은 뒤에 읽는다. 다른 탭이 이미 회전시켰다면 그 최신 토큰을 쓴다.
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) return null
  try {
    const token = await sendRequest<TokenResponse>('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })
    // 서버가 기존 토큰을 지우므로 새 리프레시 토큰으로 반드시 교체한다.
    tokenStore.setTokens(token.accessToken, token.refreshToken)
    return token.accessToken
  } catch (error) {
    // 일시적인 장애(네트워크, 5xx)는 세션을 유지한다.
    const rejected =
      error instanceof HttpError && error.status >= 400 && error.status < 500
    if (rejected) {
      tokenStore.clear()
      emitSessionExpired()
    }
    return null
  }
}

/** 여러 탭이 동시에 재발급하지 않도록 락 안에서 실행한다. */
async function runRefreshLocked(): Promise<string | null> {
  let accessToken: string | null = null
  await navigator.locks.request(LOCK_NAME, async () => {
    accessToken = await runRefresh()
  })
  return accessToken
}

let inflight: Promise<string | null> | null = null

/**
 * 액세스 토큰을 재발급한다. 같은 탭에서는 한 번만 보내고,
 * 여러 탭 사이에서는 Web Locks로 직렬화한다.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!tokenStore.getRefreshToken()) return Promise.resolve(null)
  if (inflight) return inflight
  const task: Promise<string | null> =
    typeof navigator !== 'undefined' && 'locks' in navigator
      ? runRefreshLocked()
      : runRefresh()
  const current = task.finally(() => {
    inflight = null
  })
  inflight = current
  return current
}
