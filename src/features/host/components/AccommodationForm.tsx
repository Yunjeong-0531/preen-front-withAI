import { useState, type FormEvent } from 'react'
import { FormField } from '@/common/components/FormField'
import { ImageUploader } from '@/common/components/ImageUploader'
import { formatTime } from '@/common/utils/format'
import {
  regionOptions,
  useAmenities,
  useCategories,
  useRegions,
  type AccommodationDetail,
} from '@/features/accommodation/public'
import type { AccommodationBody } from '@/features/host/api/hostApi'

interface AccommodationFormProps {
  initial?: AccommodationDetail
  submitLabel: string
  submitting: boolean
  /** 서버의 필드 오류(COMMON-001) */
  serverErrors?: Record<string, string>
  formError?: string
  onSubmit: (body: AccommodationBody) => void
}

/** 숙소 등록·수정 폼. 공개 상태는 여기서 바꾸지 않는다. */
export function AccommodationForm({
  initial,
  submitLabel,
  submitting,
  serverErrors = {},
  formError,
  onSubmit,
}: AccommodationFormProps) {
  const regions = useRegions()
  const categories = useCategories()
  const amenities = useAmenities()
  const [name, setName] = useState(initial?.name ?? '')
  const [regionId, setRegionId] = useState(
    initial ? String(initial.regionId) : '',
  )
  const [categoryId, setCategoryId] = useState(
    initial ? String(initial.categoryId) : '',
  )
  const [address, setAddress] = useState(initial?.address ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [checkInTime, setCheckInTime] = useState(
    initial ? formatTime(initial.checkInTime) : '15:00',
  )
  const [checkOutTime, setCheckOutTime] = useState(
    initial ? formatTime(initial.checkOutTime) : '11:00',
  )
  const [amenityIds, setAmenityIds] = useState<number[]>(
    initial?.amenities.map((amenity) => amenity.id) ?? [],
  )
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.imageUrls ?? [])
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const errors = { ...serverErrors, ...localErrors }

  const toggleAmenity = (id: number) =>
    setAmenityIds((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = '숙소 이름을 입력해 주세요.'
    if (!regionId) next.regionId = '지역을 선택해 주세요.'
    if (!categoryId) next.categoryId = '카테고리를 선택해 주세요.'
    if (!address.trim()) next.address = '주소를 입력해 주세요.'
    if (!checkInTime) next.checkInTime = '체크인 시각을 입력해 주세요.'
    if (!checkOutTime) next.checkOutTime = '체크아웃 시각을 입력해 주세요.'
    setLocalErrors(next)
    if (Object.keys(next).length > 0) return
    // imageUrls, amenityIds는 보내면 통째로 교체되므로 항상 전체 배열을 보낸다.
    onSubmit({
      name: name.trim(),
      regionId: Number(regionId),
      categoryId: Number(categoryId),
      address: address.trim(),
      description: description.trim(),
      checkInTime,
      checkOutTime,
      imageUrls,
      amenityIds,
    })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <FormField label="숙소 이름" htmlFor="acc-name" error={errors.name}>
        <input
          id="acc-name"
          value={name}
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>
      <div className="field-row">
        <FormField label="지역" htmlFor="acc-region" error={errors.regionId}>
          <select
            id="acc-region"
            value={regionId}
            onChange={(event) => setRegionId(event.target.value)}
          >
            <option value="">선택</option>
            {regionOptions(regions.data).map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="카테고리"
          htmlFor="acc-category"
          error={errors.categoryId}
        >
          <select
            id="acc-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">선택</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="주소" htmlFor="acc-address" error={errors.address}>
        <input
          id="acc-address"
          value={address}
          maxLength={255}
          onChange={(event) => setAddress(event.target.value)}
        />
      </FormField>
      <FormField
        label="소개"
        htmlFor="acc-description"
        error={errors.description}
      >
        <textarea
          id="acc-description"
          value={description}
          maxLength={5000}
          onChange={(event) => setDescription(event.target.value)}
        />
      </FormField>
      <div className="field-row">
        <FormField
          label="체크인 시각"
          htmlFor="acc-checkin"
          error={errors.checkInTime}
        >
          <input
            id="acc-checkin"
            type="time"
            value={checkInTime}
            onChange={(event) => setCheckInTime(event.target.value)}
          />
        </FormField>
        <FormField
          label="체크아웃 시각"
          htmlFor="acc-checkout"
          error={errors.checkOutTime}
        >
          <input
            id="acc-checkout"
            type="time"
            value={checkOutTime}
            onChange={(event) => setCheckOutTime(event.target.value)}
          />
        </FormField>
      </div>
      <fieldset className="field fieldset">
        <legend className="field-label">편의시설</legend>
        <div className="actions">
          {amenities.data?.map((amenity) => (
            <label key={amenity.id} className="check">
              <input
                type="checkbox"
                checked={amenityIds.includes(amenity.id)}
                onChange={() => toggleAmenity(amenity.id)}
              />
              {amenity.name}
            </label>
          ))}
        </div>
        {errors.amenityIds && (
          <small className="field-error">{errors.amenityIds}</small>
        )}
      </fieldset>
      <ImageUploader
        label="숙소 이미지"
        urls={imageUrls}
        onChange={setImageUrls}
        max={20}
      />
      {errors.imageUrls && (
        <small className="field-error">{errors.imageUrls}</small>
      )}
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '저장 중…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
