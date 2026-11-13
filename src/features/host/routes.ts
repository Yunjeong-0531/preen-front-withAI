import type { RouteObject } from 'react-router-dom'
import { RequireAuth, RequireHost, guarded } from '@/common/auth/guards'
import { HostLayout } from '@/features/host/components/HostLayout'
import { HostAccommodationNewPage } from '@/features/host/pages/HostAccommodationNewPage'
import { HostAccommodationPage } from '@/features/host/pages/HostAccommodationPage'
import { HostHomePage } from '@/features/host/pages/HostHomePage'
import {
  HostInventoryPage,
  HostReservationsPage,
} from '@/features/host/pages/HostOtherPages'
import { HostRegisterPage } from '@/features/host/pages/HostRegisterPage'

/** 사업자 등록은 로그인한 회원 누구나 접근한다. 게스트용 Layout 아래에 둔다. */
export const hostRegisterRoutes: RouteObject[] = [
  { path: 'host/register', Component: guarded(RequireAuth, HostRegisterPage) },
]

/** `/host/**`는 호스트 메뉴가 있는 별도 레이아웃을 쓴다. */
export const hostRoute: RouteObject = {
  path: 'host',
  Component: guarded(RequireHost, HostLayout),
  children: [
    { index: true, Component: HostHomePage },
    { path: 'accommodations/new', Component: HostAccommodationNewPage },
    { path: 'accommodations/:id', Component: HostAccommodationPage },
    { path: 'rooms/:roomId/inventories', Component: HostInventoryPage },
    { path: 'reservations', Component: HostReservationsPage },
  ],
}
