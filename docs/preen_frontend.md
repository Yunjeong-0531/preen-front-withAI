# PREEN 프론트엔드 1차 구현 명세서

프론트엔드 1차 구현의 기준 문서다. 아래 세 문서와 현재 프론트 코드(메인 화면 시안)를 근거로 썼다.

| 문서 | 내용 |
|---|---|
| `docs/preen_backend.md` | 백엔드 1차 요구사항 (feature, API 경로, 규칙) |
| `docs/preen_ERD_1차구현.md` | 테이블과 컬럼, 상태 값 |
| `docs/StayBook 프론트–백엔드 API 확인 요청.md` | 요청·응답 필드와 규격에 대한 백엔드 답변 (Q1~Q12) |

- API 필드는 확인 요청 문서의 답변(백엔드 `feature/review-music-ci` 브랜치 코드 기준)을 따른다. 본문의 `(Q번호)`는 그 문서의 항목이다.
- 아직 정해지지 않은 것은 **[확인 필요]**(백엔드에 물어야 함) 또는 **[협의]**(기획 결정 대기)로 표시하고 13장에 모았다.
- 서비스명은 **PREEN**이다.

## 1. 현재 상태와 목표

**현재 있는 것**

- React 19 + TypeScript + Vite 7, react-router-dom 7, TanStack Query 5
- 공통 레이아웃(`Header`, `Footer`, `Layout`)과 메인 페이지(`/`) 한 장
- 메인 페이지 구성: 음악 배너, 검색 바 + 카테고리, 숙소 카드 4개, 지역 4개, 큐레이션 2개, 고객 지원
- 공통 HTTP 클라이언트 `src/common/api/http.ts` (JSON, 쿠키 전송, `HttpError`)
- 모든 버튼은 UI만 있고 동작이 없다. 숙소는 정적 예시 데이터, 찜은 메모리 상태다.

**목표**

> 회원가입 → 숙소 조회 → 예약 → 결제 → 취소/환불 → 리뷰 (+ 호스트의 숙소·객실·재고 관리)

1차 전제는 백엔드와 같다: 숙박(1박 이상)만, 예약 1건 = 객실 1개, 할인 없음.

## 2. 작업 방식

1. 기존 시안의 화면, 이미지, 반응형 스타일은 유지한다. 새 화면은 `global.css`의 기존 토큰과 클래스 규칙을 따른다.
2. `README.md`의 협업 규칙(디렉터리 역할, `public.ts` 진입점, `@/` 별칭)을 그대로 따른다.
3. 12장의 단계 순서로 진행하고, 단계마다 `npm run typecheck`와 `npm run build`를 통과시킨다.
4. 새 라이브러리가 필요하면 추가하기 전에 이유와 함께 먼저 묻는다. 1차는 React 상태와 `<input type="date">`로 충분하다. (토스페이먼츠 SDK는 13장 참고)
5. 이 문서에 적힌 필드는 그대로 타입으로 옮긴다. **[확인 필요]** 인 API는 실제 응답을 확인한 뒤 타입을 만든다. 추측으로 만들지 않는다.

## 3. 디렉터리 구조

백엔드 feature와 1:1로 맞춘다.

```
src/
├── common/
│   ├── api/          http.ts (ApiResponse 언래핑, 토큰, 재발급, multipart)
│   ├── auth/         토큰 보관, 세션 상태(useSession), RequireAuth, RequireHost, GuestOnly
│   ├── components/   Layout, Header, Footer, 페이지네이션, 모달, 토스트, 빈 화면, 오류 화면, 준비 중 화면
│   ├── styles/
│   ├── types/        ApiResponse<T>, PageResponse<T>
│   └── utils/        금액·날짜 포맷, 숙박일수 계산, KST 오늘 날짜
└── features/
    ├── mainPage/         (기존)
    ├── auth/             로그인, 가입(이메일 인증 포함), 비밀번호 재설정, 소셜 콜백·가입 완료
    ├── terms/            약관 목록 조회, 동의 체크 UI
    ├── user/             내 정보 조회·수정·탈퇴
    ├── accommodation/    (기존) 목록·검색·상세, 지역·카테고리·편의시설
    ├── inventory/        예약 가능 여부 조회 (게스트), 재고 달력 (호스트)
    ├── reservation/      예약 생성, 내 예약 목록·상세, 취소
    ├── payment/          결제 준비·승인, PG 결제창 어댑터
    ├── review/           리뷰 목록·작성·수정·삭제, Spotify 검색·임베드
    ├── favorite/         찜 토글, 찜 목록
    ├── host/             사업자 등록, 내 숙소·객실·환불정책·재고·예약 관리
    └── staticPage/       회사 소개, 장바구니(준비 중), 고객센터(준비 중)
```

각 feature 내부는 `api/ · hooks/ · components/ · pages/ · types.ts · routes.ts · public.ts`로 통일한다.

**의존 방향** (반대 방향 import 금지)

```
review → reservation → inventory → accommodation
payment → reservation
favorite → accommodation
host → accommodation, inventory, reservation
mainPage → accommodation, favorite
auth, terms → user
```

- `common`은 어떤 feature도 import하지 않는다.
- 다른 feature는 `public.ts`로만 가져온다.
- `accommodation`의 카드가 찜 버튼을 가지므로 찜 상태와 토글 핸들러는 props로 받는다. 현재 `useFavorites`는 `favorite` feature로 옮긴다.

## 4. 공통 규칙

### 4.1 응답 규격 (Q1, Q5)

```ts
interface ApiResponse<T> {
  success: boolean
  code: string        // 성공 시 "OK", 실패 시 "AUTH-003" 같은 에러 코드
  message?: string    // 실패 시
  data?: T
}

interface PageResponse<T> {
  content: T[]
  page: number        // 0부터
  size: number        // 기본 20, 최대 50
  totalElements: number
  totalPages: number
  hasNext: boolean
}
```

- **값이 null인 필드는 응답에서 빠진다.** null이 될 수 있는 필드는 타입에서 선택(`?`)으로 선언하고, 화면은 필드가 없는 경우를 처리한다.
- 오류도 같은 `ApiResponse`다 (`success: false`, `code`, `message`). 입력 검증 실패 `COMMON-001`만 `data`에 `{ 필드명: 메시지 }`가 온다.
- 에러 코드는 `영역-번호` 형식이다. 영역: COMMON, AUTH, USER, TERMS, HOST, ACCOMMODATION, INVENTORY, RESERVATION, PAYMENT, REVIEW, FAVORITE, STORAGE. 코드별 의미는 백엔드의 `*ErrorCode.java`가 기준이다. **[확인 필요: 프론트가 분기해야 하는 코드 값 — 13.1]**
- 금액은 JSON **숫자**이고 `120000.00`처럼 소수점이 붙어 올 수 있다. 환불 비율 `refundRate`는 0~1 사이 숫자다.
- 페이지 번호는 API에서 0부터다. 화면과 URL에는 1부터 보여주고, API를 부를 때 한 곳(`api/` 함수)에서만 변환한다.

### 4.2 HTTP 클라이언트 (`common/api/http.ts` 수정)

