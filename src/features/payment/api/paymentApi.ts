import { http } from '@/common/api/http'

export interface PrepareResponse {
  /** PG에 넘기는 주문 번호(멱등키) */
  orderId: string
  amount: number
  orderName: string
  /** TOSS, FAKE */
  pgProvider: string
}

export interface ConfirmRequest {
  orderId: string
  paymentKey: string
  amount: number
}

export interface PaymentResult {
  orderId: string
  reservationId: number
  amount: number
  method?: string
  status: string
  paidAt?: string
}

export const paymentApi = {
  prepare: (reservationId: number) =>
    http.post<PrepareResponse>('/api/payments/prepare', { reservationId }),
  confirm: (body: ConfirmRequest) =>
    http.post<PaymentResult>('/api/payments/confirm', body),
}

export const PAYMENT_NOT_PAYABLE = 'PAYMENT-003'
export const PAYMENT_AMOUNT_MISMATCH = 'PAYMENT-004'
export const PAYMENT_APPROVAL_FAILED = 'PAYMENT-005'
export const PAYMENT_ALREADY_PROCESSED = 'PAYMENT-006'
export const PAYMENT_EXPIRED_REFUNDED = 'PAYMENT-007'

export const paymentErrorMessages: Record<string, string> = {
  'PAYMENT-001': '결제 정보를 찾을 수 없습니다.',
  'PAYMENT-002': '본인의 예약만 결제할 수 있습니다.',
  'PAYMENT-003': '결제할 수 없는 예약 상태입니다.',
  'PAYMENT-004': '결제 금액이 예약 금액과 달라 결제를 진행할 수 없습니다.',
  'PAYMENT-005': '결제 승인에 실패했습니다.',
  'PAYMENT-006': '이미 처리가 끝난 결제입니다.',
  'PAYMENT-007': '결제 시간이 만료되어 자동으로 환불되었습니다.',
}
