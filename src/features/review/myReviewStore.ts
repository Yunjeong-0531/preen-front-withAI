/**
 * 예약 → 내가 쓴 리뷰. 서버에는 "이 예약에 내가 쓴 리뷰"를 조회하는 API가 없어서,
 * 수정·삭제로 다시 들어올 수 있도록 작성한 기기에만 기억해 둔다.
 * 트랙 ID와 별점뿐이며 Spotify 메타데이터는 저장하지 않는다.
 */
const STORAGE_KEY = 'preen.myReviews'

export interface MyReview {
  reviewId: number
  rating: number
  spotifyTrackId: string
}

type Store = Record<string, Record<string, MyReview>>

function read(): Store {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{}',
    )
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Store)
      : {}
  } catch {
    return {}
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // 저장소를 쓸 수 없으면 기억하지 않는다.
  }
}

export const myReviewStore = {
  get(userId: number, reservationId: number): MyReview | undefined {
    return read()[userId]?.[reservationId]
  },
  set(userId: number, reservationId: number, review: MyReview) {
    const store = read()
    store[userId] = { ...store[userId], [reservationId]: review }
    write(store)
  },
  remove(userId: number, reservationId: number) {
    const store = read()
    if (!store[userId]) return
    delete store[userId][reservationId]
    write(store)
  },
}