- `ApiResponse`를 한 곳에서 언래핑해 `data`만 돌려준다. `success: false`면 `HttpError`에 `status`, `code`, `message`, `fieldErrors`(COMMON-001의 `data`)를 담아 던진다. 화면은 상태 코드가 아니라 **에러 코드**로 분기한다.
- 쿠키를 쓰지 않는다. 현재의 `credentials: 'include'`를 제거한다 (Q2).
- 액세스 토큰이 있으면 `Authorization: Bearer {accessToken}`을 붙인다.
- `401`을 받으면 재발급을 한 번 하고 원 요청을 한 번만 재시도한다. 동시에 여러 요청이 401이어도 재발급은 한 번만 일어나야 한다. 재발급이 실패하면 세션을 비우고 로그인 화면으로 보낸다. `/api/auth/**` 요청에는 이 처리를 적용하지 않는다.
- `POST /api/images`용 `multipart/form-data` 전송을 추가한다.
- 쿼리 스트링은 `URLSearchParams`로 만들고, 값이 없는 조건은 보내지 않는다.

### 4.3 토큰과 세션 (Q2)

토큰 응답은 로그인, 소셜 로그인, 재발급에서 같은 형태다.

```ts
interface TokenResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn: number   // 초
  signupCompleted: boolean
}
```

- **액세스 토큰은 메모리에만** 둔다.
- **리프레시 토큰은 `localStorage`에** 둔다. 서버가 쿠키가 아니라 본문으로 주기 때문에, 새로고침 뒤 로그인 상태를 유지하려면 프론트가 보관해야 한다. 스크립트로 읽을 수 있는 저장소이므로 XSS에 노출되면 탈취될 수 있다. 사용자 입력을 HTML로 넣지 않고(`dangerouslySetInnerHTML` 금지), 외부 스크립트는 PG SDK만 허용한다.
- 재발급: `POST /api/auth/refresh` 본문 `{ refreshToken }`. 서버는 기존 토큰을 지우고 새 토큰을 발급하므로(회전), 응답의 **새 리프레시 토큰으로 반드시 교체**한다. 이전 토큰을 다시 쓰면 실패한다.
- 여러 탭이 동시에 재발급하면 한쪽이 실패해 로그아웃된다. Web Locks API(`navigator.locks`)로 재발급을 탭 사이에서 직렬화하고, 락을 얻은 뒤 저장소의 토큰이 이미 바뀌었으면 재발급하지 않고 그 값을 쓴다. `storage` 이벤트로 다른 탭의 로그아웃을 반영한다.
- 앱 시작: 리프레시 토큰이 있으면 재발급 → `GET /api/users/me`로 사용자와 역할을 채운다. 이 과정이 끝나기 전에는 가드가 판단하지 않고 로딩을 보여준다.
- 로그아웃: `POST /api/auth/logout` 본문 `{ refreshToken }`. 응답과 관계없이 토큰과 TanStack Query 캐시를 전부 비운다. 탈퇴와 비밀번호 재설정 성공 시에도 같다.
- 역할은 `GUEST | HOST | ADMIN`. 사업자 등록 응답으로 새 액세스 토큰이 오면 즉시 교체하고 세션을 다시 조회한다.
- `signupCompleted: false`인 세션은 가입 완료 화면 외의 로그인 필요 화면에 들어갈 수 없다 (7.1).

### 4.4 라우트 가드

| 가드 | 조건 | 실패 시 |
|---|---|---|
| 없음 | 누구나 | — |
| `RequireAuth` | 로그인 + 가입 완료 | 비로그인 → `/login?redirect={원래 경로}`, 가입 미완료 → `/signup/social` |
| `RequireHost` | 역할 HOST | 비로그인 → 로그인, GUEST → `/host/register` |
| `GuestOnly` | 비로그인 | `/` |

가드는 화면 편의일 뿐이다. 서버가 `403`을 주면 그대로 "권한 없음" 화면을 보여준다.

### 4.5 서버 상태

- 조회는 feature의 Custom Hook에서 `useQuery`, 변경은 `useMutation`으로 한다. 조회 조건은 전부 Query Key에 넣는다.
- Query Key는 feature별 팩토리로 관리한다. 예: `accommodationKeys.list(조건)`, `accommodationKeys.detail(id)`, `reservationKeys.mine(page)`.
- 변경 후 무효화 규칙

| 변경 | 무효화 |
|---|---|
| 예약 생성·취소, 결제 승인 | 내 예약 목록·상세, 해당 숙소의 availability |
| 리뷰 작성·수정·삭제 | 해당 숙소의 리뷰·트랙 목록, 내 예약 목록 |
| 찜 토글 | 찜 목록 (낙관적 업데이트, 실패 시 롤백) |
| 호스트의 숙소·객실·환불정책·재고 변경 | 호스트 숙소 목록·상세, 해당 재고 조회, 공개 상세 |
| 사업자 등록 | 세션(`users/me`) |

- 예약 가능 여부와 재고는 변동이 잦으므로 `staleTime: 0`으로 둔다. 지역·카테고리·편의시설·약관은 길게 캐시한다.

### 4.6 표시 규칙

- 금액: 서버 값을 `₩120,000` 형식(소수점 없이)으로 표시한다. 미리보기(7.5) 외에는 화면에서 금액을 계산하지 않는다.
- 환불 비율: `refundRate × 100`을 `%`로 표시한다.
- 날짜: API에는 `YYYY-MM-DD`로 보낸다. 화면에는 `11.20 (금)` 형식(기존 시안)으로 보여준다. 숙박일수 = 체크아웃 − 체크인.
- "오늘"은 **한국 시간(Asia/Seoul)** 기준이다. 서버가 그 기준으로 검증하므로(Q9) 브라우저 시간대와 무관하게 KST로 계산한다.
- 모든 목록 화면은 로딩, 빈 결과, 오류(다시 시도 버튼) 상태를 갖는다.
- 폼은 제출 전에 클라이언트 검증을 하고, `COMMON-001`의 필드 오류를 해당 필드 아래에 표시한다. 제출 중에는 버튼을 비활성화한다.
- 기존 시안의 접근성 수준(`aria-label`, `aria-pressed`, 의미 있는 `alt`)을 새 화면에도 유지한다.

## 5. 화면 목록과 라우트

| 경로 | 화면 | 가드 | feature |
|---|---|---|---|
| `/` | 메인 | 없음 | mainPage |
| `/accommodations` | 숙소 목록·검색 | 없음 | accommodation |
| `/accommodations/:id` | 숙소 상세 | 없음 | accommodation |
| `/login` | 로그인 | GuestOnly | auth |
| `/signup` | 회원가입 (이메일 인증 → 정보 입력) | GuestOnly | auth |
| `/signup/social` | 소셜 가입 완료 (생년월일·약관) | 로그인 + 가입 미완료 | auth |
| `/oauth/:provider/callback` | 소셜 로그인 콜백 | 없음 | auth |
| `/password/forgot` | 비밀번호 재설정 요청 | GuestOnly | auth |
| `/password/reset` | 새 비밀번호 설정 | 없음 | auth |
| `/me` | 내 정보 | RequireAuth | user |
| `/me/reservations` | 내 예약 목록 | RequireAuth | reservation |
| `/me/reservations/:id` | 예약 상세 | RequireAuth | reservation |
| `/me/favorites` | 찜 목록 | RequireAuth | favorite |
| `/reservations/new` | 예약 정보 입력 | RequireAuth | reservation |
| `/reservations/:id/payment` | 결제 | RequireAuth | payment |
| `/reservations/:id/payment/success` | 결제 승인 처리·결과 | RequireAuth | payment |
| `/reservations/:id/payment/fail` | 결제 실패 | RequireAuth | payment |
| `/reservations/:id/review` | 리뷰 작성·수정 | RequireAuth | review |
| `/host/register` | 사업자 등록 | RequireAuth | host |
| `/host` | 호스트 홈 (내 숙소 목록) | RequireHost | host |
| `/host/accommodations/new` | 숙소 등록 | RequireHost | host |
| `/host/accommodations/:id` | 숙소 관리 (정보·객실·환불정책·공개 상태) | RequireHost | host |
| `/host/rooms/:roomId/inventories` | 재고 달력 | RequireHost | host |
| `/host/reservations` | 내 숙소 예약 목록 | RequireHost | host |
| `/cart` | 장바구니 — 준비 중 화면 (2차 구현) | 없음 | staticPage |
| `/support` | 고객센터 문의 — 준비 중 화면 | 없음 | staticPage |
| `/about` | 회사 소개 — 정적 페이지 | 없음 | staticPage |
| `*` | 404 | 없음 | common |

