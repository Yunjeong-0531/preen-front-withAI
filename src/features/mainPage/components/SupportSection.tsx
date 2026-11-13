import { Link } from 'react-router-dom'

export function SupportSection() {
  return (
    <section className="support" aria-label="고객 지원">
      <div>
        <h2>
          <Link to="/me/reservations">예약 내역 확인</Link>
        </h2>
        <small>예약번호와 결제 정보를 확인할 수 있어요.</small>
      </div>
      <div>
        {/* 연결 대상은 협의 중이다. 그 전까지 동작 없음. */}
        <h2>취소 기한 확인</h2>
        <small>숙소마다 무료 취소 기한이 다릅니다.</small>
      </div>
      <div>
        <h2>
          <Link to="/support">고객센터 문의</Link>
        </h2>
        <small>예약·결제·숙소 이용 문의를 남겨주세요.</small>
      </div>
    </section>
  )
}
