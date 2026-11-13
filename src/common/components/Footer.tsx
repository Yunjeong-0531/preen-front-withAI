import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface FooterProps {
  /** 이용약관 · 개인정보처리방침 링크. terms feature가 만든다. */
  termsLinks?: ReactNode
}

export function Footer({ termsLinks }: FooterProps) {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <div className="footer-links">
            <strong>PREEN</strong>
            <nav aria-label="회사 안내">
              <Link to="/about">회사 소개</Link>
              {termsLinks}
              <Link to="/support">고객센터</Link>
              <Link to="/host/register">입점 문의</Link>
            </nav>
          </div>
          <small className="company">
            주식회사 프린 · 대표 김프린 · 서울특별시 성동구 프린로 24 (예시)
            <br />
            사업자등록번호 000-00-00000 · hello@preen.example
          </small>
        </div>
        <div className="contact">
          <p>고객센터 1544-0000</p>
          <small>평일 09:00–18:00 · 주말 및 공휴일 휴무</small>
        </div>
      </div>
      <small className="copyright">
        © 2026 PREEN. 숙소·요금·사업자·예약 정보는 디자인 시안을 위한
        예시입니다.
      </small>
    </footer>
  )
}
