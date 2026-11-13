import { useCallback, useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginPathFor } from '@/common/auth/redirect'
import { useSession } from '@/common/auth/session'
import {
  FavoriteBindingContext,
  type FavoriteBinding,
} from '@/features/accommodation/public'
import {
  useFavoriteIds,
  useToggleFavorite,
} from '@/features/favorite/hooks/useFavorites'

/** 숙소 카드와 상세의 하트에 찜 상태와 토글을 공급한다. */
export function FavoriteBindingProvider({ children }: { children: ReactNode }) {
  const session = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const ids = useFavoriteIds()
  const { mutate } = useToggleFavorite()
  const idSet = useMemo(() => new Set(ids.data ?? []), [ids.data])
  const returnTo = location.pathname + location.search

  const toggle = useCallback(
    (accommodationId: number) => {
      // 비로그인 상태에서 하트를 누르면 로그인으로 보낸다.
      if (!session.isAuthenticated) {
        navigate(loginPathFor(returnTo))
        return
      }
      mutate({ id: accommodationId, favorite: !idSet.has(accommodationId) })
    },
    [session.isAuthenticated, navigate, returnTo, mutate, idSet],
  )

  const value = useMemo<FavoriteBinding>(
    () => ({ isFavorite: (id) => idSet.has(id), toggle }),
    [idSet, toggle],
  )

  return (
    <FavoriteBindingContext.Provider value={value}>
      {children}
    </FavoriteBindingContext.Provider>
  )
}
