import type { Term } from '@/features/terms/types'

const TERM_TITLES: Record<string, string> = {
  SERVICE: '서비스 이용약관',
  PRIVACY: '개인정보 수집·이용 동의',
  MARKETING: '마케팅 정보 수신 동의',
}

export function termTitle(term: Term) {
  return TERM_TITLES[term.type] ?? term.type
}

/** 필수 약관에 모두 동의했는지 */
export function requiredTermsAgreed(terms: Term[], agreedIds: number[]) {
  return terms
    .filter((term) => term.required)
    .every((term) => agreedIds.includes(term.id))
}
