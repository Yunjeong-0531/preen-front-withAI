import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '@/common/components/FormField'
import { addDays, todayKst } from '@/common/utils/date'
import {
  errorCodeOf,
  fieldErrorsOf,
  getErrorMessage,
} from '@/common/utils/error'
import { authApi } from '@/features/auth/api/authApi'
import { SocialLoginButtons } from '@/features/auth/components/SocialButtons'
import {
  AUTH_EMAIL_NOT_VERIFIED,
  AUTH_VERIFICATION_ATTEMPTS_EXCEEDED,
  authErrorMessages,
} from '@/features/auth/errorMessages'
import {
  isAtLeastAge,
  PASSWORD_MESSAGE,
  PASSWORD_PATTERN,
} from '@/features/auth/validation'
import {
  requiredTermsAgreed,
  TermsAgreement,
  useTerms,
} from '@/features/terms/public'

type Step = 'email' | 'verify' | 'info'

const RESEND_COOLDOWN_SECONDS = 60
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9\-+ ]{9,20}$/

export function SignupPage() {
  const navigate = useNavigate()
  const termsQuery = useTerms()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeLocked, setCodeLocked] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [agreedIds, setAgreedIds] = useState<number[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  // 재발송 버튼은 누른 뒤 일정 시간 비활성화한다.
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    )
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const clearMessages = () => {
    setErrors({})
    setFormError('')
  }

  /** 1단계: 중복 확인 → 인증코드 발송 (재발송도 같은 경로) */
  const sendCode = async (event?: FormEvent) => {
    event?.preventDefault()
    clearMessages()
    const trimmed = email.trim()
    if (!EMAIL_PATTERN.test(trimmed)) {
      setErrors({ email: '이메일 형식이 올바르지 않습니다.' })
      return
    }
    setBusy(true)
    try {
      if (step === 'email') {
        const { available } = await authApi.checkEmail(trimmed)
        if (!available) {
          setErrors({ email: '이미 가입된 이메일입니다.' })
          return
        }
      }
      await authApi.sendEmailCode(trimmed)
      setEmail(trimmed)
      setCode('')
      setCodeLocked(false)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setStep('verify')
    } catch (error) {
      setFormError(getErrorMessage(error, authErrorMessages))
    } finally {
      setBusy(false)
    }
  }

  /** 2단계: 6자리 코드 확인 */
  const verifyCode = async (event: FormEvent) => {
    event.preventDefault()
    clearMessages()
    if (!/^\d{6}$/.test(code)) {
      setErrors({ code: '인증코드는 숫자 6자리입니다.' })
      return
    }
    setBusy(true)
    try {
      await authApi.verifyEmail(email, code)
      setStep('info')
    } catch (error) {
      if (errorCodeOf(error) === AUTH_VERIFICATION_ATTEMPTS_EXCEEDED) {
        // 5회를 넘게 틀리면 코드가 무효화되므로 입력을 막고 재발송을 안내한다.
        setCodeLocked(true)
      }
      setFormError(getErrorMessage(error, authErrorMessages))
    } finally {
      setBusy(false)
    }
  }

  /** 3단계: 정보 입력 → 가입 */
  const submitInfo = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!PASSWORD_PATTERN.test(password)) next.password = PASSWORD_MESSAGE
    if (password !== passwordConfirm)
      next.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    if (!name.trim()) next.name = '이름을 입력해 주세요.'
    else if (name.trim().length > 50) next.name = '이름은 50자 이하여야 합니다.'
    if (phone && !PHONE_PATTERN.test(phone))
      next.phone = '전화번호 형식이 올바르지 않습니다.'
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
      await authApi.signup({
        email,
        password,
        name: name.trim(),
        phone: phone || undefined,
        birthDate,
        agreedTermIds: agreedIds,
      })
      // 가입 응답에는 토큰이 없다. 로그인으로 보내고 완료 안내를 띄운다.
      navigate('/login', {
        replace: true,
        state: { notice: '회원가입이 완료되었습니다. 로그인해 주세요.' },
      })
    } catch (error) {
      setErrors(fieldErrorsOf(error))
      setFormError(getErrorMessage(error, authErrorMessages))
      if (errorCodeOf(error) === AUTH_EMAIL_NOT_VERIFIED) setStep('email')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="narrow">
      <h2>회원가입</h2>

      {step === 'email' && (
        <>
          <form className="form" onSubmit={sendCode} noValidate>
            <FormField label="이메일" htmlFor="email" error={errors.email}>
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
              {busy ? '확인 중…' : '인증코드 받기'}
            </button>
          </form>
          <SocialLoginButtons />
        </>
      )}

      {step === 'verify' && (
        <form className="form" onSubmit={verifyCode} noValidate>
          <p className="form-notice">
            {email}로 인증코드를 보냈습니다. 5분 안에 입력해 주세요.
          </p>
          <FormField
            label="인증코드 (숫자 6자리)"
            htmlFor="code"
            error={errors.code}
          >
            <input
              id="code"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              disabled={codeLocked}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, ''))
              }
            />
          </FormField>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || codeLocked}
            >
              {busy ? '확인 중…' : '인증 확인'}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy || cooldown > 0}
              onClick={() => void sendCode()}
            >
              {cooldown > 0 ? `재발송 (${cooldown}초)` : '인증코드 재발송'}
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={() => setStep('email')}
            >
              이메일 변경
            </button>
          </div>
        </form>
      )}

      {step === 'info' && (
        <form className="form" onSubmit={submitInfo} noValidate>
          <FormField label="이메일 (인증 완료)" htmlFor="verified-email">
            <input id="verified-email" value={email} readOnly disabled />
          </FormField>
          <FormField
            label="비밀번호"
            htmlFor="password"
            error={errors.password}
            hint="영문과 숫자를 포함한 8~64자"
          >
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
          <FormField
            label="비밀번호 확인"
            htmlFor="passwordConfirm"
            error={errors.passwordConfirm}
          >
            <input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
            />
          </FormField>
          <FormField label="이름" htmlFor="name" error={errors.name}>
            <input
              id="name"
              maxLength={50}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FormField>
          <FormField
            label="전화번호 (선택)"
            htmlFor="phone"
            error={errors.phone}
          >
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </FormField>
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
            {busy ? '가입 중…' : '가입하기'}
          </button>
        </form>
      )}

      <div className="actions">
        <Link className="btn-link" to="/login">
          이미 계정이 있으신가요? 로그인
        </Link>
      </div>
    </main>
  )
}
