import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Dialog } from '@/common/components/Dialog'
import { FormField } from '@/common/components/FormField'
import { ImageUploader } from '@/common/components/ImageUploader'
import { useToast } from '@/common/components/Toast'
import { fieldErrorsOf, getErrorMessage } from '@/common/utils/error'
import { formatPrice } from '@/common/utils/format'
import type { AccommodationDetail, Room } from '@/features/accommodation/public'
import {
  hostApi,
  hostErrorMessages,
  type RoomBody,
} from '@/features/host/api/hostApi'

interface RoomFormProps {
  accommodationId: number
  room?: Room
  onDone: () => void
  onCancel: () => void
}

function RoomForm({ accommodationId, room, onDone, onCancel }: RoomFormProps) {
  const toast = useToast()
  const [name, setName] = useState(room?.name ?? '')
  const [capacity, setCapacity] = useState(String(room?.capacity ?? 2))
  const [maxCapacity, setMaxCapacity] = useState(String(room?.maxCapacity ?? 2))
  const [nightlyPrice, setNightlyPrice] = useState(
    room ? String(room.nightlyPrice) : '',
  )
  const [extraPersonFee, setExtraPersonFee] = useState(
    String(room?.extraPersonFee ?? 0),
  )
  const [imageUrls, setImageUrls] = useState<string[]>(room?.imageUrls ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const base = Number(capacity)
    const max = Number(maxCapacity)
    if (!name.trim()) next.name = '객실 이름을 입력해 주세요.'
    if (!Number.isInteger(base) || base < 1)
      next.capacity = '기준 인원은 1명 이상이어야 합니다.'
    if (!Number.isInteger(max) || max < 1)
      next.maxCapacity = '최대 인원은 1명 이상이어야 합니다.'
    else if (max < base)
      next.maxCapacity = '최대 인원은 기준 인원 이상이어야 합니다.'
    if (!(Number(nightlyPrice) > 0))
      next.nightlyPrice = '1박 요금은 0보다 커야 합니다.'
    if (extraPersonFee === '' || Number(extraPersonFee) < 0) {
      next.extraPersonFee = '추가 인원 요금은 0 이상이어야 합니다.'
    }
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    const body: RoomBody = {
      name: name.trim(),
      capacity: base,
      maxCapacity: max,
      nightlyPrice: Number(nightlyPrice),
      extraPersonFee: Number(extraPersonFee),
      imageUrls,
    }
    setSubmitting(true)
    try {
      if (room) await hostApi.updateRoom(accommodationId, room.id, body)
      else await hostApi.addRoom(accommodationId, body)
      toast.show(
        room ? '객실을 수정했습니다.' : '객실을 등록했습니다.',
        'success',
      )
      onDone()
    } catch (error) {
      setErrors(fieldErrorsOf(error))
      setFormError(getErrorMessage(error, hostErrorMessages))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <FormField label="객실 이름" htmlFor="room-name" error={errors.name}>
        <input
          id="room-name"
          value={name}
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>
      <div className="field-row">
        <FormField
          label="기준 인원"
          htmlFor="room-capacity"
          error={errors.capacity}
        >
          <input
            id="room-capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
          />
        </FormField>
        <FormField
          label="최대 인원"
          htmlFor="room-max"
          error={errors.maxCapacity}
        >
          <input
            id="room-max"
            type="number"
            min={1}
            value={maxCapacity}
            onChange={(event) => setMaxCapacity(event.target.value)}
          />
        </FormField>
      </div>
      <div className="field-row">
        <FormField
          label="1박 요금 (원)"
          htmlFor="room-price"
          error={errors.nightlyPrice}
        >
          <input
            id="room-price"
            type="number"
            min={1}
            value={nightlyPrice}
            onChange={(event) => setNightlyPrice(event.target.value)}
          />
        </FormField>
        <FormField
          label="추가 인원 요금 (원)"
          htmlFor="room-extra"
          error={errors.extraPersonFee}
          hint="기준 인원 초과 1명당 1박 요금"
        >
          <input
            id="room-extra"
            type="number"
            min={0}
            value={extraPersonFee}
            onChange={(event) => setExtraPersonFee(event.target.value)}
          />
        </FormField>
      </div>
      <ImageUploader
        label="객실 이미지"
        urls={imageUrls}
        onChange={setImageUrls}
        max={20}
      />
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '저장 중…' : room ? '객실 수정' : '객실 등록'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={onCancel}
          disabled={submitting}
        >
          닫기
        </button>
      </div>
    </form>
  )
}

interface RoomManagerProps {
  detail: AccommodationDetail
  onChanged: () => void
}

/** 객실 목록과 등록·수정·판매 중지. 호스트 상세에는 판매 중지 객실도 나온다. */
export function RoomManager({ detail, onChanged }: RoomManagerProps) {
  const toast = useToast()
  const [editing, setEditing] = useState<Room | 'new' | null>(null)
  const [pendingRoomId, setPendingRoomId] = useState<number | null>(null)

  const toggleStatus = async (room: Room) => {
    setPendingRoomId(room.id)
    try {
      await hostApi.updateRoom(detail.id, room.id, {
        status: room.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      })
      toast.show(
        room.status === 'ACTIVE'
          ? '객실 판매를 중지했습니다.'
          : '객실 판매를 다시 시작했습니다.',
        'success',
      )
      onChanged()
    } catch (error) {
      // 공개 중인 숙소의 마지막 판매 객실은 중지할 수 없다.
      toast.show(getErrorMessage(error, hostErrorMessages), 'error')
    } finally {
      setPendingRoomId(null)
    }
  }

  return (
    <section className="stack">
      <div className="page-title">
        <h3>객실 ({detail.rooms.length})</h3>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => setEditing('new')}
        >
          객실 추가
        </button>
      </div>
      {detail.rooms.length === 0 && (
        <small>등록된 객실이 없습니다. 객실을 추가해 주세요.</small>
      )}
      <ul className="stack plain-list">
        {detail.rooms.map((room) => (
          <li key={room.id} className="list-card">
            <div>
              <span>
                <span
                  className={
                    room.status === 'ACTIVE'
                      ? 'badge badge-ok'
                      : 'badge badge-off'
                  }
                >
                  {room.status === 'ACTIVE' ? '판매 중' : '판매 중지'}
                </span>
              </span>
              <p>{room.name}</p>
              <small>
                기준 {room.capacity}명 · 최대 {room.maxCapacity}명 · 1박{' '}
                {formatPrice(room.nightlyPrice)} · 추가 인원{' '}
                {formatPrice(room.extraPersonFee)}
              </small>
            </div>
            <div className="actions">
              <Link
                className="btn btn-small"
                to={`/host/rooms/${room.id}/inventories?accommodationId=${detail.id}`}
                state={{ roomName: room.name, accommodationName: detail.name }}
              >
                재고 달력
              </Link>
              <button
                type="button"
                className="btn btn-small"
                onClick={() => setEditing(room)}
              >
                수정
              </button>
              <button
                type="button"
                className="btn btn-small"
                disabled={pendingRoomId === room.id}
                onClick={() => void toggleStatus(room)}
              >
                {room.status === 'ACTIVE' ? '판매 중지' : '판매 재개'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={editing !== null}
        title={editing === 'new' ? '객실 추가' : '객실 수정'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <RoomForm
            key={editing === 'new' ? 'new' : editing.id}
            accommodationId={detail.id}
            room={editing === 'new' ? undefined : editing}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null)
              onChanged()
            }}
          />
        )}
      </Dialog>
    </section>
  )
}
