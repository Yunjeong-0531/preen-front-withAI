import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSession } from '@/common/auth/session'
import { ConfirmDialog } from '@/common/components/Dialog'
import { NotFoundView } from '@/common/components/Screens'
import { ErrorState, LoadingBlock } from '@/common/components/StatusViews'
import { useToast } from '@/common/components/Toast'
import { errorCodeOf, getErrorMessage, statusOf } from '@/common/utils/error'
import { stayText, useReservation } from '@/features/reservation/public'
import {
  REVIEW_ALREADY_EXISTS,
  reviewApi,
  reviewErrorMessages,
  reviewKeys,
} from '@/features/review/api/reviewApi'
import {
  SpotifyEmbed,
  StarInput,
} from '@/features/review/components/ReviewParts'
import { TrackSearch } from '@/features/review/components/TrackSearch'
import { myReviewStore } from '@/features/review/myReviewStore'

export function ReviewWritePage() {
  const params = useParams()
  const reservationId = Number(params.id)
  const valid = Number.isInteger(reservationId) && reservationId > 0
  const session = useSession()
  const userId = session.user?.id ?? 0
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const query = useReservation(valid ? reservationId : undefined)
  const [existing, setExisting] = useState(() =>
    myReviewStore.get(userId, reservationId),
  )
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [trackId, setTrackId] = useState(existing?.spotifyTrackId ?? '')
  const [formError, setFormError] = useState('')
  const [alreadyWritten, setAlreadyWritten] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!valid) return <NotFoundView />
  if (query.isPending) return <LoadingBlock fullPage />
  if (query.isError) {
    if (statusOf(query.error) === 404)
      return <NotFoundView title="예약을 찾을 수 없습니다" />
    return (
      <main className="narrow">
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </main>
    )
  }

  const reservation = query.data
  const listPath = '/me/reservations'

  if (reservation.status !== 'COMPLETED' || alreadyWritten) {
    return (
      <main className="narrow centered">
        <h2>
          {alreadyWritten
            ? '이미 리뷰를 작성했습니다'
            : '아직 리뷰를 쓸 수 없습니다'}
        </h2>
        <small>
          {alreadyWritten
            ? '이 예약의 리뷰는 이미 등록되어 있습니다. 수정·삭제는 리뷰를 작성한 기기에서 할 수 있어요.'
            : '투숙이 끝난 예약에만 리뷰를 남길 수 있어요.'}
        </small>
        <div className="actions">
          <Link
            className="btn btn-primary"
            to={`/accommodations/${reservation.accommodationId}`}
          >
            숙소 리뷰 보기
          </Link>
          <Link className="btn" to={listPath}>
            내 예약
          </Link>
        </div>
      </main>
    )
  }

  // 리뷰가 바뀌면 해당 숙소의 리뷰·트랙 목록을 무효화한다.
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: reviewKeys.ofAccommodation(reservation.accommodationId),
    })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (rating < 1) return setFormError('별점을 선택해 주세요.')
    if (!trackId) return setFormError('음악을 한 곡 선택해 주세요.')
    setFormError('')
    setSubmitting(true)
    try {
      // 별점과 트랙 ID만 보낸다.
      const review = existing
        ? await reviewApi.update(existing.reviewId, {
            rating,
            spotifyTrackId: trackId,
          })
        : await reviewApi.create({
            reservationId,
            rating,
            spotifyTrackId: trackId,
          })
      myReviewStore.set(userId, reservationId, {
        reviewId: review.id,
        rating: review.rating,
        spotifyTrackId: review.spotifyTrackId,
      })
      void invalidate()
      toast.show(
        existing ? '리뷰를 수정했습니다.' : '리뷰를 남겼습니다.',
        'success',
      )
      navigate(`/accommodations/${reservation.accommodationId}`)
    } catch (error) {
      if (errorCodeOf(error) === REVIEW_ALREADY_EXISTS) setAlreadyWritten(true)
      else setFormError(getErrorMessage(error, reviewErrorMessages))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!existing) return
    setDeleting(true)
    try {
      await reviewApi.remove(existing.reviewId)
      myReviewStore.remove(userId, reservationId)
      setExisting(undefined)
      setRating(0)
      setTrackId('')
      void invalidate()
      toast.show('리뷰를 삭제했습니다.', 'success')
    } catch (error) {
      setFormError(getErrorMessage(error, reviewErrorMessages))
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <main className="narrow">
      <h2>{existing ? '리뷰 수정' : '리뷰 남기기'}</h2>
      <section className="card card-muted">
        <h3>{reservation.accommodationName}</h3>
        <p>{reservation.roomName}</p>
        <small>{stayText(reservation)}</small>
      </section>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <span className="field-label">별점</span>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <div className="field">
          <span className="field-label">그날의 분위기와 어울리는 한 곡</span>
          {trackId ? (
            <SpotifyEmbed trackId={trackId} />
          ) : (
            <small>아래에서 곡을 검색해 선택해 주세요.</small>
          )}
        </div>
        <TrackSearch
          selectedId={trackId}
          onSelect={(track) => setTrackId(track.id)}
        />

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? '저장 중…' : existing ? '수정하기' : '리뷰 등록'}
          </button>
          {existing && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setConfirmOpen(true)}
            >
              리뷰 삭제
            </button>
          )}
          <Link className="btn" to={listPath}>
            취소
          </Link>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="리뷰를 삭제할까요?"
        confirmLabel="삭제"
        danger
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      >
        삭제한 리뷰는 되돌릴 수 없습니다.
      </ConfirmDialog>
    </main>
  )
}
