import { useState } from 'react'
import {
  SOCIAL_PROVIDERS,
  type SocialProvider,
} from '@/features/auth/api/authApi'
import { authErrorMessages } from '@/features/auth/errorMessages'
import { startSocialFlow, type SocialMode } from '@/features/auth/socialFlow'
import { getErrorMessage } from '@/common/utils/error'

interface SocialButtonsProps {
  mode: SocialMode
  redirect?: string
  labelSuffix?: string
}

function SocialButtons({ mode, redirect, labelSuffix }: SocialButtonsProps) {
  const [pending, setPending] = useState<SocialProvider | null>(null)
  const [error, setError] = useState('')

  const handleClick = async (provider: SocialProvider) => {
    setPending(provider)
    setError('')
    try {
      await startSocialFlow(provider, mode, redirect)
    } catch (caught) {
      setError(getErrorMessage(caught, authErrorMessages))
      setPending(null)
    }
  }

  return (
    <div className="stack">
      <div className="actions">
        {SOCIAL_PROVIDERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="btn"
            disabled={pending !== null}
            onClick={() => void handleClick(id)}
          >
            {label}
            {labelSuffix}
          </button>
        ))}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/** 로그인·가입 화면의 카카오·네이버 로그인 버튼 */
export function SocialLoginButtons({ redirect }: { redirect?: string }) {
  return (
    <SocialButtons mode="login" redirect={redirect} labelSuffix="로 계속하기" />
  )
}

/** 내 정보 화면의 소셜 계정 연결 영역 */
export function SocialLinkSection() {
  return (
    <section className="card card-muted">
      <h3>소셜 계정 연결</h3>
      <small>연결하면 카카오·네이버로도 로그인할 수 있어요.</small>
      <SocialButtons mode="link" redirect="/me" labelSuffix=" 연결" />
    </section>
  )
}
