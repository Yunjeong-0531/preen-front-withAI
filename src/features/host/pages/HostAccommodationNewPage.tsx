import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/common/components/Toast'
import { fieldErrorsOf, getErrorMessage } from '@/common/utils/error'
import {
  hostApi,
  hostErrorMessages,
  type AccommodationBody,
} from '@/features/host/api/hostApi'
import { AccommodationForm } from '@/features/host/components/AccommodationForm'
import { useInvalidateHost } from '@/features/host/hooks/useHostQueries'

export function HostAccommodationNewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const invalidate = useInvalidateHost()
  const [submitting, setSubmitting] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  const handleSubmit = async (body: AccommodationBody) => {
    setSubmitting(true)
    setFormError('')
    try {
      const created = await hostApi.createAccommodation(body)
      invalidate()
      toast.show(
        '숙소를 등록했습니다. 객실과 환불정책을 설정해 주세요.',
        'success',
      )
      navigate(`/host/accommodations/${created.id}`, { replace: true })
    } catch (error) {
      setServerErrors(fieldErrorsOf(error))
      setFormError(getErrorMessage(error, hostErrorMessages))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="medium">
      <h2>숙소 등록</h2>
      <small>
        새 숙소는 "작성 중" 상태로 만들어집니다. 객실과 환불정책을 등록한 뒤
        공개할 수 있어요.
      </small>
      <AccommodationForm
        submitLabel="숙소 등록"
        submitting={submitting}
        serverErrors={serverErrors}
        formError={formError}
        onSubmit={handleSubmit}
      />
    </main>
  )
}
