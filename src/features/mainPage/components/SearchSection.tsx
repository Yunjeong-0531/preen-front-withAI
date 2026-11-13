import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDays, todayKst, upcomingWeekend } from '@/common/utils/date'
import {
  accommodationListPath,
  regionOptions,
  useCategories,
  useRegions,
} from '@/features/accommodation/public'

const GUEST_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1)

/** 시안 순서를 유지한다. 이름이 일치하는 백엔드 카테고리만 연결한다. */
const CATEGORY_TILES = [
  { label: '호텔·리조트', image: '/images/category-signature-2.png' },
  { label: '독채·풀빌라', image: '/images/category-signature-3.png' },
  { label: '한옥', image: '/images/category-signature-4.png' },
  // 백엔드 카테고리에 없다. 협의 전까지 동작 없음.
  { label: '감성 스테이', image: '/images/category-signature-5.png' },
  { label: '게스트하우스', image: '/images/category-signature-6.png' },
]

function Tile({ image, label }: { image: string; label: string }) {
  return (
    <>
      <span className="category-image">
        <img src={image} alt="" />
      </span>
      {label}
    </>
  )
}

export function SearchSection() {
  const navigate = useNavigate()
  const regions = useRegions()
  const categories = useCategories()
  const today = todayKst()
  const [place, setPlace] = useState('')
  const [checkIn, setCheckIn] = useState(today)
  const [checkOut, setCheckOut] = useState(addDays(today, 1))
  const [guestCount, setGuestCount] = useState(2)
  const options = regionOptions(regions.data)

  const changeCheckIn = (value: string) => {
    if (!value) return
    setCheckIn(value)
    if (checkOut <= value) setCheckOut(addDays(value, 1))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    // 입력이 지역 이름과 같으면 지역 조건, 아니면 숙소명 조건이다.
    const text = place.trim()
    const region = options.find((option) => option.label === text)
    navigate(
      accommodationListPath({
        regionId: region?.id,
        keyword: region ? undefined : text || undefined,
        checkIn,
        checkOut,
        guestCount,
      }),
    )
  }

  return (
    <section className="search-section" aria-label="검색과 카테고리">
      <form className="search" onSubmit={handleSubmit}>
        <label className="search-field">
          <small>여행 지역</small>
          <input
            list="search-regions"
            value={place}
            maxLength={100}
            placeholder="지역 또는 숙소명"
            onChange={(event) => setPlace(event.target.value)}
          />
          <datalist id="search-regions">
            {options.map((option) => (
              <option key={option.id} value={option.label} />
            ))}
          </datalist>
        </label>
        <div className="search-field">
          <small>체크인 · 체크아웃</small>
          <span className="search-dates">
            <input
              type="date"
              aria-label="체크인"
              min={today}
              value={checkIn}
              onChange={(event) => changeCheckIn(event.target.value)}
            />
            —
            <input
              type="date"
              aria-label="체크아웃"
              min={addDays(checkIn, 1)}
              value={checkOut}
              onChange={(event) =>
                event.target.value && setCheckOut(event.target.value)
              }
            />
          </span>
        </div>
        <label className="search-field">
          <small>인원 · 객실</small>
          <span>
            <select
              aria-label="인원"
              value={guestCount}
              onChange={(event) => setGuestCount(Number(event.target.value))}
            >
              {GUEST_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  성인 {count}명
                </option>
              ))}
            </select>{' '}
            · 객실 1개
          </span>
        </label>
        <button type="submit" className="search-submit">
          검색하기
        </button>
      </form>
      <nav className="categories" aria-label="숙박 유형">
        <Link to="/accommodations">
          <Tile image="/images/category-signature-1.png" label="전체 숙소" />
        </Link>
        {CATEGORY_TILES.map((tile) => {
          const category = categories.data?.find(
            (item) => item.name === tile.label,
          )
          return category ? (
            <Link
              key={tile.label}
              to={accommodationListPath({ categoryId: category.id })}
            >
              <Tile {...tile} />
            </Link>
          ) : (
            <button key={tile.label} type="button" disabled>
              <Tile {...tile} />
            </button>
          )
        })}
        <Link to={accommodationListPath(upcomingWeekend(today))}>
          <Tile image="/images/category-signature-7.png" label="이번 주말" />
        </Link>
        <a href="#regions">
          <Tile
            image="/images/category-signature-8.png"
            label="지역으로 찾기"
          />
        </a>
      </nav>
    </section>
  )
}
