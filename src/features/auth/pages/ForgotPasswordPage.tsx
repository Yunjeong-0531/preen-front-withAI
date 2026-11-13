import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FormField } from '@/common/components/FormField'
import { getErrorMessage } from '@/common/utils/error'
import { authApi } from '@/features/auth/api/authApi'
import { authErrorMessages } from '@/features/auth/errorMessages'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('이메일 형식이 올바르지 않습니다.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await authApi.forgotPassword(email.trim())
      setDone(true)
    } catch (caught) {
      setFormError(getErrorMessage(caught, authErrorMessages))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="narrow">
      <h2>비밀번호 재설정</h2>
      {done ? (
        // 계정 존재 여부와 관계없이 같은 완료 문구를 보여준다.
        <p className="form-notice" role="status">
          입력하신 이메일로 가입된 계정이 있다면 비밀번호 재설정 안내 메일을
          보냈습니다. 메일을 확인해 주세요.
        </p>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <FormField label="가입한 이메일" htmlFor="email" error={error}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? '요청 중…' : '재설정 메일 받기'}
          </button>
        </form>
      )}
      <Link className="btn-link" to="/login">
        로그인으로
      </Link>
    </main>
  )
}
