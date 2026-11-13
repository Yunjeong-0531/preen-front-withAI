import { userErrorMessages } from '@/features/user/public'

/** 에러 코드 → 안내 문구 */
export const authErrorMessages: Record<string, string> = {
  ...userErrorMessages,
  'AUTH-001': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'AUTH-002':
    '로그인 실패가 반복되어 계정이 잠겼습니다. 잠시 후 다시 시도해 주세요.',
  'AUTH-003': '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  'AUTH-004': '이메일 인증을 먼저 완료해 주세요.',
  'AUTH-005': '인증코드가 올바르지 않거나 만료되었습니다.',
  'AUTH-006': '인증 시도 횟수를 넘었습니다. 인증코드를 다시 받아 주세요.',
  'AUTH-007':
    '비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다. 다시 요청해 주세요.',
  'AUTH-008': '지원하지 않는 소셜 로그인입니다.',
  'AUTH-009': '소셜 로그인이 아직 설정되지 않았습니다.',
  'AUTH-010': '소셜 로그인 요청이 만료되었습니다. 다시 시도해 주세요.',
  'AUTH-011':
    '소셜 로그인 제공자와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  'AUTH-012':
    '같은 이메일로 가입된 계정이 있습니다. 기존 계정으로 로그인한 뒤 내 정보에서 소셜 계정을 연결해 주세요.',
  'AUTH-013': '이미 다른 계정에 연결된 소셜 계정입니다.',
  'TERMS-001': '필수 약관에 모두 동의해 주세요.',
  'TERMS-002':
    '현재 유효하지 않은 약관이 포함되어 있습니다. 새로고침 후 다시 시도해 주세요.',
}

/** 로그인 실패는 계정 존재 여부를 드러내지 않는 문구를 쓴다 (잠금만 따로 안내). */
export const AUTH_ACCOUNT_LOCKED = 'AUTH-002'
export const AUTH_VERIFICATION_ATTEMPTS_EXCEEDED = 'AUTH-006'
export const AUTH_EMAIL_NOT_VERIFIED = 'AUTH-004'
export const AUTH_SOCIAL_EMAIL_ALREADY_REGISTERED = 'AUTH-012'
export const USER_SIGNUP_ALREADY_COMPLETED = 'USER-005'
