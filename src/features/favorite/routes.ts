import type { RouteObject } from 'react-router-dom'
import { RequireAuth, guarded } from '@/common/auth/guards'
import { FavoritesPage } from '@/features/favorite/pages/FavoritesPage'

export const favoriteRoutes: RouteObject[] = [
  { path: 'me/favorites', Component: guarded(RequireAuth, FavoritesPage) },
]
