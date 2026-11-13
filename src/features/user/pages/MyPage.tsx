import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/common/auth/session'
import { ConfirmDialog } from '@/common/components/Dialog'
import { FormField } from '@/common/components/FormField'
import { useToast } from '@/common/components/Toast'
import { fieldErrorsOf, getErrorMessage } from '@/common/utils/error'
import { formatFullDate } from '@/common/utils/format'
import { userApi } from '@/features/user/api/userApi'
import { userErrorMessages } from '@/features/user/errorMessages'

const ROLE_LABELS = { GUEST: '일반 회원', HOST: '호스트', ADMIN: '관리자' }
const PHONE_PATTERN = /^[0-9\-+ ]{9,20}$/

interface MyPageProps {
  /** 소셜 계정 연결 영역. auth feature가 만든다. */
  socialSection?: ReactNode
}

export function MyPage({ socialSection }: MyPageProps) {
  const session = useSession()
  const navigate = useNavigate()
  const toast = useToast()
  const user = session.user
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  if (!user) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const trimmedName = name.trim()
    if (!trimmedName) next.name = '이름을 입력해 주세요.'
    else if (trimmedName.length > 50) next.name = '이름은 50자 이하여야 합니다.'
    if (phone && !PHONE_PATTERN.test(phone))
      next.phone = '전화번호 형식이 올바르지 않습니다.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    // 바뀐 항목만 보낸다.
    const body: { name?: string; phone?: string } = {}
    if (trimmedName !== user.name) body.name = trimmedName
    if (phone && phone !== (user.phone ?? '')) body.phone = phone
    if (Object.keys(body).length === 0) {
      toast.show('변경된 내용이 없습니다.')
      return
    }
    setSaving(true)
    try {
      await userApi.updateMe(body)
      await session.reloadUser()
      toast.show('내 정보를 저장했습니다.', 'success')
    } catch (error) {
      setErrors(fieldErrorsOf(error))
      setFormError(getErrorMessage(error, userErrorMessages))
    } finally {
      setSaving(false)
    }
  }

  const handleWithdraw = async () => {
    setWithdrawing(true)
    try {
      await userApi.withdraw()
      session.clearSession()
      toast.show('탈퇴가 완료되었습니다.')
      navigate('/', { replace: true })
    } catch (error) {
      setConfirmOpen(false)
      setFormError(getErrorMessage(error, userErrorMessages))
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <main className="narrow">
      <h2>내 정보</h2>
      <dl className="kv">
        <dt>이메일</dt>
        <dd>{user.email ?? '-'}</dd>
        <dt>생년월일</dt>
        <dd>{user.birthDate ? formatFullDate(user.birthDate) : '-'}</dd>
        <dt>회원 유형</dt>
        <dd>{ROLE_LABELS[user.role]}</dd>
      </dl>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField label="이름" htmlFor="name" error={errors.name}>
          <input
            id="name"
            value={name}
            maxLength={50}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField
          label="전화번호"
          htmlFor="phone"
          error={errors.phone}
          hint="숫자, -, +, 공백 9~20자"
        >
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </FormField>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>

      {socialSection}

      <section className="card card-muted">
        <h3>회원 탈퇴</h3>
        <small>
          탈퇴하면 모든 기기에서 로그아웃되며 계정을 다시 사용할 수 없습니다.
        </small>
        <div className="actions">
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setConfirmOpen(true)}
          >
            탈퇴하기
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="정말 탈퇴하시겠어요?"
        confirmLabel="탈퇴"
        danger
        pending={withdrawing}
        onConfirm={handleWithdraw}
        onCancel={() => setConfirmOpen(false)}
      >
        탈퇴 후에는 되돌릴 수 없습니다.
      </ConfirmDialog>
    </main>
  )
}
