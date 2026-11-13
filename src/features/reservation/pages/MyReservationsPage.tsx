import { Link, useSearchParams } from 'react-router-dom'
import { Pagination } from '@/common/components/Pagination'
import { AsyncView, EmptyState } from '@/common/components/StatusViews'
import { ReservationListItem } from '@/features/reservation/components/ReservationParts'
import {
  isHoldExpired,
  useMyReservations,
} from '@/features/reservation/hooks/useReservations'

export function MyReservationsPage() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const query = useMyReservations(page)
  const items = query.data?.content ?? []

  return (
    <main className="medium">
      <h2>내 예약</h2>
      <AsyncView
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={items.length === 0}
        empty={
          <EmptyState
            title="예약 내역이 없습니다"
            action={
              <Link className="btn btn-primary" to="/accommodations">
                숙소 둘러보기
              </Link>
            }
          />
        }
      >
        <ul className="stack plain-list">
          {items.map((reservation) => (
            <ReservationListItem
              key={reservation.id}
              reservation={reservation}
              actions={
                <>
                  {reservation.status === 'PENDING' &&
                    !isHoldExpired(reservation) && (
                      <Link
                        className="btn btn-primary btn-small"
                        to={`/reservations/${reservation.id}/payment`}
                      >
                        결제하기
                      </Link>
                    )}
                  {reservation.status === 'COMPLETED' && (
                    <Link
                      className="btn btn-primary btn-small"
                      to={`/reservations/${reservation.id}/review`}
                    >
                      리뷰 남기기
                    </Link>
                  )}
                  <Link
                    className="btn btn-small"
                    to={`/me/reservations/${reservation.id}`}
                  >
                    상세 보기
                  </Link>
                </>
              }
            />
          ))}
        </ul>
        <Pagination
          page={page}
          totalPages={query.data?.totalPages ?? 0}
          onChange={(next) => setParams(next > 1 ? { page: String(next) } : {})}
        />
      </AsyncView>
    </main>
  )
}
