import { HttpError } from '@/common/api/client'

export const GENERIC_ERROR_MESSAGE = '잠시 후 다시 시도해 주세요.'

/** 공통 에러 코드 안내 문구 */
export const commonErrorMessages: Record<string, string> = {
  'COMMON-002': '로그인이 필요합니다.',
  'COMMON-003': '접근 권한이 없습니다.',
  'COMMON-004': '요청한 대상을 찾을 수 없습니다.',
  'COMMON-006': '요청 크기가 허용 범위를 넘었습니다.',
  'STORAGE-001': '비어 있는 파일은 올릴 수 없습니다.',
  'STORAGE-002': 'JPEG, PNG, GIF, WebP 이미지만 올릴 수 있습니다.',
  'STORAGE-003': '5MB 이하의 이미지만 올릴 수 있습니다.',
}

export function errorCodeOf(error: unknown): string | undefined {
  return error instanceof HttpError ? error.code : undefined
}

export function isErrorCode(error: unknown, ...codes: string[]): boolean {
  const code = errorCodeOf(error)
  return code !== undefined && codes.includes(code)
}

export function isServerError(error: unknown): boolean {
  return error instanceof HttpError && error.isServerError
}

export function statusOf(error: unknown): number | undefined {
  return error instanceof HttpError ? error.status : undefined
}

/**
 * 에러 코드별 문구 → 서버 message → 일반 문구 순으로 고른다.
 * 네트워크 오류와 5xx는 항상 일반 문구를 쓴다.
 */
export function getErrorMessage(
  error: unknown,
  messages: Record<string, string> = {},
): string {
  if (!(error instanceof HttpError)) return GENERIC_ERROR_MESSAGE
  if (error.isServerError) return GENERIC_ERROR_MESSAGE
  return (
    messages[error.code] ??
    commonErrorMessages[error.code] ??
    (error.message || GENERIC_ERROR_MESSAGE)
  )
}

/** COMMON-001의 필드 오류를 돌려준다. */
export function fieldErrorsOf(error: unknown): Record<string, string> {
  return error instanceof HttpError && error.fieldErrors
    ? error.fieldErrors
    : {}
}
