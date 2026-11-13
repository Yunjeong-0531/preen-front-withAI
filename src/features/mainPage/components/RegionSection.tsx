import { Link } from 'react-router-dom'
import {
  accommodationListPath,
  findRegionByLabel,
  useRegions,
} from '@/features/accommodation/public'

/** 지역명 ↔ 이미지는 프론트 정적 매핑이다. ID는 지역 목록에서 이름으로 찾는다. */
const REGIONS = [
  { label: '제주', image: '/images/generated.png' },
  { label: '강릉', image: '/images/generated-1.png' },
  { label: '경주', image: '/images/generated-2.png' },
  { label: '양평', image: '/images/generated-3.png' },
]

export function RegionSection() {
  const regions = useRegions()
  return (
    <section id="regions">
      <h2>어디로 떠나볼까요?</h2>
      <div className="grid-four regions">
        {REGIONS.map(({ label, image }) => {
          const region = findRegionByLabel(regions.data, label)
          // 지역 목록에 없는 이름은 숙소명 조건으로 넘긴다.
          const to = accommodationListPath(
            region ? { regionId: region.id } : { keyword: label },
          )
          return (
            <article key={label}>
              <img loading="lazy" src={image} alt={`${label} 추천 숙소`} />
              <div>
                <h3>{label}</h3>
                <Link to={to}>숙소 보기 →</Link>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
