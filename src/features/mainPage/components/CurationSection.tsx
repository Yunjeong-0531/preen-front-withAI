import { Link } from 'react-router-dom'
import {
  accommodationListPath,
  useCategories,
} from '@/features/accommodation/public'

/** "바다가 보이는 객실"은 1차에서 제거했다. 독채 카드만 남는다. */
export function CurationSection() {
  const categories = useCategories()
  const category = categories.data?.find((item) => item.name === '독채·풀빌라')
  return (
    <section>
      <h2>필요한 조건부터 골라보세요</h2>
      <div className="curations">
        <article>
          <img loading="lazy" src="/images/generated.png" alt="" />
          <div>
            <h3>독채로 사용하는 숙소</h3>
            <small>다른 투숙객과 공간을 나누지 않는 숙소</small>
            <Link
              to={accommodationListPath(
                category ? { categoryId: category.id } : {},
              )}
            >
              숙소 확인 →
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