- 게스트용 화면은 기존 `Layout`을 쓴다. `/host/**`는 호스트 메뉴가 있는 별도 레이아웃을 쓴다.
- 소셜 콜백 경로는 백엔드에 등록된 주소와 같아야 한다. 백엔드 기본값이 `http://localhost:3000/oauth/{provider}/callback`이므로 로컬 개발 서버 포트를 3000으로 맞춘다 (Q3).
- "준비 중" 화면은 공통 컴포넌트 하나로 만든다. 제목과 "준비 중입니다" 안내, 메인으로 가는 버튼만 둔다.

## 6. 기존 메인 화면 연결

### 6.1 요소별 동작

| 위치 | 요소 | 동작 |
|---|---|---|
| Header | 로고 `PREEN` | `/` |
| Header | 전체 카테고리 | `GET /api/categories` 드롭다운 → `/accommodations?categoryId=` |
| Header | 최근 본 숙소 | **1차에서 제거** |
| Header | 찜 | `/me/favorites` |
| Header | 장바구니 | `/cart` (준비 중 화면) |
| Header | 로그인 · 회원가입 | 비로그인 시 표시. `/login`, `/signup` |
| Header | (추가) 내 예약 · 내 정보 · 로그아웃 | 로그인 시 로그인·회원가입 자리에 표시 |
| Header | (추가) 호스트 센터 / 숙소 등록하기 | HOST면 `/host`, 아니면 `/host/register` |
| 검색 바 | 여행 지역 (지역 또는 숙소명) | 지역 선택(`GET /api/regions`) 또는 숙소명 입력 → `regionId` / `keyword` |
| 검색 바 | 체크인 · 체크아웃 | 날짜 선택. 기본값은 오늘 체크인 1박 → `checkIn`, `checkOut` |
| 검색 바 | 인원 · 객실 | 인원 선택 → `guestCount`. 객실 수는 **[협의]**, 그 전까지 "객실 1개" 고정 표시 |
| 검색 바 | 검색하기 | `/accommodations?regionId&keyword&checkIn&checkOut&guestCount` |
| 카테고리 | 전체 숙소 | `/accommodations` |
| 카테고리 | 호텔·리조트, 독채·풀빌라, 한옥, 게스트하우스 | `/accommodations?categoryId=` (이름으로 `categories`에서 ID를 찾는다) |
| 카테고리 | 감성 스테이 | 백엔드 카테고리에 없음 **[협의 — 13.2]** |
| 카테고리 | 이번 주말 | 다가오는 토요일 체크인, 일요일 체크아웃을 채운 `/accommodations?checkIn&checkOut` |
| 카테고리 | 지역으로 찾기 | 지역 섹션으로 스크롤 |
| 숙소 섹션 | 카드 4개 | `GET /api/accommodations?size=4`. 섹션 제목 "지금 예약 가능한 숙소"의 기준은 **[협의]** |
| 숙소 섹션 | 더 보기 | `/accommodations` |
| 숙소 섹션 | 찜 하트 | 로그인 시 찜 API 토글, 비로그인 시 로그인으로 이동 |
| 지역 섹션 | 제주·강릉·경주·양평 | 프론트 **정적 매핑** (지역명 ↔ 이미지). `regions`에서 이름으로 ID를 찾아 `/accommodations?regionId=` |
| 큐레이션 | 독채로 사용하는 숙소 | `/accommodations?categoryId=`(독채·풀빌라) |
| 큐레이션 | 바다가 보이는 객실 | **1차에서 제거** |
| 고객 지원 | 예약 내역 확인 | `/me/reservations` |
| 고객 지원 | 취소 기한 확인 | **[협의]**, 그 전까지 동작 없음 |
| 고객 지원 | 고객센터 문의 | `/support` (준비 중 화면) |
| Footer | 회사 소개 | `/about` (정적 페이지) |
| Footer | 이용약관 · 개인정보처리방침 | `GET /api/terms` 내용 표시 |
| Footer | 고객센터 | `/support` |
| Footer | 입점 문의 | `/host/register` |

- 큐레이션은 카드가 하나만 남으므로 레이아웃(2열 → 1열 또는 섹션 구성)을 시안 담당자와 맞춘다.
- "이번 주말" 날짜: 오늘이 토요일이면 오늘, 일요일이면 다음 주 토요일을 체크인으로 한다 (KST 기준).

### 6.2 숙소 카드 데이터 교체

`data/accommodations.ts` 예시 데이터를 삭제하고 `Accommodation` 타입을 목록 API 응답으로 바꾼다 (Q4-2).

| 기존 필드 | 새 필드 | 비고 |
|---|---|---|
| `id`, `name` | `id`, `name` | |
| `location` | `regionName` | 필요하면 `address` 병기 |
| `image` | `thumbnailUrl` | 없으면 대체 이미지 |
| `pricePerNight` | `minNightlyPrice` | 판매 중 객실이 없으면 필드가 없다. 가격 줄을 숨긴다 |

평균 별점은 목록 응답에 없으므로 카드에 별점을 넣지 않는다.

## 7. feature별 명세 — 게스트

### 7.1 auth

| 기능 | API | 요청 → 응답 |
|---|---|---|
| 이메일 중복 확인 | `GET /api/auth/check-email?email=` | → `{available}` |
| 인증코드 발송·재발송 | `POST /api/auth/email/resend` | `{email}` |
| 인증코드 확인 | `POST /api/auth/email/verify` | `{email, code}` (숫자 6자리) |
| 가입 | `POST /api/auth/signup` | `{email, password, name, phone?, birthDate, agreedTermIds}` → `{userId}` |
| 로그인 | `POST /api/auth/login` | **[확인 필요: 요청 필드]** → `TokenResponse` |
| 재발급 · 로그아웃 | `POST /api/auth/refresh`, `/logout` | `{refreshToken}` |
| 소셜 로그인 시작 | `GET /api/auth/social/{provider}` | → `{authorizationUrl}` |
| 소셜 로그인 완료 | `POST /api/auth/social/{provider}` | `{code, state}` → `TokenResponse` |
| 소셜 가입 완료 | `POST /api/auth/signup/complete` | `{birthDate, agreedTermIds}` (Authorization 필요) |
| 소셜 계정 연결 | `POST /api/auth/social/{provider}/link` | **[확인 필요: 요청 필드]** |
| 비밀번호 재설정 | `POST /api/auth/password/forgot`, `/reset` | **[확인 필요: 요청 필드]** |

