/** `/`로 시작하는 내부 경로만 허용한다. */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value) return '/'
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/\\')
  ) {
    return '/'
  }
  return value
}

export function loginPathFor(returnTo: string) {
  return `/login?redirect=${encodeURIComponent(returnTo)}`
}
