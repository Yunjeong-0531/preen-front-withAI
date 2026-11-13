import { useEffect, useState, type FormEvent } from 'react'
import { Pagination } from '@/common/components/Pagination'
import { AsyncView, EmptyState } from '@/common/components/StatusViews'
import { addDays, todayKst } from '@/common/utils/date'
import { SERVER_SUPPORTS_KEYWORD_AND_DATES } from '@/features/accommodation/api/accommodationApi'
import { AccommodationGrid } from '@/features/accommodation/components/AccommodationGrid'
import {
  useAccommodations,
  useCategories,
  useRegions,
} from '@/features/accommodation/hooks/useAccommodationQueries'
import { useSearchConditions } from '@/features/accommodation/hooks/useSearchConditions'
import { regionOptions } from '@/features/accommodation/regionUtils'
import '@/features/accommodation/accommodation.css'

const GUEST_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1)

export function AccommodationListPage() {
  const { conditions, update } = useSearchConditions()
  const regions = useRegions()
  const categories = useCategories()
  const query = useAccommodations(conditions)
  const [keyword, setKeyword] = useState(conditions.keyword ?? '')
  const today = todayKst()

  useEffect(() => setKeyword(conditions.keyword ?? ''), [conditions.keyword])

  const submitKeyword = (event: FormEvent) => {
    event.preventDefault()
    update({ keyword: keyword.trim() || undefined })
  }

  const changeCheckIn = (value: string) => {
    if (!value) return update({ checkIn: undefined, checkOut: undefined })
    // 체크아웃은 체크인 다음 날 이후여야 한다.
    const checkOut =
      conditions.checkOut && conditions.checkOut > value
        ? conditions.checkOut
        : addDays(value, 1)
    update({ checkIn: value, checkOut })
  }

  const unsupported =
    !SERVER_SUPPORTS_KEYWORD_AND_DATES &&
    (conditions.keyword || conditions.checkIn || conditions.checkOut)
  const items = query.data?.content ?? []

  return (
    <main>
      <section className="stack">
        <h2>숙소 찾기</h2>
        <form className="filters" onSubmit={submitKeyword}>
          <label className="field">
            <span className="field-label">지역</span>
            <select
              value={conditions.regionId ?? ''}
              onChange={(event) =>
                update({
                  regionId: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
            >
              <option value="">전체 지역</option>
              {regionOptions(regions.data).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">카테고리</span>
            <select
              value={conditions.categoryId ?? ''}
              onChange={(event) =>
                update({
                  categoryId: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
            >
              <option value="">전체 숙소</option>
              {categories.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">체크인</span>
            <input
              type="date"
              min={today}
              value={conditions.checkIn ?? ''}
              onChange={(event) => changeCheckIn(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">체크아웃</span>
            <input
              type="date"
              min={addDays(conditions.checkIn ?? today, 1)}
              value={conditions.checkOut ?? ''}
              disabled={!conditions.checkIn}
              onChange={(event) =>
                update({ checkOut: event.target.value || undefined })
              }
            />
          </label>
          <label className="field">
            <span className="field-label">인원</span>
            <select
              value={conditions.guestCount ?? ''}
              onChange={(event) =>
                update({
                  guestCount: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
            >
              <option value="">인원 무관</option>
              {GUEST_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count}명
                </option>
              ))}
            </select>
          </label>
          <label className="field filters-keyword">
            <span className="field-label">숙소명</span>
            <input
              type="search"
              value={keyword}
              maxLength={100}
              placeholder="숙소명을 입력하세요"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            검색
          </button>
        </form>
        {unsupported && (
          <p className="form-notice" role="status">
            숙소명·날짜 조건은 아직 목록 검색에 적용되지 않습니다. 날짜별 예약
            가능 여부는 숙소 상세에서 확인할 수 있어요.
          </p>
        )}
      </section>

      <section className="stack">
        {query.data && (
          <small>총 {query.data.totalElements.toLocaleString('ko-KR')}개</small>
        )}
        <AsyncView
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          isEmpty={items.length === 0}
          empty={
            <EmptyState
              title="조건에 맞는 숙소가 없습니다"
              description="지역이나 카테고리, 인원 조건을 바꿔 보세요."
            />
          }
        >
          <div className={query.isPlaceholderData ? 'is-stale' : undefined}>
            <AccommodationGrid items={items} conditions={conditions} />
          </div>
          <Pagination
            page={conditions.page}
            totalPages={query.data?.totalPages ?? 0}
            onChange={(page) => update({ page })}
          />
        </AsyncView>
      </section>
    </main>
  )
}