- **가입** (`/signup`, 한 화면 안의 단계) — **이메일 인증이 가입보다 먼저다** (Q4-1).
  1. 이메일 입력 → 중복 확인(`available`) → 인증코드 발송
  2. 6자리 코드 입력 → 확인. 5회 넘게 틀리면 코드가 무효화되므로 그 오류를 받으면 입력을 막고 재발송을 안내한다. 재발송 버튼은 누른 뒤 일정 시간 비활성화한다.
  3. 비밀번호, 이름, 전화번호(선택), 생년월일, 약관 동의 입력 → 가입. 인증한 이메일은 수정할 수 없게 잠근다.
  4. 가입 응답에는 토큰이 없다. 성공하면 `/login`으로 보내고 가입 완료 안내를 띄운다.
- **검증**: 비밀번호는 영문과 숫자를 포함한 8~64자, 이름 50자 이하, 생년월일 기준 만 14세 이상. 최종 판단은 서버가 한다.
- **약관**: `GET /api/terms`로 받은 목록을 필수·선택으로 구분해 보여주고 "전체 동의"를 제공한다. 필수 약관에 모두 동의해야 제출 버튼이 켜진다. 동의한 약관의 `id` 배열을 `agreedTermIds`로 보낸다.
- **로그인**
  - 실패 5회(기본) 초과 시 15분(기본) 잠긴다. 잠금 오류를 받으면 "잠시 후 다시 시도" 문구를 따로 보여준다. 그 외 실패는 계정 존재 여부를 드러내지 않는 문구("이메일 또는 비밀번호가 올바르지 않습니다")를 쓴다.
  - 성공 → `signupCompleted`가 false면 `/signup/social`, 아니면 `redirect` 쿼리 또는 `/`. `redirect`는 `/`로 시작하는 내부 경로만 허용한다.
- **소셜 로그인** (Q3) — 제공자는 `kakao`, `naver`.
  1. 버튼 클릭 → `GET /api/auth/social/{provider}` → 받은 `authorizationUrl`로 이동
  2. 제공자가 `/oauth/:provider/callback?code&state`로 돌려보낸다
  3. 콜백 화면이 `POST /api/auth/social/{provider}` `{code, state}`를 **한 번만** 호출해 토큰을 받는다. `code`는 일회용이므로 StrictMode 이중 실행과 새로고침으로 두 번 나가지 않게 막는다.
  4. `signupCompleted: false` → `/signup/social`에서 생년월일과 약관 동의를 받아 `POST /api/auth/signup/complete`. 완료 전에는 다른 로그인 필요 화면에 들어갈 수 없다.
  - 사용자가 제공자 화면에서 취소하면 콜백에 `code`가 없다. 로그인 화면으로 돌려보낸다.
  - "같은 이메일의 기존 회원이 있음" 오류를 받으면 기존 계정으로 로그인한 뒤 내 정보에서 연결하라고 안내한다. 자동 병합은 없다.
- **소셜 계정 연결**: 내 정보 화면에서 카카오·네이버 연결 버튼을 제공한다. 같은 콜백 경로를 쓰되, 로그인이 아니라 연결(`/link`)로 처리해야 함을 이동 전에 `sessionStorage`에 표시해 둔다.
- **비밀번호 재설정**
  - 요청 화면은 계정 존재 여부와 관계없이 같은 완료 문구를 보여준다.
  - 재설정 성공 시 모든 기기에서 로그아웃되므로 로그인 화면으로 보낸다.

### 7.2 user

- `GET /api/users/me`, `PATCH /api/users/me`, `DELETE /api/users/me` **[확인 필요: 응답 필드와 수정 가능한 필드]**
- 내 정보 화면: 조회, 수정, 소셜 계정 연결, 탈퇴.
- 탈퇴는 확인 모달을 거친다. 성공하면 세션과 캐시를 비우고 `/`로 보낸다.

### 7.3 accommodation — 목록

`GET /api/accommodations` (Q4-2)

| 파라미터 | 상태 |
|---|---|
| `regionId`, `categoryId`, `guestCount`, `page`, `size` | 백엔드에 있음 |
| `keyword` (숙소명) | **백엔드 추가 필요** — 1차에 구현하기로 결정 |
| `checkIn`, `checkOut` (그 기간에 예약 가능한 숙소만) | **백엔드 추가 필요** — 1차에 구현하기로 결정 |

- 숙소명 검색과 날짜 필터는 현재 백엔드 목록 API에 조건이 없다. 프론트에서 받은 페이지만 걸러내면 결과와 페이지 수가 틀어지므로 **프론트 필터로 대체하지 않는다.** 백엔드에 파라미터 추가를 요청하고, 이름은 위 표를 제안안으로 한다 (13.1).
- 응답 항목: `id, name, address, regionId, regionName, categoryId, categoryName, thumbnailUrl, minNightlyPrice?`
- 검색 조건은 **URL 쿼리 스트링이 유일한 상태**다. 필터를 바꾸면 URL을 바꾸고 화면은 URL에서 조건을 읽는다. 새로고침, 뒤로 가기, 링크 공유가 그대로 동작해야 한다.
- 조건은 함께 쓰면 모두 만족하는 숙소만 나온다(AND). 조건을 바꾸면 페이지는 처음으로 되돌린다.
- 숙소명 입력은 검색 버튼 또는 Enter로 확정한다. 앞뒤 공백을 지우고, 빈 값이면 조건에서 뺀다.
- `checkIn`, `checkOut`은 상세로 갈 때 그대로 넘겨 availability 조회의 초기값으로 쓴다.
- 카드는 기존 `AccommodationCard`를 쓴다. 카드 전체가 상세 링크이고, 찜 버튼 클릭은 링크 이동을 일으키지 않아야 한다.
- 페이지네이션은 페이지 번호 방식(`totalPages`)이고, 전환 중에는 이전 결과를 유지한다(`placeholderData`).

### 7.4 accommodation — 상세

- `GET /api/accommodations/{id}` (Q4-3)

```
id, name, description, address, regionId, regionName, categoryId, categoryName,
latitude, longitude, checkInTime, checkOutTime, listingStatus,
imageUrls[], amenities[{id, name}],
rooms[{id, name, capacity, maxCapacity, extraPersonFee, nightlyPrice, status, imageUrls}],
refundPolicy{id, version, policyText, rules[{daysBefore, refundRate}]}
```

- `GET /api/accommodations/{id}/availability?checkIn&checkOut` (Q4-4) → 객실별 `{roomId, roomName, capacity, maxCapacity, extraPersonFee, nights, available, totalPrice?}`
- 구성
  1. 이미지 갤러리 (`imageUrls`)
  2. 이름, 지역, 카테고리, 주소, 소개, 체크인·체크아웃 시각, 찜 버튼
  3. 편의시설
  4. **날짜·인원 선택 + 객실 목록**
  5. 환불정책: `policyText`와 규칙 표 ("체크인 `daysBefore`일 전까지 `refundRate`% 환불")
  6. 이 숙소의 음악 (7.7)
  7. 리뷰 목록 (7.7)
