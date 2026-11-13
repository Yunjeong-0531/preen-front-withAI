import { authApi, type SocialProvider } from '@/features/auth/api/authApi'

const MODE_KEY = 'preen.oauth.mode'
const REDIRECT_KEY = 'preen.oauth.redirect'

export type SocialMode = 'login' | 'link'

/** 제공자 화면으로 이동하기 전에 로그인인지 연결인지, 돌아올 곳을 기록해 둔다. */
export async function startSocialFlow(
  provider: SocialProvider,
  mode: SocialMode,
  redirect?: string,
) {
  const { authorizationUrl } = await authApi.socialAuthorizationUrl(provider)
  sessionStorage.setItem(MODE_KEY, mode)
  if (redirect) sessionStorage.setItem(REDIRECT_KEY, redirect)
  else sessionStorage.removeItem(REDIRECT_KEY)
  window.location.assign(authorizationUrl)
}

export function takeSocialFlow(): {
  mode: SocialMode
  redirect: string | null
} {
  const mode = sessionStorage.getItem(MODE_KEY) === 'link' ? 'link' : 'login'
  const redirect = sessionStorage.getItem(REDIRECT_KEY)
  sessionStorage.removeItem(MODE_KEY)
  sessionStorage.removeItem(REDIRECT_KEY)
  return { mode, redirect }
}
