import { todayKst } from '@/common/utils/date'

/** 영문과 숫자를 포함한 8~64자 */
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/
export const PASSWORD_MESSAGE =
  '비밀번호는 영문과 숫자를 포함해 8~64자여야 합니다.'

/** 생년월일(YYYY-MM-DD) 기준 만 나이가 minAge 이상인지 (KST 오늘 기준) */
export function isAtLeastAge(birthDate: string, minAge: number): boolean {
  const today = todayKst()
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  let age = ty - by
  if (tm < bm || (tm === bm && td < bd)) age -= 1
  return age >= minAge
}
