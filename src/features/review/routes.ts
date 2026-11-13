import type { RouteObject } from 'react-router-dom'
import { RequireAuth, guarded } from '@/common/auth/guards'
import { ReviewWritePage } from '@/features/review/pages/ReviewWritePage'

export const reviewRoutes: RouteObject[] = [
  {
    path: 'reservations/:id/review',
    Component: guarded(RequireAuth, ReviewWritePage),
  },
]
