import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Pagination } from '@/common/components/Pagination'
import { NotFoundView } from '@/common/components/Screens'
import { AsyncView, EmptyState } from '@/common/components/StatusViews'
import { InventoryCalendar } from '@/features/inventory/public'
import {
  ReservationListItem,
  useHostReservations,
} from '@/features/reservation/public'

/** 객실 재고 달력 */
export function HostInventoryPage() {
  const params = useParams()
  const [search] = useSearchParams()
  const location = useLocation()
  const roomId = Number(params.roomId)
  const accommodationId = Number(search.get('accommodationId'))
  const names = location.state as {
    roomName?: string
    accommodationName?: string
  } | null

  if (!Number.isInteger(roomId) || roomId <= 0) return <NotFoundView />

  return (
    <main className="medium">
      <div className="page-title">
        <div className="stack">
          <h2>재고 달력</h2>
          {names?.roomName && (
            <small>
              {names.accommodationName} · {names.roomName}
            </small>
          )}
        </div>
        <Link
          className="btn btn-small"
          to={
            accommodationId > 0
              ? `/host/accommodations/${accommodationId}`
              : '/host'
          }
        >
          숙소 관리로
        </Link>
      </div>
      <small>
        재고는 매일 오늘부터 약 90일 뒤까지 자동으로 만들어집니다. 그 이후
        날짜는 "미설정"으로 표시되며, 기간을 설정하면 새로 만들어집니다.
      </small>
      <InventoryCalendar roomId={roomId} />
    </main>
  )
}

/** 내 숙소에 들어온 예약 목록. 조회 전용이다. */
export function HostReservationsPage() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const query = useHostReservations(page)
  const items = query.data?.content ?? []

  return (
    <main className="medium">
      <h2>예약 목록</h2>
      <AsyncView
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={items.length === 0}
        empty={<EmptyState title="들어온 예약이 없습니다" />}
      >
        <ul className="stack plain-list">
          {items.map((reservation) => (
            <ReservationListItem
              key={reservation.id}
              reservation={reservation}
              showGuest
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
