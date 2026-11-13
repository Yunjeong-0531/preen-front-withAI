import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '@/common/auth/session'
import {
  CalendarIcon,
  CartIcon,
  HeartIcon,
  HomeIcon,
  LogInIcon,
  LogOutIcon,
  UserIcon,
  UserPlusIcon,
} from '@/common/components/icons'

interface HeaderProps {
  /** 전체 카테고리 드롭다운. accommodation feature가 만든다. */
  categoryMenu?: ReactNode
}

export function Header({ categoryMenu }: HeaderProps) {
  const session = useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await session.signOut()
    navigate('/')
  }

  return (
    <header>
      <h1>
        <Link to="/">PREEN</Link>
      </h1>
      <nav aria-label="주 메뉴">
        {categoryMenu}
        <Link to="/me/favorites">
          <HeartIcon />찜
        </Link>
        <Link to="/cart">
          <CartIcon />
          장바구니
        </Link>
        {session.status === 'loading' ? null : session.isAuthenticated ? (
          <>
            <Link to="/me/reservations">
              <CalendarIcon />내 예약
            </Link>
            <Link to="/me">
              <UserIcon />내 정보
            </Link>
            <Link to={session.isHost ? '/host' : '/host/register'}>
              <HomeIcon />
              {session.isHost ? '호스트 센터' : '숙소 등록하기'}
            </Link>
            <button type="button" onClick={handleSignOut}>
              <LogOutIcon />
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <LogInIcon />
              로그인
            </Link>
            <Link to="/signup">
              <UserPlusIcon />
              회원가입
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
