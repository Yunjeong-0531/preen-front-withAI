import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '@/common/components/Layout'
import { NotFoundView, RouteError } from '@/common/components/Screens'
import {
  CategoryMenu,
  createAccommodationRoutes,
} from '@/features/accommodation/public'
import { SocialLinkSection, authRoutes } from '@/features/auth/public'
import {
  FavoriteBindingProvider,
  favoriteRoutes,
} from '@/features/favorite/public'
import { hostRegisterRoutes, hostRoute } from '@/features/host/public'
import { RoomAvailabilitySection } from '@/features/inventory/public'
import { mainRoutes } from '@/features/mainPage/public'
import { paymentRoutes } from '@/features/payment/public'
import { reservationRoutes } from '@/features/reservation/public'
import {
  AccommodationReviews,
  AccommodationTracks,
  reviewRoutes,
} from '@/features/review/public'
import { staticRoutes } from '@/features/staticPage/public'
import { TermsLinks } from '@/features/terms/public'
import { createUserRoutes } from '@/features/user/public'

/** 게스트용 화면의 공통 틀. Feature가 만든 조각을 common 레이아웃의 자리에 끼운다. */
function GuestLayout() {
  return (
    <FavoriteBindingProvider>
      <Layout categoryMenu={<CategoryMenu />} termsLinks={<TermsLinks />} />
    </FavoriteBindingProvider>
  )
}

// 숙소 상세의 객실(inventory)과 음악·리뷰(review) 영역은 여기서 조합한다.
const accommodationRoutes = createAccommodationRoutes({
  renderRooms: (detail) => <RoomAvailabilitySection detail={detail} />,
  renderReviews: (detail) => (
    <>
      <AccommodationTracks accommodationId={detail.id} />
      <AccommodationReviews accommodationId={detail.id} />
    </>
  ),
})

const router = createBrowserRouter([
  {
    path: '/',
    Component: GuestLayout,
    ErrorBoundary: RouteError,
    children: [
      ...mainRoutes,
      ...authRoutes,
      ...createUserRoutes({ socialSection: <SocialLinkSection /> }),
      ...staticRoutes,
      ...accommodationRoutes,
      ...favoriteRoutes,
      ...reservationRoutes,
      ...paymentRoutes,
      ...reviewRoutes,
      ...hostRegisterRoutes,
      { path: '*', Component: NotFoundView },
    ],
  },
  { ...hostRoute, path: '/host', ErrorBoundary: RouteError },
])

export function App() {
  return <RouterProvider router={router} />
}
