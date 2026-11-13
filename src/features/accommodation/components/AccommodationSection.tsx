import { Link } from 'react-router-dom'
import { AsyncView, EmptyState } from '@/common/components/StatusViews'
import { AccommodationGrid } from '@/features/accommodation/components/AccommodationGrid'
import { useAccommodations } from '@/features/accommodation/hooks/useAccommodationQueries'

/** 메인의 숙소 섹션. 기준은 협의 전까지 목록 API의 앞 4개다. */
export function AccommodationSection() {
  const query = useAccommodations({ page: 1, size: 4 })
  const items = query.data?.content ?? []
  return (
    <section>
      <div className="section-title">
        <h2>지금 예약 가능한 숙소</h2>
        <Link to="/accommodations">더 보기 →</Link>
      </div>
      <AsyncView
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={items.length === 0}
        empty={<EmptyState title="등록된 숙소가 아직 없습니다" />}
      >
        <AccommodationGrid items={items} />
      </AsyncView>
    </section>
  )
}
