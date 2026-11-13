import type { RouteObject } from 'react-router-dom'
import { createElement } from 'react'
import { ComingSoon } from '@/common/components/Screens'
import { AboutPage } from '@/features/staticPage/pages/AboutPage'

// 장바구니와 고객센터는 2차 구현이다. 1차는 준비 중 화면만 둔다.
const CartPage = () => createElement(ComingSoon, { title: '장바구니' })
const SupportPage = () => createElement(ComingSoon, { title: '고객센터 문의' })

export const staticRoutes: RouteObject[] = [
  { path: 'about', Component: AboutPage },
  { path: 'cart', Component: CartPage },
  { path: 'support', Component: SupportPage },
]
