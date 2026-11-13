import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '@/common/auth/session'
import { FormField } from '@/common/components/FormField'
import { fieldErrorsOf, getErrorMessage } from '@/common/utils/error'
import { authApi } from '@/features/auth/api/authApi'
import { authErrorMessages } from '@/features/auth/errorMessages'
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from '@/features/auth/validation'

/** 메일의 링크(`?token=`)로 들어와 새 비밀번호를 설정한다. */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const session = useSession()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!token) {
    return (
      <main className="narrow centered">
        <h2>유효하지 않은 링크입니다</h2>
        <small>
          메일의 링크로 다시 접속하거나 재설정을 다시 요청해 주세요.
        </small>
        <Link className="btn btn-primary" to="/password/forgot">
          재설정 다시 요청
        </Link>
      </main>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!PASSWORD_PATTERN.test(password)) next.newPassword = PASSWORD_MESSAGE
    if (password !== confirm) next.confirm = '비밀번호가 일치하지 않습니다.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    setBusy(true)
    try {
      await authApi.resetPassword(token, password)
      // 재설정 성공 시 모든 기기에서 로그아웃된다.
      session.clearSession()
      navigate('/login', {
        replace: true,
        state: {
          notice: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
        },
      })
    } catch (error) {
      setErrors(fieldErrorsOf(error))
      setFormError(getErrorMessage(error, authErrorMessages))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="narrow">
      <h2>새 비밀번호 설정</h2>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="새 비밀번호"
          htmlFor="newPassword"
          error={errors.newPassword}
          hint="영문과 숫자를 포함한 8~64자"
        >
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <FormField
          label="새 비밀번호 확인"
          htmlFor="confirm"
          error={errors.confirm}
        >
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </FormField>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? '변경 중…' : '비밀번호 변경'}
        </button>
      </form>
    </main>
  )
}
