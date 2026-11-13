import { Link, useSearchParams } from 'react-router-dom'
import { Pagination } from '@/common/components/Pagination'
import { AsyncView, EmptyState } from '@/common/components/StatusViews'
import { AccommodationGrid } from '@/features/accommodation/public'
import { useFavoritePage } from '@/features/favorite/hooks/useFavorites'

export function FavoritesPage() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const query = useFavoritePage(page)
  const items =
    query.data?.content.map((favorite) => favorite.accommodation) ?? []

  return (
    <main>
      <section className="stack">
        <h2>찜한 숙소</h2>
        <AsyncView
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          isEmpty={items.length === 0}
          empty={
            <EmptyState
              title="찜한 숙소가 없습니다"
              action={
                <Link className="btn btn-primary" to="/accommodations">
                  숙소 둘러보기
                </Link>
              }
            />
          }
        >
          <AccommodationGrid items={items} />
          <Pagination
            page={page}
            totalPages={query.data?.totalPages ?? 0}
            onChange={(next) =>
              setParams(next > 1 ? { page: String(next) } : {})
            }
          />
        </AsyncView>
      </section>
    </main>
  )
}
