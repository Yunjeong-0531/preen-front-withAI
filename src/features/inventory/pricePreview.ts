/**
 * 추가 인원 요금 미리보기: (인원 − 기준 인원) × 추가 인원 요금 × 박수. 0 이하면 없다.
 * 확정 금액은 예약 생성 응답의 요금 항목이다.
 */
export function estimateExtraPersonFee(
  guestCount: number,
  room: { capacity: number; extraPersonFee: number; nights: number },
): number {
  return (
    Math.max(0, guestCount - room.capacity) * room.extraPersonFee * room.nights
  )
}
