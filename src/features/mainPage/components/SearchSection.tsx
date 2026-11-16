import { CategoryTiles, SearchBar } from '@/features/accommodation/public'

export function SearchSection() {
  return (
    <section className="search-section" aria-label="검색과 카테고리">
      <SearchBar />
      <CategoryTiles />
    </section>
  )
}
