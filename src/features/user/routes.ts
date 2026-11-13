import type { ReactNode } from 'react'
import { createElement } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth, guarded } from '@/common/auth/guards'
import { MyPage } from '@/features/user/pages/MyPage'

interface UserRouteSlots {
  socialSection?: ReactNode
}

export function createUserRoutes({
  socialSection,
}: UserRouteSlots = {}): RouteObject[] {
  const Page = () => createElement(MyPage, { socialSection })
  return [{ path: 'me', Component: guarded(RequireAuth, Page) }]
}
