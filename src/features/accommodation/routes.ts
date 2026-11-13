import { createElement } from 'react'
import type { RouteObject } from 'react-router-dom'
import {
  AccommodationDetailPage,
  type AccommodationDetailSlots,
} from '@/features/accommodation/pages/AccommodationDetailPage'
import { AccommodationListPage } from '@/features/accommodation/pages/AccommodationListPage'

export function createAccommodationRoutes(
  slots: AccommodationDetailSlots = {},
): RouteObject[] {
  const DetailPage = () => createElement(AccommodationDetailPage, slots)
  return [
    { path: 'accommodations', Component: AccommodationListPage },
    { path: 'accommodations/:id', Component: DetailPage },
  ]
}
