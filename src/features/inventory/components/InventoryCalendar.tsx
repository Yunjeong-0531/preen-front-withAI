import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ErrorState, LoadingBlock } from '@/common/components/StatusViews'
import { useToast } from '@/common/components/Toast'
import {
  addDays,
  monthRange,
  shiftMonth,
  todayKst,
  weekdayOf,
} from '@/common/utils/date'
import { fieldErrorsOf, getErrorMessage } from '@/common/utils/error'
import { formatPrice, formatShortDate } from '@/common/utils/format'
import {
  inventoryApi,
  type SetInventoriesRequest,
} from '@/features/inventory/api/inventoryApi'
import {
  inventoryKeys,
  useHostInventories,
} from '@/features/inventory/hooks/useInventoryQueries'
import '@/features/inventory/inventory.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const inventoryErrorMessages: Record<string, string> = {
  'INVENTORY-002': '날짜 범위가 올바르지 않습니다.',
  'INVENTORY-003': '날짜 범위가 너무 깁니다. 366일 이내로 선택해 주세요.',
  'INVENTORY-004': '수량, 가격, 판매 마감 중 하나 이상을 입력해 주세요.',
  'INVENTORY-005': '이미 예약되었거나 선점된 수량보다 적게 설정할 수 없습니다.',
}

type ClosedChoice = '' | 'open' | 'closed'