- 별점 평균은 상세 응답에 없다. 표시하지 않는다.
- 지도는 1차에 넣지 않는다. 좌표는 받지만 주소 텍스트만 보여준다 (지도 SDK는 새 라이브러리).
- 객실 목록
  - 날짜를 고르기 전: 객실 정보(이미지, 기준 인원 `capacity`, 최대 인원 `maxCapacity`, 1박 요금 `nightlyPrice`)만 보여준다.
  - 날짜를 고른 뒤: availability를 조회해 객실별 예약 가능 여부와 `totalPrice`를 보여준다. `totalPrice`는 **기준 인원 기준 합계**이고, 재고가 없는 날이 있으면 필드가 없다. 날짜와 인원은 URL 쿼리에 둔다.
  - `available: false`이거나 `totalPrice`가 없으면 "예약 마감"으로 표시하고 버튼을 끈다. 인원이 `maxCapacity`를 넘는 객실은 선택할 수 없다.
  - 인원이 `capacity`를 넘으면 추가 인원 요금이 붙는다는 안내와 예상 금액(7.5의 미리보기 식)을 함께 보여준다.
  - 날짜 제약: 체크인은 **오늘(KST)부터**, 체크아웃은 체크인 다음 날부터 (Q9).
  - "예약하기" → `/reservations/new?accommodationId&roomId&checkIn&checkOut&guestCount`. 비로그인이면 로그인 후 같은 주소로 돌아온다.
- 공개(LISTED)가 아닌 숙소는 조회되지 않으므로 404 화면을 보여준다.

### 7.5 reservation

| 기능 | API |
|---|---|
| 예약 생성 | `POST /api/reservations` `{roomId, checkIn, checkOut, guestCount, guestName?, guestPhone?}` |
| 내 예약 목록 | `GET /api/reservations/me?page&size` (필터 없음, 최신순) |
| 예약 상세 | `GET /api/reservations/{id}` |
| 취소 | `POST /api/reservations/{id}/cancel` → `refundRate, refundAmount, penaltyAmount` 포함 |

생성 응답과 상세의 필드 (Q4-5):

```
id, reservationNo, accommodationId, accommodationName, roomId, roomName,
checkIn, checkOut, guestCount, guestName, guestPhone, totalPrice,
status, holdExpiresAt, cancelledAt, createdAt,
priceItems[{itemType, name, amount}], refundPolicy
```

- **예약 정보 입력** (`/reservations/new`)
  - 숙소·객실·날짜·인원 요약, 예약자 이름·전화번호, 요금 미리보기, 환불정책을 보여준다.
  - 예약자 이름·전화번호는 비우면 회원 정보가 쓰인다. 입력란에 회원 정보를 미리 채우고 수정할 수 있게 한다.
  - 요금 미리보기: 객실 요금은 availability의 `totalPrice`, 추가 인원 요금은 `(guestCount − capacity) × extraPersonFee × nights`(0 이하면 없음). **확정 금액은 생성 응답의 `priceItems`와 `totalPrice`다.** 생성 후 화면은 서버 값만 쓴다.
  - 제출 성공(PENDING, 재고 선점) → `/reservations/:id/payment`.
  - 주요 오류: 미성년 예약자, 매진, 인원 초과, 날짜 오류. 매진이면 상세로 돌아가 다른 객실·날짜를 고르게 안내한다.
- **상태별 표시와 동작**

| 상태 | 표시 | 가능한 동작 |
|---|---|---|
| PENDING | 결제 대기 + 남은 시간 | 결제하기, 취소 |
| CONFIRMED | 예약 확정 | 취소 |
| CANCELLED | 취소됨 (`cancelledAt`) | 없음 |
| COMPLETED | 이용 완료 | 리뷰 작성 (이미 썼으면 수정·삭제) |

- **선점 만료**: PENDING 예약은 `holdExpiresAt`(생성 후 10분)까지 남은 시간을 카운트다운으로 보여준다. 0이 되면 결제 버튼을 끄고 예약을 다시 조회한다. 서버 스케줄러가 1분 주기라 만료 직후에는 아직 PENDING일 수 있으므로, 시각이 지났으면 상태와 무관하게 만료로 표시한다.
- **예약 상세**: 예약번호(`reservationNo`), 숙소·객실, 날짜, 인원, 예약자, 요금 항목(`priceItems`: `ROOM`, `EXTRA_PERSON`), 합계, 예약 시점의 환불정책(`refundPolicy` 스냅샷)을 보여준다. 현재 숙소의 환불정책이 아니라 스냅샷을 쓴다.
- **취소**
  - 확인 모달에 스냅샷 환불 규칙을 보여주고 확정을 받는다. 환불액을 프론트에서 미리 계산해 보여주지 않는다.
  - 취소 응답의 `refundRate, refundAmount, penaltyAmount`로 결과 화면(환불액·위약금)을 보여준다.
  - **환불 금액은 취소 응답에만 있고 예약 상세에는 없다.** 그래서 취소 직후에만 금액을 보여줄 수 있고, 나중에 상세를 다시 열면 취소 시각만 나온다. 상세에서도 보여주려면 백엔드에 필드 추가를 요청해야 한다 (13.1).
  - 환불 처리 실패 여부도 상세에 없다. 결제 전(PENDING) 취소는 환불이 없으므로 금액 안내를 생략한다.
- **목록**: 상태·기간 필터가 없다(Q11). 페이지네이션만 제공한다.

### 7.6 payment

토스페이먼츠를 쓴다. 백엔드 로컬·테스트 환경은 가짜 PG(`fake`)다 (Q6).

| 단계 | API | 요청 → 응답 |
|---|---|---|
| 준비 | `POST /api/payments/prepare` | `{reservationId}` → `{orderId, amount, orderName, pgProvider}` |
| 승인 | `POST /api/payments/confirm` | `{orderId, paymentKey, amount}` → `{orderId, reservationId, amount, method, status, paidAt}` |

- 흐름
  1. 결제 화면: 예약 상세를 조회해 금액과 남은 선점 시간을 보여준다. PENDING이 아니거나 만료됐으면 예약 상세로 돌려보낸다.
  2. "결제하기" → `prepare`.
  3. `prepare` 응답의 `orderId, amount, orderName`으로 토스 결제창을 연다. 성공·실패 URL은 `/reservations/:id/payment/success`, `/fail`이다.
  4. 토스가 성공 URL로 `paymentKey, orderId, amount`를 쿼리로 붙여 돌려보낸다. 성공 화면이 이 값으로 `confirm`을 호출한다.
  5. `confirm` 성공 → 예약 확정 안내와 예약 상세 링크. 실패 → 사유와 다시 결제 버튼 (선점 시간이 남아 있을 때만).
