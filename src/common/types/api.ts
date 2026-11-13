export interface ApiResponse<T> {
  success: boolean
  /** 성공 시 "OK", 실패 시 "AUTH-003" 같은 에러 코드 */
  code: string
  message?: string
  data?: T
}

export interface PageResponse<T> {
  content: T[]
  /** 0부터 */
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

/** COMMON-001의 `data`. { 필드명: 메시지 } */
export type FieldErrors = Record<string, string>

export type QueryValue = string | number | boolean | null | undefined

export interface HttpRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** 값이 없는(null, undefined, 빈 문자열) 조건은 보내지 않는다. */
  query?: Record<string, QueryValue>
}