/** 호스트 재고 달력. 기간을 선택해 수량·가격·판매 마감을 한 번에 설정한다. */
export function InventoryCalendar({ roomId }: { roomId: number }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const today = todayKst()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState('')
  const [price, setPrice] = useState('')
  const [closed, setClosed] = useState<ClosedChoice>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const query = useHostInventories(roomId, month)

  const byDate = useMemo(
    () => new Map((query.data ?? []).map((item) => [item.stayDate, item])),
    [query.data],
  )
  const { first, daysInMonth } = monthRange(month)
  const days = Array.from({ length: daysInMonth }, (_, index) =>
    addDays(first, index),
  )
  const leading = weekdayOf(first)

  const mutation = useMutation({
    mutationFn: (body: SetInventoriesRequest) =>
      inventoryApi.setHostInventories(roomId, body),
    onSuccess: () => {
      toast.show('재고를 저장했습니다.', 'success')
      setTotalCount('')
      setPrice('')
      setClosed('')
      setErrors({})
      setFormError('')
      // 재고가 바뀌면 호스트 달력과 공개 화면의 예약 가능 여부가 달라진다.
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
    onError: (error) => {
      setErrors(fieldErrorsOf(error))
      setFormError(getErrorMessage(error, inventoryErrorMessages))
    },
  })

  const pickDate = (date: string) => {
    if (!startDate || endDate) {
      setStartDate(date)
      setEndDate(null)
    } else if (date < startDate) {
      setStartDate(date)
    } else {
      setEndDate(date)
    }
  }

  const rangeEnd = endDate ?? startDate
  const inRange = (date: string) =>
    !!startDate && !!rangeEnd && date >= startDate && date <= rangeEnd

  // 선택 기간 중 이 달에 보이는 날짜의 예약·선점 최대치 (제출 전 경고용)
  const maxUsed = days.filter(inRange).reduce((max, date) => {
    const item = byDate.get(date)
    return Math.max(max, item ? item.bookedCount + item.heldCount : 0)
  }, 0)
  const countWarning = totalCount !== '' && Number(totalCount) < maxUsed

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!startDate || !rangeEnd) return
    const next: Record<string, string> = {}
    if (
      totalCount !== '' &&
      (!Number.isInteger(Number(totalCount)) || Number(totalCount) < 0)
    ) {
      next.totalCount = '수량은 0 이상의 정수로 입력해 주세요.'
    }
    if (price !== '' && !(Number(price) > 0))
      next.price = '가격은 0보다 커야 합니다.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return
    if (totalCount === '' && price === '' && closed === '') {
      setFormError(inventoryErrorMessages['INVENTORY-004'])
      return
    }
    // 바꿀 항목만 보낸다.
    mutation.mutate({
      startDate,
      endDate: rangeEnd,
      ...(totalCount !== '' ? { totalCount: Number(totalCount) } : {}),
      ...(price !== '' ? { price: Number(price) } : {}),
      ...(closed !== '' ? { closed: closed === 'closed' } : {}),
    })
  }

  return (
    <div className="stack">
      <div className="page-title">
        <button
          type="button"
          className="btn btn-small"
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          ‹ 이전 달
        </button>
        <h3 aria-live="polite">{month.replace('-', '년 ')}월</h3>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          다음 달 ›
        </button>
      </div>

      {query.isPending ? (
        <LoadingBlock />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className="calendar" role="grid" aria-label={`${month} 재고`}>
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="calendar-head" role="columnheader">
              {weekday}
            </div>
          ))}
          {Array.from({ length: leading }, (_, index) => (
            <div key={`blank-${index}`} />
          ))}
          {days.map((date) => {
            const item = byDate.get(date)
            const selected = inRange(date)
            return (
              <button
                key={date}
                type="button"
                role="gridcell"
                aria-pressed={selected}
                className={[
                  'calendar-day',
                  selected ? 'selected' : '',
                  item?.closed ? 'closed' : '',
                  date < today ? 'past' : '',
                ].join(' ')}
                onClick={() => pickDate(date)}
              >
                <strong>{Number(date.slice(8))}</strong>
                {item ? (
                  <>
                    <span>{formatPrice(item.price)}</span>
                    <small>
                      총 {item.totalCount} · 예약 {item.bookedCount} · 선점{' '}
                      {item.heldCount}
                    </small>
                    {item.closed && (
                      <small className="field-error">판매 마감</small>
                    )}
                  </>
                ) : (
                  <small>미설정</small>
                )}
              </button>
            )
          })}
        </div>
      )}

      <form className="card" onSubmit={handleSubmit} noValidate>
        <h3>기간 설정</h3>
        <small>
          {startDate && rangeEnd
            ? `${formatShortDate(startDate)} ~ ${formatShortDate(rangeEnd)} 전체에 같은 값이 들어갑니다. 날짜마다 다르게 하려면 기간을 나눠 저장해 주세요.`
            : '달력에서 시작일과 종료일을 차례로 눌러 기간을 선택해 주세요.'}
        </small>
        <div className="field-row">
          <label className="field">
            <span className="field-label">총 수량</span>
            <input
              type="number"
              min={0}
              max={9999}
              inputMode="numeric"
              value={totalCount}
              placeholder="변경 안 함"
              onChange={(event) => setTotalCount(event.target.value)}
            />
            {errors.totalCount && (
              <small className="field-error">{errors.totalCount}</small>
            )}
          </label>
          <label className="field">
            <span className="field-label">1박 가격 (원)</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={price}
              placeholder="변경 안 함"
              onChange={(event) => setPrice(event.target.value)}
            />
            {errors.price && (
              <small className="field-error">{errors.price}</small>
            )}
          </label>
          <label className="field">
            <span className="field-label">판매 마감</span>
            <select
              value={closed}
              onChange={(event) =>
                setClosed(event.target.value as ClosedChoice)
              }
            >
              <option value="">변경 안 함</option>
              <option value="open">판매</option>
              <option value="closed">마감</option>
            </select>
          </label>
        </div>
        {countWarning && (
          <p className="form-notice" role="status">
            선택한 기간에 이미 예약·선점된 수량({maxUsed})보다 적습니다. 저장이
            거부될 수 있어요.
          </p>
        )}
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!startDate || mutation.isPending}
          >
            {mutation.isPending ? '저장 중…' : '저장'}
          </button>
          {startDate && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setStartDate(null)
                setEndDate(null)
              }}
            >
              선택 해제
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