- PG 연동은 `PaymentGateway` 인터페이스 뒤에 두고 `prepare` 응답의 `pgProvider` 값으로 구현체를 고른다. 토스 구현체와 가짜 구현체를 분리한다. **[확인 필요: `fake`일 때 `confirm`에 보낼 `paymentKey`]**
- 토스 클라이언트 키는 `prepare` 응답에 없다. 환경 변수로 둔다 (10장).
- `confirm`은 성공 화면에서 **한 번만** 호출한다. 새로고침이나 StrictMode 이중 실행으로 두 번 나가지 않게 막는다. 서버가 같은 `orderId`를 한 번만 처리하므로, 이미 처리된 주문이라는 응답을 받으면 오류로 처리하지 않고 예약을 다시 조회해 결과를 보여준다.
- 서버가 `amount`를 예약 금액과 다시 비교한다. 금액 불일치 오류를 받으면 재시도하지 않고 예약 상세로 안내한다.
- 결제는 성공했지만 예약이 이미 만료된 경우 서버가 전액 환불한다. 이 응답을 받으면 "결제 시간이 만료되어 자동으로 환불되었습니다"를 보여주고 숙소 상세로 안내한다.
- 카드 정보는 프론트 코드가 직접 다루지 않는다. `/api/payments/webhook`은 서버 간 통신이라 프론트가 호출하지 않는다.

### 7.7 review

| 기능 | API |
|---|---|
| 숙소 리뷰 목록 | `GET /api/accommodations/{id}/reviews?sort&rating` |
| 숙소 트랙 목록 | `GET /api/accommodations/{id}/tracks` |
| 작성·수정·삭제 | `POST /api/reviews`, `PATCH /api/reviews/{id}`, `DELETE /api/reviews/{id}` |
| 트랙 검색 | `GET /api/spotify/tracks/search?q=` (로그인 필요) |

**[확인 필요: 위 네 API의 요청·응답 필드, 그리고 내 예약에 리뷰가 이미 있는지 아는 방법 — 13.1]**

- 리뷰는 **별점(1~5)과 음악(Spotify 트랙 1곡)만** 있다. 둘 다 필수다. 글, 사진, 호스트 답글 입력란을 만들지 않는다.
- **목록** (숙소 상세 안)
  - 정렬: 최신순 `LATEST`(기본), 별점 높은순 `RATING_DESC`, 별점 낮은순 `RATING_ASC`.
  - 별점 필터: 전체 또는 1~5점.
  - 리뷰 하나 = 별점 + 작성일 + 트랙.
- **트랙 표시**
  - 서버는 트랙 ID만 저장한다. 제목·아티스트·커버·재생은 Spotify 공식 임베드 플레이어(`https://open.spotify.com/embed/track/{trackId}` iframe)가 맡는다. `preview_url`은 쓰지 않는다.
  - **자동 재생하지 않는다.** 사용자가 직접 재생한다 (Spotify 약관).
  - iframe은 화면에 보일 때 로드한다(`loading="lazy"`). "이 숙소의 음악"은 최대 50곡이므로 처음에는 일부만 보여주고 더 보기로 펼친다.
- **작성·수정** (`/reservations/:id/review`)
  - 진입 조건: 본인 예약, 상태 COMPLETED, 예약당 1건. 내 예약의 COMPLETED 건에서만 진입 버튼을 보여준다.
  - 별점 선택 + 트랙 검색. 검색은 입력을 멈춘 뒤 요청하고(debounce), 결과에서 한 곡을 고르면 임베드로 미리 보여준다.
  - 제출 시 별점과 트랙 ID만 보낸다. 수정은 별점·곡 변경, 삭제는 확인 모달 후 실행한다.
- 메인의 음악 배너("머문 순간을, 한 곡으로.")는 문구 그대로 유지한다.

### 7.8 favorite

- `POST /api/favorites/{accommodationId}`, `DELETE /api/favorites/{accommodationId}`, `GET /api/favorites/me?page&size` **[확인 필요: `favorites/me` 항목 필드]**
- 숙소 목록·상세 응답에는 찜 여부가 없다 (Q8). 로그인 사용자는 `GET /api/favorites/me`로 찜한 숙소 ID 집합을 만들어 카드와 상세의 하트 상태에 쓴다.
- `favorites/me`는 페이지 응답이다. ID 집합을 만들 때는 `size=50`으로 `hasNext`가 false가 될 때까지 이어서 받는다. 비로그인 상태에서는 호출하지 않는다.
- 토글은 낙관적 업데이트로 즉시 반영하고 실패하면 되돌린다. 중복 찜·없는 찜 삭제도 서버가 성공으로 응답한다.
- 비로그인 상태에서 하트를 누르면 로그인으로 보낸다.
- 찜 목록 화면은 숙소 카드 그리드를 재사용하고 페이지네이션한다.

## 8. feature별 명세 — 호스트

### 8.1 사업자 등록

- `POST /api/host-businesses`, `GET /api/host/business` **[확인 필요: 요청·응답 필드]**
- 로그인한 회원 누구나 접근한다. 사업자등록번호는 `000-00-00000` 형식으로 입력을 받는다.
- 형식 검증을 통과하면 바로 승인되고 역할이 HOST로 바뀐다. 응답의 새 액세스 토큰으로 교체한 뒤 `/host`로 이동한다.
- 이미 HOST면 등록 폼 대신 사업자 정보를 보여준다.

### 8.2 숙소 관리 (Q4-6, Q10)

| 기능 | API | 요청 |
|---|---|---|
| 내 숙소 목록 | `GET /api/host/accommodations` | |
| 내 숙소 상세 | `GET /api/host/accommodations/{id}` | |
| 등록 | `POST /api/host/accommodations` | `{regionId, categoryId, name, description?, address, latitude?, longitude?, checkInTime, checkOutTime, imageUrls[≤20], amenityIds[]}` |
| 수정 | `PATCH /api/host/accommodations/{id}` | 바꿀 필드만 |
| 공개 상태 | `PATCH /api/host/accommodations/{id}/listing-status` | `{listingStatus: DRAFT \| LISTED \| HIDDEN}` |
| 객실 등록 | `POST /api/host/accommodations/{id}/rooms` | `{name, capacity, maxCapacity, extraPersonFee, nightlyPrice, imageUrls[]}` |
| 객실 수정 | `PATCH /api/host/accommodations/{id}/rooms/{roomId}` | 바꿀 필드만 + `status: ACTIVE \| INACTIVE` |
| 환불정책 | `PUT /api/host/accommodations/{id}/refund-policy` | `{policyText?, rules[{daysBefore, refundRate}]}` |
| 이미지 업로드 | `POST /api/images` | multipart, 필드명 `file` → `{url}` |

- **목록**: 공개 상태와 관계없이 전부 나온다. 항목에 `listingStatus, roomCount, activeRoomCount, hasRefundPolicy, readyToList`가 있다. 공개 상태 배지(작성 중 / 공개 / 숨김)와 객실 수를 보여준다.
- **등록·수정 폼**
  - 지역(`GET /api/regions`), 카테고리(`GET /api/categories`, 필수), 이름, 주소, 소개, 체크인·체크아웃 시각, 편의시설(`GET /api/amenities` 다중 선택), 이미지(최대 20장).
  - 좌표(`latitude`, `longitude`)는 선택이다. 1차에는 입력란을 두지 않는다.
  - 이 폼은 공개 상태를 바꾸지 않는다.
  - **수정은 부분 수정이다.** 보내지 않은 필드는 그대로 남는다. 단 `imageUrls`와 `amenityIds`는 보내면 **통째로 교체**되므로, 수정할 때는 항상 전체 배열을 보낸다 (하나만 추가하려고 그 하나만 보내면 나머지가 지워진다).
