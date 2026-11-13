/**
 * 액세스 토큰은 메모리에만, 리프레시 토큰은 localStorage에 둔다.
 * 액세스 토큰을 localStorage·sessionStorage에 저장하지 않는다.
 */
export const REFRESH_TOKEN_KEY = 'preen.refreshToken'

let accessToken: string | null = null
const expiredListeners = new Set<() => void>()

function readRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

function writeRefreshToken(token: string | null) {
  try {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
    else localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 새로고침 시 로그인이 풀린다.
  }
}

export const tokenStore = {
  getAccessToken: () => accessToken,
  setAccessToken(token: string | null) {
    accessToken = token
  },
  getRefreshToken: readRefreshToken,
  setTokens(nextAccessToken: string, nextRefreshToken: string) {
    accessToken = nextAccessToken
    writeRefreshToken(nextRefreshToken)
  },
  clear() {
    accessToken = null
    writeRefreshToken(null)
  },
}

/** 재발급이 실패해 세션이 끝났을 때 알린다. */
export function onSessionExpired(listener: () => void) {
  expiredListeners.add(listener)
  return () => {
    expiredListeners.delete(listener)
  }
}

export function emitSessionExpired() {
  expiredListeners.forEach((listener) => listener())
}
