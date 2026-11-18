# 프론트엔드 예약 생성 ~ 결제 완료 전체 플로우 가이드

- **작성일자**: 2026-11-18
- **대상 프로젝트**: `preen-front-withAI`
- **핵심 모듈**: `ReservationNewPage`, `PaymentPage`, `PaymentSuccessPage`, `ReservationDetailPage`, `reservationApi`, `paymentApi`

본 문서는 숙소 상세 페이지에서 객실을 선택한 후 **예약 정보 입력(생성) ➔ 결제 준비 및 PG 결제창 호출 ➔ 결제 승인 및 예약 확정 ➔ 예약 상세 조회**로 이어지는 프론트엔드 전 과정의 플로우차트, 시퀀스 다이어그램, 컴포넌트, 훅, API 쿼리 구조를 총정리한 명세서입니다.

---

## 1. 전체 화면 전환 플로우차트 (Flowchart)

![전체 화면 전환 플로우차트](./images/flowchart.png)

<details>
<summary><b>Mermaid 다이어그램 소스 코드 펼치기</b></summary>

```mermaid
flowchart TD
    A["숙소 상세 페이지 (객실/일정 선택)"] -->|"예약하기 클릭"| B["1. 예약 정보 입력 페이지<br/>ReservationNewPage"]
    
    subgraph Step1 ["1단계: 예약 생성 (/accommodations/:accId/reservations/new)"]
        B --> B1["투숙객 정보 입력 & 규정 동의"]
        B1 --> B2["[예약 및 결제하기] 클릭"]
        B2 --> B3["POST /api/reservations 호출 (PENDING 생성)"]
    end

    B3 -->|"성공 시 navigate replace"| C["2. 결제 대기 및 진행 페이지<br/>PaymentPage"]

    subgraph Step2 ["2단계: 결제 대기 & Toss SDK 연동 (/reservations/:id/payment)"]
        C --> C1["예약 상태 & 10분 만료 카운트다운 확인"]
        C1 --> C2["[결제하기] 클릭"]
        C2 --> C3["POST /api/payments/prepare (orderId 발급)"]
        C3 --> C4["Toss Payments 결제창 팝업 열기"]
    end

    C4 -->|"사용자 카드/간편결제 인증 완료"| D["3. 결제 결과/완료 페이지<br/>PaymentSuccessPage"]
    C4 -->|"사용자 취소 또는 카드 한도 초과"| Fail["결제 실패/취소 페이지<br/>PaymentFailPage"]

    subgraph Step3 ["3단계: 최종 승인 & 예약 확정 (/reservations/:id/payment/success)"]
        D --> D1["URL 쿼리 파싱: orderId, paymentKey, amount"]
        D1 --> D2["화면: '결제를 확인하는 중입니다' 로딩 스피너"]
        D2 --> D3["POST /api/payments/confirm 최종 승인 호출"]
        D3 --> D4["승인 성공 ➔ useReservation 자동 트리거<br/>(GET /api/reservations/:id)"]
        D4 --> D5["예약 확정 화면 렌더링 (예약번호, 요약 카드)"]
    end

    D5 -->|"예약 상세 보기 클릭"| E["4. 마이페이지 예약 상세<br/>ReservationDetailPage"]

    subgraph Step4 ["4단계: 상시 확인 및 취소 (/me/reservations/:id)"]
        E --> E1["예약 상태 뱃지, 일정, 영수증 내역 확인"]
        E1 --> E2["[예약 취소] ➔ POST /api/reservations/:id/cancel"]
        E1 --> E3["[리뷰 남기기] ➔ 숙박 완료 시 리뷰 작성 이동"]
    end
```
</details>

---

## 2. 프론트엔드 종합 시퀀스 다이어그램 (Sequence Diagram)

![프론트엔드 종합 시퀀스 다이어그램](./images/sequence.png)

