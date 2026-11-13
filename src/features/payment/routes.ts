import type { RouteObject } from 'react-router-dom'
import { RequireAuth, guarded } from '@/common/auth/guards'
import { PaymentPage } from '@/features/payment/pages/PaymentPage'
import {
  PaymentFailPage,
  PaymentSuccessPage,
} from '@/features/payment/pages/PaymentResultPages'

export const paymentRoutes: RouteObject[] = [
  {
    path: 'reservations/:id/payment',
    Component: guarded(RequireAuth, PaymentPage),
  },
  {
    path: 'reservations/:id/payment/success',
    Component: guarded(RequireAuth, PaymentSuccessPage),
  },
  {
    path: 'reservations/:id/payment/fail',
    Component: guarded(RequireAuth, PaymentFailPage),
  },
]
