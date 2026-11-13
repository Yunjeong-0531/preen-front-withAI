import { Link } from 'react-router-dom'
import { AsyncView, EmptyState } from '@/common/components/StatusViews'
import {
  FALLBACK_IMAGE,
  type ListingStatus,
} from '@/features/accommodation/public'
import { hostErrorMessages } from '@/features/host/api/hostApi'
import { useHostAccommodations } from '@/features/host/hooks/useHostQueries'
import '@/features/host/host.css'

export const LISTING_LABELS: Record<
  ListingStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: '작성 중', className: 'badge badge-warn' },
  LISTED: { label: '공개', className: 'badge badge-ok' },
  HIDDEN: { label: '숨김', className: 'badge badge-off' },
}

/** 내 숙소 목록. 공개 상태와 관계없이 전부 나온다. */
export function HostHomePage() {
  const query = useHostAccommodations()
  const items = query.data ?? []

  return (
    <main>
      <div className="page-title">
        <h2>내 숙소</h2>
        <Link className="btn btn-primary" to="/host/accommodations/new">
          숙소 등록
        </Link>
      </div>
      <AsyncView
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        errorMessages={hostErrorMessages}
        onRetry={() => void query.refetch()}
        isEmpty={items.length === 0}
        empty={
          <EmptyState
            title="등록한 숙소가 없습니다"
            description="숙소를 등록하고 객실과 환불정책을 설정하면 공개할 수 있어요."
          />
        }
      >
        <ul className="stack plain-list">
          {items.map((item) => {
            const status = LISTING_LABELS[item.listingStatus]
            return (
              <li key={item.id} className="list-card">
                <div className="host-item">
                  <img
                    src={item.thumbnailUrl ?? FALLBACK_IMAGE}
                    alt=""
                    loading="lazy"
                  />
                  <div>
                    <span>
                      <span className={status.className}>{status.label}</span>
                    </span>
                    <p>{item.name}</p>
                    <small>
                      {item.regionName} · {item.categoryName} · 객실{' '}
                      {item.roomCount}개 (판매 중 {item.activeRoomCount}개)
                    </small>
                    {item.listingStatus !== 'LISTED' && (
                      <small>
                        {item.readyToList
                          ? '공개할 수 있습니다.'
                          : `공개하려면 ${[
                              item.activeRoomCount === 0
                                ? '판매 중인 객실'
                                : '',
                              item.hasRefundPolicy ? '' : '환불정책',
                            ]
                              .filter(Boolean)
                              .join(', ')}이 필요합니다.`}
                      </small>
                    )}
                  </div>
                </div>
                <div className="actions">
                  <Link
                    className="btn btn-small"
                    to={`/host/accommodations/${item.id}`}
                  >
                    관리
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      </AsyncView>
    </main>
  )
}
