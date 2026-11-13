import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <main className="medium">
      <h2>PREEN 소개</h2>
      <section className="stack">
        <h3>머문 순간을, 한 곡으로.</h3>
        <p>
          PREEN은 숙소를 예약하고, 머문 뒤에는 그날의 분위기와 어울리는 음악을
          한 곡 남기는 숙박 예약 서비스입니다. 리뷰는 별점과 음악으로만 이루어져
          있어요.
        </p>
        <p>
          호스트는 숙소와 객실, 환불정책, 날짜별 재고와 요금을 직접 관리하고,
          게스트는 원하는 날짜의 예약 가능한 객실을 확인한 뒤 바로 결제할 수
          있습니다.
        </p>
      </section>
      <div className="actions">
        <Link className="btn btn-primary" to="/accommodations">
          숙소 둘러보기
        </Link>
        <Link className="btn" to="/host/register">
          숙소 등록하기
        </Link>
      </div>
    </main>
  )
}
