import '@/features/accommodation/accommodation.css'
import { AccommodationCard } from '@/features/accommodation/components/AccommodationCard'
import { useFavoriteBinding } from '@/features/accommodation/favoriteBinding'
import { accommodationDetailPath } from '@/features/accommodation/hooks/useSearchConditions'
import type {
  AccommodationSummary,
  SearchConditions,
} from '@/features/accommodation/types'

interface AccommodationGridProps {
  items: AccommodationSummary[]
  /** 상세로 넘길 날짜·인원 */
  conditions?: Partial<SearchConditions>
}

export function AccommodationGrid({
  items,
  conditions,
}: AccommodationGridProps) {
  const favorites = useFavoriteBinding()
  return (
    <div className="grid-four">
      {items.map((accommodation) => (
        <AccommodationCard
          key={accommodation.id}
          accommodation={accommodation}
          to={accommodationDetailPath(accommodation.id, conditions)}
          isFavorite={favorites.isFavorite(accommodation.id)}
          onToggleFavorite={favorites.toggle}
        />
      ))}
    </div>
  )
}