- **이미지 업로드** (Q7)
  - 형식: JPEG·PNG·GIF·WebP. 서버는 확장자가 아니라 파일 내용으로 판별한다. 최대 5MB (초과 시 `STORAGE-003`).
  - 업로드 전에 형식과 크기를 클라이언트에서도 검사한다. 업로드 중 표시와 실패 시 재시도를 제공한다.
  - 응답 `url`은 절대 URL이다. 그대로 `imageUrls`에 넣고 `<img src>`에 쓴다.
- **객실**: 이름, 기준 인원, 최대 인원(기준 인원 이상), 1박 요금, 추가 인원 요금, 이미지. 판매 상태는 수정에서만 바꾼다. 호스트 상세에는 판매 중지 객실도 나온다.
- **환불정책**: "체크인 N일 전까지 M% 환불" 규칙을 행으로 추가·삭제하는 편집기. 화면은 %로 입력받고 `refundRate`는 0~1로 변환해 보낸다. 저장하면 새 버전이 만들어지고 기존 예약은 예전 버전을 따른다는 안내 문구를 넣는다.
- **공개 상태 변경**
  - `readyToList`가 false면 공개 버튼을 끄고 부족한 항목을 체크리스트로 보여준다: 판매 중 객실(`activeRoomCount > 0`), 환불정책(`hasRefundPolicy`).
  - LISTED 숙소의 마지막 ACTIVE 객실은 판매 중지할 수 없다. 서버 오류를 받으면 "숙소를 먼저 숨김으로 바꿔 주세요"로 안내한다.
- 본인 소유가 아닌 리소스에 접근하면 서버가 거부한다. "권한 없음" 화면을 보여준다.

### 8.3 재고 달력 (Q4-6)

- 조회: `GET /api/host/rooms/{roomId}/inventories?startDate&endDate` → `[{stayDate, totalCount, bookedCount, heldCount, price, closed}]`
- 설정: `PUT /api/host/rooms/{roomId}/inventories` `{startDate, endDate, totalCount?, price?, closed?}`
- 월 단위 달력. 날짜 칸마다 총 수량, 예약 수, 선점 수, 가격, 마감 여부를 보여준다. 한 번에 한 달씩 조회한다 (범위는 양 끝 포함 최대 366일).
- 설정은 **기간 전체에 같은 값**이 들어간다. 날짜마다 다른 값을 넣으려면 기간을 나눠 여러 번 저장한다. 달력에서 시작일~종료일을 선택하고, 바꿀 항목(수량·가격·마감)만 입력해 보낸다.
- 재고 행은 서버가 매일 오늘부터 90일(기본) 뒤까지 자동으로 만든다. 응답에 없는 날짜는 "미설정"으로 표시한다.
- 총 수량을 이미 예약·선점된 수(`bookedCount + heldCount`)보다 작게 넣으려 하면 제출 전에 경고한다. 최종 판단은 서버가 한다.

### 8.4 호스트 예약 목록

- `GET /api/host/reservations?page&size` — 필터 없음, 최신순 (Q11) **[확인 필요: 항목 필드]**
- 내 숙소에 들어온 예약을 상태, 숙소, 날짜와 함께 목록으로 보여준다. 조회 전용이다.

## 9. 오류 처리

| 상황 | 처리 |
|---|---|
| 401 | 재발급 후 한 번 재시도, 실패 시 로그인으로 |
| 403 | "권한 없음" 화면. 호스트 경로에서 GUEST면 사업자 등록 안내 |
| 404 | 404 화면 |
| `COMMON-001` (입력 검증) | `data`의 `{필드명: 메시지}`를 해당 필드 아래에 표시 |
| 업무 규칙 오류 (매진, 미성년, 선점 만료, 중복 리뷰 등) | 에러 코드별 안내 문구와 다음 행동 버튼 |
| `STORAGE-003` | "5MB 이하의 이미지만 올릴 수 있습니다" |
| 네트워크 오류 · 5xx | "잠시 후 다시 시도해 주세요" + 다시 시도 버튼 |

- 에러 코드 → 문구 매핑은 feature별 파일(`features/*/errorMessages.ts`)에 둔다.
- 매핑에 없는 코드는 서버 `message`를 그대로 보여주고, 그것도 없으면 일반 문구를 쓴다.
- 렌더링 오류는 라우트의 `errorElement`로 받는다.

## 10. 환경 변수

| 이름 | 용도 |
|---|---|
| `VITE_API_BASE_URL` | 백엔드 주소 (기존). 비우면 같은 origin |
| `VITE_TOSS_CLIENT_KEY` | 토스페이먼츠 클라이언트 키 (공개 키) |

- `VITE_` 변수는 번들에 그대로 들어간다. 토스 시크릿 키, 소셜 로그인 시크릿, Spotify 시크릿은 프론트에 두지 않는다.
- 새 변수는 `.env.example`에 설명과 함께 추가한다.
- 쿠키를 쓰지 않으므로 다른 origin의 백엔드를 직접 호출해도 된다. 이 경우 백엔드 CORS에 프론트 주소(`http://localhost:3000`)와 `Authorization` 헤더가 허용돼 있어야 한다. 그렇지 않으면 Vite dev server의 `/api` 프록시를 쓴다.
- 이미지 URL은 백엔드가 절대 URL로 준다(로컬 기본 `http://localhost:8080/...`).

## 11. 하지 말 것

- 백엔드 1차 범위에 없는 기능의 화면을 만들지 않는다: 쿠폰·할인, 대실, 객실 옵션, 문의 작성, 알림, 정산, 기기 관리, 최근 본 숙소, 관리자 화면. (장바구니와 고객센터는 준비 중 화면만 둔다.)
- 금액, 환불액, 예약 가능 여부를 프론트에서 확정하지 않는다. 미리보기 외에는 서버 값만 표시한다.
- 숙소명·날짜 검색을 프론트 필터로 흉내 내지 않는다. 백엔드 조건이 생긴 뒤 연결한다.
- Spotify 트랙 메타데이터를 프론트에서 저장하지 않는다. 표시는 임베드가 맡고 자동 재생하지 않는다.
- 액세스 토큰을 `localStorage`·`sessionStorage`에 저장하지 않는다. (리프레시 토큰만 4.3의 방식으로 둔다.)
- 전역 상태 라이브러리를 도입하지 않는다. 서버 상태는 TanStack Query, 검색 조건은 URL, 나머지는 컴포넌트 상태로 둔다.
- 기존 시안의 디자인과 문구를 임의로 바꾸지 않는다.

## 12. 구현 단계

| 단계 | 내용 |
|---|---|
| 1 | common: http 수정(ApiResponse, 토큰, 재발급, multipart), 세션, 가드, 공통 컴포넌트, 404·오류·준비 중 화면 |
| 2 | auth, terms, user + Header 로그인 상태 반영, staticPage(회사 소개, 장바구니, 고객센터) |
| 3 | accommodation 목록·상세, 메인 화면 연결(검색, 카테고리, 지역, 숙소 카드), favorite |
| 4 | availability 조회와 객실 선택 |
| 5 | reservation, payment (백엔드 `fake` PG로 먼저 완성 → 토스 연결) |
| 6 | review, Spotify 검색·임베드 |
| 7 | host: 사업자 등록, 숙소·객실·환불정책, 재고 달력, 예약 목록 |
| 8 | 전체 시나리오 점검, 반응형·접근성 점검 |

