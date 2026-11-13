import type { ReactNode } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Footer } from '@/common/components/Footer'
import { Header } from '@/common/components/Header'

interface LayoutProps {
  categoryMenu?: ReactNode
  termsLinks?: ReactNode
}

export function Layout({ categoryMenu, termsLinks }: LayoutProps) {
  return (
    <div className="page">
      <Header categoryMenu={categoryMenu} />
      <Outlet />
      <Footer termsLinks={termsLinks} />
      <ScrollRestoration />
    </div>
  )
}
