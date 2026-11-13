import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GridIcon } from '@/common/components/icons'
import { useCategories } from '@/features/accommodation/hooks/useAccommodationQueries'
import { accommodationListPath } from '@/features/accommodation/hooks/useSearchConditions'

/** Header의 "전체 카테고리" 드롭다운 */
export function CategoryMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const query = useCategories()

  useEffect(() => setOpen(false), [location])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <GridIcon />
        전체 카테고리
      </button>
      {open && (
        <ul className="menu-panel">
          <li>
            <Link to="/accommodations">전체 숙소</Link>
          </li>
          {query.data?.map((category) => (
            <li key={category.id}>
              <Link to={accommodationListPath({ categoryId: category.id })}>
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
