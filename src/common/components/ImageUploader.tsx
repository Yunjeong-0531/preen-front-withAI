import { useId, useState, type ChangeEvent } from 'react'
import { http } from '@/common/api/http'
import { getErrorMessage } from '@/common/utils/error'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

interface ImageUploaderProps {
  label: string
  urls: string[]
  onChange: (urls: string[]) => void
  max?: number
}

/**
 * 파일을 고르면 `POST /api/images`로 올리고 받은 절대 URL을 목록에 넣는다.
 * 형식(JPEG·PNG·GIF·WebP)과 크기(5MB)는 올리기 전에도 검사한다.
 */
export function ImageUploader({
  label,
  urls,
  onChange,
  max = 20,
}: ImageUploaderProps) {
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [failed, setFailed] = useState<File[]>([])

  const upload = async (files: File[]) => {
    setError('')
    const room = max - urls.length
    if (files.length > room) {
      setError(`이미지는 ${max}장까지 등록할 수 있습니다.`)
      files = files.slice(0, Math.max(0, room))
    }
    const valid: File[] = []
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('JPEG, PNG, GIF, WebP 이미지만 올릴 수 있습니다.')
      } else if (file.size > MAX_SIZE) {
        setError('5MB 이하의 이미지만 올릴 수 있습니다.')
      } else if (file.size === 0) {
        setError('비어 있는 파일은 올릴 수 없습니다.')
      } else {
        valid.push(file)
      }
    }
    if (valid.length === 0) return

    setUploading(true)
    const next = [...urls]
    const notUploaded: File[] = []
    for (const file of valid) {
      try {
        const { url } = await http.upload<{ url: string }>('/api/images', file)
        next.push(url)
        onChange([...next])
      } catch (uploadError) {
        notUploaded.push(file)
        setError(getErrorMessage(uploadError))
      }
    }
    setFailed(notUploaded)
    setUploading(false)
  }

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    void upload(files)
  }

  return (
    <div className="field">
      <label htmlFor={inputId}>
        {label} ({urls.length}/{max})
      </label>
      {urls.length > 0 && (
        <ul className="thumbs plain-list">
          {urls.map((url, index) => (
            <li key={url + index} className="thumb">
              <img src={url} alt={`${label} ${index + 1}`} />
              <button
                type="button"
                aria-label={`${label} ${index + 1} 삭제`}
                onClick={() =>
                  onChange(urls.filter((_, position) => position !== index))
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={inputId}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        disabled={uploading || urls.length >= max}
        onChange={handleSelect}
      />
      {uploading && <small role="status">이미지를 올리는 중입니다…</small>}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
      {failed.length > 0 && !uploading && (
        <div className="actions">
          <button
            type="button"
            className="btn btn-small"
            onClick={() => void upload(failed)}
          >
            실패한 {failed.length}장 다시 올리기
          </button>
        </div>
      )}
    </div>
  )
}
