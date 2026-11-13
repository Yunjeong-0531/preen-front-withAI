import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '@/common/auth/session'
import { FormField } from '@/common/components/FormField'
import { addDays, todayKst } from '@/common/utils/date'
import {
  errorCodeOf,
  fieldErrorsOf,
  getErrorMessage,
} from '@/common/utils/error'
import { authApi } from '@/features/auth/api/authApi'
import {
  authErrorMessages,
  USER_SIGNUP_ALREADY_COMPLETED,
} from '@/features/auth/errorMessages'
import { isAtLeastAge } from '@/features/auth/validation'
import {
  requiredTermsAgreed,
  TermsAgreement,
  useTerms,
} from '@/features/terms/public'

/** 소셜 최초 로그인 직후 생년월일과 약관 동의를 받아 가입을 끝낸다. */
export function SocialSignupPage() {
  const session = useSession()
  const navigate = useNavigate()
  const termsQuery = useTerms()
  const [birthDate, setBirthDate] = useState('')
  const [agreedIds, setAgreedIds] = useState<number[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (session.isAuthenticated && session.signupCompleted)
      navigate('/', { replace: true })
  }, [navigate, session.isAuthenticated, session.signupCompleted])

  if (session.isAuthenticated && session.signupCompleted)
    return <Navigate to="/" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!birthDate) next.birthDate = '생년월일을 입력해 주세요.'
    else if (birthDate >= todayKst())
      next.birthDate = '생년월일이 올바르지 않습니다.'
    else if (!isAtLeastAge(birthDate, 14))
      next.birthDate = '만 14세 미만은 가입할 수 없습니다.'
    if (!termsQuery.data || !requiredTermsAgreed(termsQuery.data, agreedIds)) {
      next.agreedTermIds = '필수 약관에 모두 동의해 주세요.'
    }
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    setBusy(true)
    try {
      await authApi.completeSignup({ birthDate, agreedTermIds: agreedIds })
      await session.reloadUser()
      navigate('/', { replace: true })
    } catch (error) {
      if (errorCodeOf(error) === USER_SIGNUP_ALREADY_COMPLETED) {
        await session.reloadUser().catch(() => undefined)
        navigate('/', { replace: true })
        return
      }
      setErrors(fieldErrorsOf(error))
      setFormError(getErrorMessage(error, authErrorMessages))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="narrow">
      <h2>가입 완료</h2>
      <p className="form-notice">
        마지막 단계예요. 생년월일과 약관 동의를 입력하면 가입이 끝납니다.
      </p>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="생년월일"
          htmlFor="birthDate"
          error={errors.birthDate}
          hint="만 14세 이상 가입할 수 있습니다."
        >
          <input
            id="birthDate"
            type="date"
            max={addDays(todayKst(), -1)}
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
          />
        </FormField>
        <TermsAgreement
          agreedIds={agreedIds}
          onChange={setAgreedIds}
          error={errors.agreedTermIds}
        />
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={
            busy ||
            !termsQuery.data ||
            !requiredTermsAgreed(termsQuery.data, agreedIds)
          }
        >
          {busy ? '처리 중…' : '가입 완료'}
        </button>
      </form>
    </main>
  )
}
