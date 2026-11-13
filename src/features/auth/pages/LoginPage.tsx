import { useState, type FormEvent } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { useSession } from '@/common/auth/session'
import { safeRedirectPath } from '@/common/auth/redirect'
import { FormField } from '@/common/components/FormField'
import {
  errorCodeOf,
  getErrorMessage,
  isServerError,
} from '@/common/utils/error'
import { authApi } from '@/features/auth/api/authApi'
import { SocialLoginButtons } from '@/features/auth/components/SocialButtons'
import {
  AUTH_ACCOUNT_LOCKED,
  authErrorMessages,
} from '@/features/auth/errorMessages'

const INVALID_CREDENTIALS = '이메일 또는 비밀번호가 올바르지 않습니다.'

export function LoginPage() {
  const session = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') ?? undefined
  const notice = (location.state as { notice?: string } | null)?.notice
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!email.trim()) next.email = '이메일을 입력해 주세요.'
    if (!password) next.password = '비밀번호를 입력해 주세요.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const token = await authApi.login(email.trim(), password)
      await session.signIn(token)
      navigate(
        token.signupCompleted ? safeRedirectPath(redirect) : '/signup/social',
        {
          replace: true,
        },
      )
    } catch (error) {
      if (errorCodeOf(error) === AUTH_ACCOUNT_LOCKED) {
        setFormError(authErrorMessages[AUTH_ACCOUNT_LOCKED])
      } else if (isServerError(error)) {
        setFormError(getErrorMessage(error))
      } else {
        setFormError(INVALID_CREDENTIALS)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="narrow">
      <h2>로그인</h2>
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField label="이메일" htmlFor="email" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <FormField label="비밀번호" htmlFor="password" error={errors.password}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '로그인 중…' : '로그인'}
        </button>
      </form>
      <SocialLoginButtons redirect={redirect} />
      <div className="actions">
        <Link className="btn-link" to="/password/forgot">
          비밀번호를 잊으셨나요?
        </Link>
        <Link className="btn-link" to="/signup">
          회원가입
        </Link>
      </div>
    </main>
  )
}
