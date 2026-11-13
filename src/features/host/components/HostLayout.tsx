import {
  Link,
  NavLink,
  Outlet,
  ScrollRestoration,
  useNavigate,
} from 'react-router-dom'
import { useSession } from '@/common/auth/session'
import '@/features/host/host.css'

/** `/host/**` 전용 레이아웃. 호스트 메뉴를 왼쪽에 둔다. */
export function HostLayout() {
  const session = useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await session.signOut()
    navigate('/')
  }

  return (
    <div className="host-shell">
      <aside className="host-side">
        <h1>
          <Link to="/">PREEN</Link>
        </h1>
        <nav aria-label="호스트 메뉴" className="host-nav">
          <NavLink to="/host" end>
            내 숙소
          </NavLink>
          <NavLink to="/host/accommodations/new">숙소 등록</NavLink>
          <NavLink to="/host/reservations">예약 목록</NavLink>
          <NavLink to="/host/register">사업자 정보</NavLink>
          <Link to="/">게스트 화면으로</Link>
          <button type="button" onClick={handleSignOut}>
            로그아웃
          </button>
        </nav>
      </aside>
      <Outlet />
      <ScrollRestoration />
    </div>
  )
}
