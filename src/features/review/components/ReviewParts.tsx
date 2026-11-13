import '@/features/review/review.css'

/**
 * Spotify 공식 임베드 플레이어. 제목·아티스트·커버·재생을 모두 임베드가 맡는다.
 * 자동 재생하지 않고, 화면에 보일 때 로드한다.
 */
export function SpotifyEmbed({ trackId }: { trackId: string }) {
  return (
    <iframe
      className="spotify-embed"
      title="Spotify 플레이어"
      src={`https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}`}
      loading="lazy"
      height={80}
      allow="encrypted-media; clipboard-write"
    />
  )
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" role="img" aria-label={`별점 ${rating}점`}>
      {'★'.repeat(rating)}
      <span className="stars-off">{'★'.repeat(Math.max(0, 5 - rating))}</span>
    </span>
  )
}

export function StarInput({
  value,
  onChange,
}: {
  value: number
  onChange: (rating: number) => void
}) {
  return (
    <div className="star-input" role="radiogroup" aria-label="별점">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          role="radio"
          aria-checked={value === rating}
          aria-label={`${rating}점`}
          className={rating <= value ? 'on' : undefined}
          onClick={() => onChange(rating)}
        >
          ★
        </button>
      ))}
    </div>
  )
}