- 3단계의 숙소명·날짜 검색은 백엔드 파라미터가 추가된 뒤 연결한다. 그 전에는 지역·카테고리·인원 조건으로 먼저 완성하고, 검색 바의 숙소명·날짜 값은 URL에만 유지한다.
- **[확인 필요]** 가 붙은 API는 해당 단계를 시작하기 전에 답을 받는다.

## 13. 남은 확인·결정 사항

### 13.1 백엔드에 확인·요청할 것

**추가 요청 (1차에 구현하기로 한 기능에 필요)**

| 번호 | 내용 |
|---|---|
| R1 | `GET /api/accommodations`에 숙소명 검색 조건 추가 (제안: `keyword`) |
| R2 | `GET /api/accommodations`에 날짜 조건 추가 (제안: `checkIn`, `checkOut` — 그 기간에 예약 가능한 객실이 있는 숙소만). 메인의 "이번 주말"도 이 조건을 쓴다 |
| R3 | 예약 상세에 환불 정보(환불액, 위약금, 환불 상태) 노출. 없으면 취소 직후에만 금액을 보여줄 수 있다 |

**필드 확인 (확인 요청 문서에 없는 API)**

| 번호 | 내용 |
|---|---|
| C1 | `POST /api/auth/login` 요청 필드, `password/forgot`·`password/reset` 요청 필드, `social/{provider}/link` 요청 필드 |
| C2 | `GET /api/users/me` 응답 필드(역할, 가입 완료 여부, 연결된 소셜 계정 포함 여부)와 `PATCH`로 수정 가능한 필드 |
| C3 | `GET /api/terms` 항목 필드 (`id, type, version, content, required` 예상) |
| C4 | `GET /api/regions` 응답 형태(트리인지 평면 목록인지)와, 상위 지역 `regionId`로 검색하면 하위 지역 숙소가 포함되는지 |
| C5 | 리뷰: 목록·작성·수정의 요청·응답 필드, `tracks` 응답 필드, Spotify 검색 응답 필드, 페이지 여부 |
| C6 | 내 예약 목록의 항목 필드와, COMPLETED 예약에 리뷰가 이미 있는지(리뷰 ID) 아는 방법 |
| C7 | `GET /api/favorites/me`, `GET /api/host/reservations`의 항목 필드 |
| C8 | `POST /api/host-businesses`의 요청 필드와 응답(새 액세스 토큰 필드명), `GET /api/host/business` 응답 |
| C9 | `pgProvider`가 `fake`일 때 프론트가 `confirm`에 보낼 `paymentKey` 값 |
| C10 | 프론트가 분기해야 하는 에러 코드 값: 로그인 잠금, 인증코드 무효, 소셜 이메일 중복, 미성년 예약, 매진, 선점 만료, 금액 불일치, 만료 후 자동 환불, 이미 처리된 주문, 중복 리뷰, 마지막 객실 판매 중지 |
| C11 | 소셜 콜백 주소: 운영·개발 환경의 프론트 콜백 URL 등록 방식 (기본값은 `localhost:3000`) |

### 13.2 기획 협의 대기

| 번호 | 항목 | 협의 전 임시 처리 |
|---|---|---|
| D1 | 검색 바 "객실 수" | "객실 1개" 고정 표시, 인원만 선택 |
| D2 | "지금 예약 가능한 숙소" 섹션의 기준 | 목록 API의 앞 4개 |
| D3 | 고객 지원 "취소 기한 확인"의 연결 대상 | 동작 없음 |
| D4 | 카테고리 불일치: 시안의 "감성 스테이"는 백엔드 카테고리에 없고, 백엔드의 펜션·모텔·캠핑·글램핑·기타는 시안에 이미지가 없다 | 시안 순서를 유지하고 이름이 일치하는 카테고리만 연결. "감성 스테이"는 동작 없음. 헤더 "전체 카테고리" 드롭다운에는 백엔드 8개를 모두 표시 |
| D5 | 큐레이션 섹션: 카드가 하나만 남는다 | 독채 카드만 표시 |

### 13.3 프론트 내부 결정이 필요한 것

- **토스페이먼츠 SDK 도입 방식**: npm 패키지 설치 또는 스크립트 태그 로드. 새 의존성이므로 5단계 전에 정한다.

## 14. 시안 요소 결정 내역

| 시안 요소 | 결정 |
|---|---|
| 서비스명 | PREEN |
| Header "장바구니" | 2차 구현. 1차는 준비 중 화면 (`/cart`) |
| Header "최근 본 숙소" | 1차에서 제거 |
| 검색 바 숙소명 검색 | 1차 구현 (백엔드 조건 추가 필요 — R1) |
| 검색 바 날짜 필터 | 1차 구현 (백엔드 조건 추가 필요 — R2) |
| 검색 바 "객실 1개" | 협의 후 진행 (D1) |
| 카테고리 "이번 주말" | 날짜 필터로 구현 |
| "지금 예약 가능한 숙소" | 협의 후 진행 (D2) |
| 지역 섹션 | 프론트 정적 매핑 |
| 큐레이션 "바다가 보이는 객실" | 1차에서 제거 |
| 고객 지원 "취소 기한 확인" | 협의 후 진행 (D3) |
| 고객센터 문의 | 준비 중 화면 (`/support`) |
| Footer "회사 소개" | 프론트 정적 페이지 (`/about`) |

## 15. 완료 기준

- `npm run typecheck`, `npm run build`, `npm run format:check`가 통과한다.
- 3장의 의존 방향을 어기는 import가 없고, feature 간 import는 `public.ts`만 거친다.
- 정적 예시 데이터(`data/accommodations.ts`)와 메모리 찜 상태가 남아 있지 않다.
- 다음 시나리오가 화면에서 끝까지 동작한다.
  1. 이메일 인증 → 가입 → 로그인 → 사업자 등록 → 숙소·객실 등록 → 환불정책 설정 → 재고 설정 → 공개
  2. 다른 회원이 메인에서 검색 → 목록 → 상세 → 날짜 선택 → 예약 → 결제 → 예약 확정 확인
  3. 예약 취소 → 환불액·위약금 표시 → 예약 목록에 취소 상태 반영
  4. 결제하지 않고 선점 시간이 지나면 결제 버튼이 꺼지고 예약이 취소로 바뀜
  5. 매진된 객실은 예약 버튼이 꺼지고, 동시에 예약해 진 쪽은 매진 안내를 받음
  6. 이용 완료 예약에서 별점과 곡을 골라 리뷰 작성 → 숙소 상세의 리뷰·음악 목록에 표시 → 같은 예약으로 다시 작성할 수 없음
  7. 미성년 회원의 예약 시도, GUEST의 `/host/**` 접근이 안내 화면으로 처리됨
  8. 카카오·네이버 로그인 → 최초 로그인 시 생년월일·약관 입력 후 가입 완료
  9. 새로고침 후에도 로그인 상태와 검색 조건이 유지되고, 액세스 토큰이 만료돼도 사용자가 눈치채지 못하게 재발급됨. 두 탭을 열어 두어도 로그아웃되지 않음
- 주요 화면이 기존 시안의 반응형 기준(모바일·데스크톱)에서 깨지지 않는다.