<details>
<summary><b>Mermaid 다이어그램 소스 코드 펼치기</b></summary>

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자
    participant NewPage as ReservationNewPage
    participant PayPage as PaymentPage
    participant Toss as 토스페이먼츠 SDK
    participant SuccessPage as PaymentSuccessPage
    participant DetailPage as ReservationDetailPage
    participant API as 프론트 API 클라이언트 (http)
    participant Server as 백엔드 서버

    Note over User, NewPage: [1단계: 예약 생성]
    User->>NewPage: 예약자 이름, 연락처 입력 & [결제하기] 클릭
    NewPage->>API: reservationApi.create(body)
    API->>Server: POST /api/reservations
    Server-->>API: 200 OK (Reservation 객체 반환, status: PENDING)
    API-->>NewPage: 예약 데이터 전달
    NewPage->>PayPage: navigate('/reservations/:id/payment')

    Note over User, PayPage: [2단계: 결제 준비 & 결제창 팝업]
    PayPage->>API: reservationApi.detail(id) (GET /api/reservations/:id)
    API->>Server: GET /api/reservations/:id
    Server-->>API: 예약 정보 반환
    API-->>PayPage: 렌더링 (남은 시간 카운트다운 표시)
    User->>PayPage: [결제하기] 버튼 클릭
    PayPage->>API: paymentApi.prepare(reservationId)
    API->>Server: POST /api/payments/prepare
    Server-->>API: orderId, amount, orderName 등 반환
    API-->>PayPage: 결제 준비 정보 전달
    PayPage->>Toss: tossPayments.requestPayment(prepared)
    Toss-->>User: 결제 모달 팝업 표시

    Note over User, SuccessPage: [3단계: 인증 완료 & 최종 승인]
    User->>Toss: 카드 인증 완료
    Toss->>SuccessPage: successUrl로 리다이렉트 (?orderId=...&paymentKey=...&amount=...)
    Note over SuccessPage: 마운트: '결제를 확인하는 중입니다' 로딩 노출
    SuccessPage->>API: paymentApi.confirm({ orderId, paymentKey, amount })
    API->>Server: POST /api/payments/confirm
    Server-->>API: 승인 성공 응답 (status: CONFIRMED)
    API-->>SuccessPage: 결제 결과(PaymentResult) 반환
    SuccessPage->>API: useReservation 트리거 (GET /api/reservations/:id)
    API->>Server: GET /api/reservations/:id
    Server-->>API: 확정된 예약 상세 정보 반환
    API-->>SuccessPage: 확정 데이터 전달
    SuccessPage-->>User: '예약이 확정되었습니다' 확정 화면 렌더링!

    Note over User, DetailPage: [4단계: 예약 상세 보기 이동]
    User->>SuccessPage: [예약 상세 보기] 버튼 클릭
    SuccessPage->>DetailPage: 이동 (/me/reservations/:id)
    DetailPage->>API: reservationApi.detail(id)
    API->>Server: GET /api/reservations/:id
    Server-->>API: 전체 예약 및 환불정책 스냅샷 반환
    DetailPage-->>User: 세부 영수증, 상태 뱃지, [예약 취소] 버튼 렌더링
