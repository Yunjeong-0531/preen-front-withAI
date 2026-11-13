import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ErrorState, LoadingBlock } from '@/common/components/StatusViews'
import {
  reviewApi,
  reviewErrorMessages,
  reviewKeys,
  type SpotifyTrack,
} from '@/features/review/api/reviewApi'

const DEBOUNCE_MS = 400

function formatDuration(ms: number) {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

interface TrackSearchProps {
  selectedId?: string
  onSelect: (track: SpotifyTrack) => void
}

/** Spotify 트랙 검색. 입력을 멈춘 뒤 요청한다. */
export function TrackSearch({ selectedId, onSelect }: TrackSearchProps) {
  const [text, setText] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(text.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [text])

  const query = useQuery({
    queryKey: reviewKeys.search(keyword),
    queryFn: ({ signal }) => reviewApi.searchTracks(keyword, signal),
    enabled: keyword.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return (
    <div className="stack">
      <label className="field">
        <span className="field-label">음악 검색</span>
        <input
          type="search"
          value={text}
          maxLength={100}
          placeholder="곡 제목이나 아티스트를 입력하세요"
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      {keyword.length > 0 && query.isPending && (
        <LoadingBlock label="검색하는 중입니다" />
      )}
      {query.isError && (
        <ErrorState
          error={query.error}
          messages={reviewErrorMessages}
          title="음악을 검색하지 못했습니다"
          onRetry={() => void query.refetch()}
        />
      )}
      {query.isSuccess && query.data.length === 0 && (
        <small>검색 결과가 없습니다.</small>
      )}
      {query.isSuccess && query.data.length > 0 && (
        <ul className="track-results plain-list" aria-label="검색 결과">
          {query.data.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                aria-pressed={track.id === selectedId}
                onClick={() => onSelect(track)}
              >
                {track.albumImageUrl ? (
                  <img src={track.albumImageUrl} alt="" loading="lazy" />
                ) : (
                  <span className="track-cover" aria-hidden="true" />
                )}
                <span className="track-text">
                  <span>{track.name}</span>
                  <small>
                    {track.artists.join(', ')}
                    {track.albumName && ` · ${track.albumName}`}
                  </small>
                </span>
                <small>{formatDuration(track.durationMs)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
