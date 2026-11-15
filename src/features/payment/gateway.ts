
/**
 * PG 결제창 어댑터. `prepare` 응답의 pgProvider 값으로 구현체를 고른다.
 * 카드 정보는 프론트 코드가 다루지 않고 PG 결제창에 맡긴다.
 */
export interface PaymentRequest {
  orderId: string
  amount: number
  orderName: string
  customerName?: string
  /** 결제창이 끝난 뒤 돌아올 주소. paymentKey, orderId, amount가 쿼리로 붙는다. */
  successUrl: string
  failUrl: string
}

export interface PaymentGateway {
  requestPayment: (request: PaymentRequest) => Promise<void>
}

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    public readonly cancelled = false,
  ) {
    super(message)
    this.name = 'PaymentGatewayError'
  }
}

/**
 * 백엔드 PG_PROVIDER=fake용. 결제창 없이 바로 성공 URL로 돌아간다.
 * 가짜 PG는 paymentKey가 "fail"로 시작하면 승인을 거부하고, 그 외에는 승인한다.
 */
const fakeGateway: PaymentGateway = {
  async requestPayment({ orderId, amount, successUrl }) {
    const url = new URL(successUrl)
    url.searchParams.set('paymentKey', `fake-${orderId}`)
    url.searchParams.set('orderId', orderId)
    url.searchParams.set('amount', String(amount))
    window.location.assign(url.toString())
  },
}

const TOSS_SCRIPT_URL = 'https://js.tosspayments.com/v1/payment'

interface TossPaymentsInstance {
  requestPayment: (
    method: string,
    options: {
      amount: number
      orderId: string
      orderName: string
      customerName?: string
      successUrl: string
      failUrl: string
    },
  ) => Promise<void>
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance
  }
}

let tossScript: Promise<void> | null = null

/** 토스페이먼츠 결제창 스크립트를 한 번만 불러온다. 외부 스크립트는 PG SDK만 허용한다. */
function loadTossScript(): Promise<void> {
  if (window.TossPayments) return Promise.resolve()
  if (!tossScript) {
    tossScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = TOSS_SCRIPT_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        tossScript = null
        script.remove()
        reject(
          new PaymentGatewayError(
            '결제창을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
          ),
        )
      }
      document.head.appendChild(script)
    })
  }
  return tossScript
}

const tossGateway: PaymentGateway = {
  async requestPayment(request) {
    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined
    if (!clientKey) {
      throw new PaymentGatewayError(
        '결제 설정이 완료되지 않았습니다. (VITE_TOSS_CLIENT_KEY)',
      )
    }
    await loadTossScript()
    if (!window.TossPayments) {
      throw new PaymentGatewayError(
        '결제창을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    }
    try {
      // 성공하면 successUrl, 실패하면 failUrl로 이동한다.
      await window.TossPayments(clientKey).requestPayment('카드', {
        amount: Math.round(request.amount),
        orderId: request.orderId,
        orderName: request.orderName,
        customerName: request.customerName,
        successUrl: request.successUrl,
        failUrl: request.failUrl,
      })
    } catch (error) {
      const { code, message } = (error ?? {}) as {
        code?: string
        message?: string
      }
      if (code === 'USER_CANCEL') {
        throw new PaymentGatewayError('결제를 취소했습니다.', true)
      }
      throw new PaymentGatewayError(message || '결제를 진행하지 못했습니다.')
    }
  },
}

export function gatewayFor(pgProvider: string): PaymentGateway {
  return pgProvider.toUpperCase() === 'FAKE' ? fakeGateway : tossGateway
}