```
</details>

---

## 3. 페이지별 사용 컴포넌트, 훅, 쿼리/API 총정리

### 1) 예약 생성 페이지: `ReservationNewPage.tsx`
* **파일 위치**: `src/features/reservation/pages/ReservationNewPage.tsx`
* **URL**: `/accommodations/:accommodationId/reservations/new?roomId=...&checkIn=...&checkOut=...&guestCount=...`

| 구분 | 이름 | 역할 |
| :--- | :--- | :--- |
| **컴포넌트** | `<CheckoutLayout />` | 결제 단계 표시 헤더(Step 1)와 좌우 2열 분할 레이아웃 제공 |
| | `<StaySummaryCard />` | 우측 사이드바에 숙소 썸네일, 일정, 객실, 예상 금액 요약 표시 |
| | `<FormField />` | 예약자명, 휴대폰 번호 입력창 및 에러 메시지 래핑 |
| | `<RefundPolicyTable />` | 숙소의 취소/환불 규정 테이블 표시 |
| | `<LoadingBlock />` / `<ErrorState />` | 객실 및 숙소 데이터 페칭 중 로딩/에러 뷰 |
| **훅 (Hooks)** | `useAccommodationDetail(id)` | 숙소 이름 및 환불 정책 스냅샷 조회를 위한 쿼리 훅 |
| | `useAvailability(id, checkIn, checkOut)` | 실시간 객실 가용 여부 및 기간 총 요금 조회를 위한 쿼리 훅 |
| | `useSession()` | 로그인된 사용자 정보 자동 채우기용 세션 훅 |
| | `useInvalidateReservations()` | 예약 생성 성공 시 기존 목록 및 재고 캐시 무효화 훅 |
| | `useSearchParams()` / `useNavigate()` | URL 쿼리 파싱 및 결제 페이지 이동 네비게이션 |
| **API / 쿼리** | **`POST /api/reservations`** | `reservationApi.create(body)`: `PENDING` 상태 예약 생성 및 재고 선점 요청 |

---

### 2) 결제 진행 페이지: `PaymentPage.tsx`
* **파일 위치**: `src/features/payment/pages/PaymentPage.tsx`
* **URL**: `/reservations/:id/payment`

| 구분 | 이름 | 역할 |
| :--- | :--- | :--- |
| **컴포넌트** | `<CheckoutLayout />` | 결제 단계 표시 헤더(Step 2)와 결제 진행 화면 틀 제공 |
| | `<HoldCountdown />` | 결제 대기 유효 시간(10분) 카운트다운 타이머 바 표시 |
| | `<ReservationSummaryCard />` | 확정된 예약의 기본 정보와 총 결제 금액 요약 카드 |
| **훅 (Hooks)** | `useReservation(id)` | 결제 대상 예약 정보 조회 (`GET /api/reservations/:id`) |
| | `useHoldRemaining(data)` | 10분 만료까지 남은 시간(ms) 실시간 계산 |
| | `useParams()` | URL 경로에서 `reservationId` 추출 |
| **API / 쿼리** | **`POST /api/payments/prepare`** | `paymentApi.prepare(id)`: 백엔드 결제 준비 등록 및 `orderId` 발급 |
| | **토스페이먼츠 SDK** | `gatewayFor(pgProvider).requestPayment(...)`: 실제 토스 결제 팝업창 호출 |

---

### 3) 결제 완료/결과 페이지: `PaymentSuccessPage`
* **파일 위치**: `src/features/payment/pages/PaymentResultPages.tsx`
* **URL**: `/reservations/:id/payment/success?orderId=...&paymentKey=...&amount=...`

| 구분 | 이름 | 역할 |
| :--- | :--- | :--- |
| **컴포넌트** | `<CheckoutLayout />` | 결제 완료 단계(Step 3) 레이아웃 |
| | `<ReservationSummaryCard />` | 확정된 예약 데이터 최종 영수증 카드 렌더링 |
| | `<LoadingBlock />` | 백엔드 승인 및 예약 조회 중 "결제를 확인하는 중입니다" 전체 화면 로딩 |
| **훅 (Hooks)** | `useReservation(id)` | 결제 승인 완료 후 확정된 최신 예약 정보를 가져오는 쿼리 훅 |
| | `useInvalidateReservations()` | 승인 완료 후 기존 `detail` 및 `mine` 캐시 강제 무효화 |
| | `useSearchParams()` | 토스 리다이렉트 쿼리(`orderId`, `paymentKey`, `amount`) 파싱 |
| **API / 쿼리** | **`POST /api/payments/confirm`** | `paymentApi.confirm(...)`: 최종 PG 승인 및 예약 상태 `CONFIRMED` 전환 |
| | **`GET /api/reservations/:id`** | `useReservation(id)`: 승인 완료 직후 화면 갱신용 최신 예약 상세 조회 |

---

### 4) 마이페이지 예약 상세 페이지: `ReservationDetailPage.tsx`
* **파일 위치**: `src/features/reservation/pages/ReservationDetailPage.tsx`
* **URL**: `/me/reservations/:id`

| 구분 | 이름 | 역할 |
| :--- | :--- | :--- |
| **컴포넌트** | `<ReservationStatusBadge />` | 상단 타이틀 옆 예약 상태 뱃지(`예약 확정`, `결제 대기`, `숙박 완료` 등) |
| | `<PriceBreakdown />` | 객실료(박수), 인원 추가비 등 세부 요금 영수증 내역 표 |
| | `<RefundPolicyTable />` | 예약 시점에 박제되었던 취소 시점별 환불 규정 스냅샷 표 |
| | `<ConfirmDialog />` | [예약 취소] 버튼 클릭 시 열리는 취소 확인 모달 팝업 |
| **훅 (Hooks)** | `useReservation(id)` | 예약 상세 데이터 조회 (`staleTime: 0`) |
| | `useHoldRemaining(data)` | 만약 `PENDING` 상태일 경우 남은 결제 시간 계산 |
| | `useInvalidateReservations()` | 취소 완료 후 예약 목록 및 숙소 재고 캐시 파기 |
| | `useToast()` | 취소 완료/실패 시 화면 상단 토스트 알림 표시 |
| **API / 쿼리** | **`GET /api/reservations/:id`** | `reservationApi.detail(id)`: 예약 단건 전체 정보 조회 |
| | **`POST /api/reservations/:id/cancel`** | `reservationApi.cancel(id)`: 예약 취소 실행 및 환불/위약금 계산 결과 수신 |
