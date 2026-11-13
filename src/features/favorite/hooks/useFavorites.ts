import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useSession } from '@/common/auth/session'
import { useToast } from '@/common/components/Toast'
import { getErrorMessage } from '@/common/utils/error'
import {
  favoriteApi,
  fetchAllFavoriteIds,
} from '@/features/favorite/api/favoriteApi'

export const FAVORITE_PAGE_SIZE = 12

export const favoriteKeys = {
  all: ['favorite'] as const,
  ids: () => [...favoriteKeys.all, 'ids'] as const,
  pages: () => [...favoriteKeys.all, 'page'] as const,
  page: (page: number) => [...favoriteKeys.pages(), page] as const,
}

/** 찜한 숙소 ID 집합. 비로그인 상태에서는 호출하지 않는다. */
export function useFavoriteIds() {
  const session = useSession()
  return useQuery({
    queryKey: favoriteKeys.ids(),
    queryFn: fetchAllFavoriteIds,
    enabled: session.isAuthenticated && session.signupCompleted,
  })
}

export function useFavoritePage(page: number) {
  return useQuery({
    queryKey: favoriteKeys.page(page),
    queryFn: () => favoriteApi.mine(page, FAVORITE_PAGE_SIZE),
    placeholderData: keepPreviousData,
  })
}

/** 낙관적 업데이트로 즉시 반영하고 실패하면 되돌린다. */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, favorite }: { id: number; favorite: boolean }) =>
      favorite ? favoriteApi.add(id) : favoriteApi.remove(id),
    onMutate: async ({ id, favorite }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.ids() })
      const previous = queryClient.getQueryData<number[]>(favoriteKeys.ids())
      queryClient.setQueryData<number[]>(favoriteKeys.ids(), (ids = []) =>
        favorite
          ? [...new Set([...ids, id])]
          : ids.filter((value) => value !== id),
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(favoriteKeys.ids(), context?.previous)
      toast.show(
        getErrorMessage(error, { 'FAVORITE-001': '찜할 수 없는 숙소입니다.' }),
        'error',
      )
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all }),
  })
}
