import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '@/common/auth/session'
import { FormField } from '@/common/components/FormField'
import { AsyncView } from '@/common/components/StatusViews'
import { useToast } from '@/common/components/Toast'
import { fieldErrorsOf, getErrorMessage } from '@/common/utils/error'
import { formatFullDate } from '@/common/utils/format'
import { hostApi, hostErrorMessages } from '@/features/host/api/hostApi'
import { useMyBusiness } from '@/features/host/hooks/useHostQueries'

const REGISTRATION_NO_PATTERN = /^\d{3}-\d{2}-\d{5}$/

/** 숫자만 받아 000-00-00000 형식으로 맞춘다. */
function formatRegistrationNo(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  return [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5)]
    .filter(Boolean)
    .join('-')
}

function BusinessInfo() {
  const query = useMyBusiness()
  return (
    <main className="narrow">
      <h2>사업자 정보</h2>
      <AsyncView
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        errorMessages={hostErrorMessages}
        onRetry={() => void query.refetch()}
      >
        {query.data && (
          <dl className="kv">
            <dt>상호</dt>
            <dd>{query.data.businessName}</dd>
            <dt>사업자등록번호</dt>
            <dd>{query.data.businessRegistrationNo}</dd>
            <dt>등록일</dt>
            <dd>{formatFullDate(query.data.createdAt)}</dd>
          </dl>
        )}
      </AsyncView>
      <div className="actions">
        <Link className="btn btn-primary" to="/host">
          호스트 센터로
        </Link>
      </div>
    </main>
  )
}

export function HostRegisterPage() {
  const session = useSession()
  const navigate = useNavigate()
  const toast = useToast()
  const [businessName, setBusinessName] = useState('')
  const [registrationNo, setRegistrationNo] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 이미 HOST면 등록 폼 대신 사업자 정보를 보여준다.
  if (session.isHost) return <BusinessInfo />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const name = businessName.trim()
    if (!name) next.businessName = '상호를 입력해 주세요.'
    if (!REGISTRATION_NO_PATTERN.test(registrationNo)) {
      next.businessRegistrationNo =
        '사업자등록번호를 000-00-00000 형식으로 입력해 주세요.'
    }
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const result = await hostApi.registerBusiness({
        businessName: name,
        businessRegistrationNo: registrationNo,
      })
      // 역할이 HOST로 바뀌었다. 새 액세스 토큰으로 교체하고 세션을 다시 조회한다.
      await session.replaceAccessToken(result.accessToken)
      toast.show('사업자 등록이 완료되었습니다.', 'success')
      navigate('/host', { replace: true })
    } catch (error) {
      setErrors(fieldErrorsOf(error))
      setFormError(getErrorMessage(error, hostErrorMessages))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="narrow">
      <h2>사업자 등록</h2>
      <small>
        사업자 정보를 등록하면 바로 호스트로 전환되어 숙소를 등록할 수 있어요.
      </small>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="상호"
          htmlFor="businessName"
          error={errors.businessName}
        >
          <input
            id="businessName"
            value={businessName}
            maxLength={100}
            onChange={(event) => setBusinessName(event.target.value)}
          />
        </FormField>
        <FormField
          label="사업자등록번호"
          htmlFor="businessRegistrationNo"
          error={errors.businessRegistrationNo}
          hint="000-00-00000"
        >
          <input
            id="businessRegistrationNo"
            inputMode="numeric"
            value={registrationNo}
            placeholder="000-00-00000"
            onChange={(event) =>
              setRegistrationNo(formatRegistrationNo(event.target.value))
            }
          />
        </FormField>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '등록 중…' : '등록하기'}
        </button>
      </form>
    </main>
  )
}
