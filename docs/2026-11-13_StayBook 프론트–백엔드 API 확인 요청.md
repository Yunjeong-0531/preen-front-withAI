# StayBook 프론트–백엔드 API 확인 요청

- **작성일자**: 2026-11-13
- **작성자**: @yunjeong
- **대상 프로젝트**: `preen-front-withAI`

## 개요

프론트 연동 전에 백엔드에서 확정해 줘야 할 12개 항목이다. 각 표의 **답변** 칸에 직접 적거나, 해당 셀에 댓글로 남겨 주면 된다.

- 번호(Q1\~Q12)는 원래 요청 순서를 따른다.
- **현재 프론트 가정** 칸은 답이 없을 때 프론트가 임시로 쓰는 방식이다. 다르면 답변 칸에 바로잡아 주면 된다.

답변은 백엔드 `feature/review-music-ci` 브랜치 코드를 읽고 채웠다. 코드와 다르게 바꿀 계획이 있으면 답변 칸을 고쳐 주면 된다.

## 공통 규격

모든 API에 공통으로 적용되는 형식이다. 이 두 항목이 정해져야 프론트 타입 정의를 고정할 수 있다.

| 번호 | 항목 | 확인할 내용 | 현재 프론트 가정 | 답변 |
| --- | --- | --- | --- | --- |
| Q1 | 응답 규격 | `ApiResponse<T>`의 필드 / 페이지 응답의 필드, `page` 시작값(0 또는 1), 기본 크기 / 오류 응답의 필드와 에러 코드 목록 | 미정 | **ApiResponse**: `success`(boolean), `code`(성공 시 `"OK"`), `message`(실패 시), `data`. 값이 null인 필드는 응답에서 빠진다. **페이지**: `data`가 `{content, page, size, totalElements, totalPages, hasNext}`. `page`는 **0부터**, 기본 `size` 20, 최대 50. **오류**: 같은 ApiResponse에 `success:false`, `code`, `message`. 입력 검증 실패(`COMMON-001`)만 `data`에 `{필드명: 메시지}`가 온다. **에러 코드**: `영역-번호` 형식. 영역은 COMMON, AUTH, USER, TERMS, HOST, ACCOMMODATION, INVENTORY, RESERVATION, PAYMENT, REVIEW, FAVORITE, STORAGE. 전체 목록은 각 `*ErrorCode.java`에 있다. |
| Q5 | 금액 형식 | JSON에서 금액이 숫자인지 문자열인지 | 미정 | **숫자**(JSON number). 서버는 BigDecimal이라 `120000.00`처럼 소수점이 붙어 올 수 있다. 환불 비율(`refundRate`)도 0\~1 사이 숫자다. |

## 인증

토큰 전달 방식에 따라 `http.ts`의 요청 설정과 소셜 로그인 콜백 처리가 달라진다.

| 번호 | 항목 | 확인할 내용 | 현재 프론트 가정 | 답변 |
| --- | --- | --- | --- | --- |
| Q2 | 토큰 전달 | 액세스 토큰: 응답 본문 + `Authorization` 헤더인지 / 리프레시 토큰: HttpOnly 쿠키인지 본문인지 | `http.ts`가 `credentials: 'include'`로 쿠키를 보냄 | **둘 다 응답 본문**이다. 로그인 응답 `{accessToken, refreshToken, accessTokenExpiresIn(초), signupCompleted}`. 이후 요청은 `Authorization: Bearer <accessToken>` 헤더로 보낸다. 갱신은 `POST /api/auth/refresh`, 로그아웃은 `POST /api/auth/logout`이며 둘 다 본문 `{refreshToken}`. 쿠키는 쓰지 않으므로 `http.ts`의 쿠키 가정은 고쳐야 한다. |
| Q3 | 소셜 로그인 | 지원 제공자 / 시작·콜백 경로 / 로그인 완료 후 프론트로 토큰을 넘기는 방법 / 가입 미완료 상태 판별 방법 / 가입 완료 엔드포인트 | 미정 | **제공자**: `kakao`, `naver`. **흐름**: 1) `GET /api/auth/social/{provider}` → `{authorizationUrl}`로 이동. 2) 제공자가 프론트 콜백(기본 `http://localhost:3000/oauth/{provider}/callback`)으로 `code`, `state`를 넘긴다. 3) 프론트가 `POST /api/auth/social/{provider}` 본문 `{code, state}` → 일반 로그인과 같은 토큰 응답. 백엔드가 리다이렉트로 토큰을 넘기지는 않는다. **가입 미완료**: 토큰 응답의 `signupCompleted:false`. **가입 완료**: `POST /api/auth/signup/complete` 본문 `{birthDate, agreedTermIds}`, Authorization 헤더 필요. 기존 회원의 계정 연결은 `POST /api/auth/social/{provider}/link`. |

## API별 필드와 조건

화면별 요청·응답 필드와 경로 규칙이다. Q4는 API가 많아 행을 나눠 적었다.

| 번호 | 대상 | 확인할 내용 | 현재 프론트 가정 | 답변 |
| --- | --- | --- | --- | --- |
| Q4-1 | 가입 | 요청·응답 필드 | 미정 | `POST /api/auth/signup` 본문 `{email, password, name, phone?, birthDate, agreedTermIds}` → `{userId}`. 비밀번호는 영문과 숫자를 포함한 8\~64자, 이름 50자 이하, 만 14세 이상. 가입 전에 이메일 인증이 필요하다: `POST /api/auth/email/resend` `{email}` → `POST /api/auth/email/verify` `{email, code(숫자 6자리)}`. 중복 확인 `GET /api/auth/check-email?email=` → `{available}`, 약관 목록 `GET /api/terms`. |
| Q4-2 | 숙소 목록 카드 | 대표 이미지, 최저가, 평균 별점 포함 여부 | 미정 | `GET /api/accommodations?regionId&categoryId&guestCount&page&size`. 항목: `id, name, address, regionId, regionName, categoryId, categoryName, thumbnailUrl, minNightlyPrice`. 대표 이미지(`thumbnailUrl`)와 최저가(`minNightlyPrice`, 판매 중 객실이 없으면 null)는 있고, **평균 별점은 없다**. |
| Q4-3 | 숙소 상세 | 요청·응답 필드 | 미정 | `GET /api/accommodations/{id}` → `id, name, description, address, regionId, regionName, categoryId, categoryName, latitude, longitude, checkInTime, checkOutTime, listingStatus, imageUrls[], amenities[{id,name}], rooms[{id, name, capacity, maxCapacity, extraPersonFee, nightlyPrice, status, imageUrls}], refundPolicy{id, version, policyText, rules[{daysBefore, refundRate}]}`. 별점·리뷰는 없고 `GET /api/accommodations/{id}/reviews`로 따로 받는다. |
| Q4-4 | availability | 요청·응답 필드 | 미정 | `GET /api/accommodations/{id}/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD` → 객실별 `{roomId, roomName, capacity, maxCapacity, extraPersonFee, nights, available, totalPrice}`. `totalPrice`는 기준 인원 기준 합계이고, 재고 없는 날이 있으면 null. |
| Q4-5 | 예약 생성·상세 | 환불정책 스냅샷과 환불 정보 노출 여부 | 미정 | **생성**: `POST /api/reservations` `{roomId, checkIn, checkOut, guestCount, guestName?, guestPhone?}`. 이름·전화를 빼면 회원 정보를 쓴다. **응답·상세**(`GET /api/reservations/{id}`): `id, reservationNo, accommodationId, accommodationName, roomId, roomName, checkIn, checkOut, guestCount, guestName, guestPhone, totalPrice, status, holdExpiresAt, cancelledAt, createdAt, priceItems[{itemType, name, amount}], refundPolicy`. `status`는 PENDING·CONFIRMED·CANCELLED·COMPLETED, PENDING은 `holdExpiresAt`(생성 후 10분)까지 결제해야 한다. **환불정책 스냅샷**은 `refundPolicy`(예약 시점 JSON)로 노출된다. **환불 금액**은 상세에 없고, 취소 `POST /api/reservations/{id}/cancel` 응답에만 `refundRate, refundAmount, penaltyAmount`가 있다. |
| Q4-6 | 호스트 설정 | 숙소·객실·환불정책·재고 설정의 요청·응답 필드 | 미정 | 사업자 등록(`POST /api/host-businesses`)이 먼저다. **숙소**: `POST /api/host/accommodations` `{regionId, categoryId, name, description?, address, latitude?, longitude?, checkInTime, checkOutTime, imageUrls[≤20], amenityIds[]}`. 목록 `GET`은 `listingStatus, roomCount, activeRoomCount, hasRefundPolicy, readyToList` 포함. 공개 상태는 `PATCH /{id}/listing-status` `{listingStatus: DRAFT\|LISTED\|HIDDEN}`. LISTED는 판매 중 객실과 환불정책이 있어야 한다. **객실**: `POST /{id}/rooms` `{name, capacity, maxCapacity, extraPersonFee, nightlyPrice, imageUrls[]}`. **환불정책**: `PUT /{id}/refund-policy` `{policyText?, rules[{daysBefore, refundRate(0~1)}]}`. **재고**: `GET /api/host/rooms/{roomId}/inventories?startDate&endDate` → `[{stayDate, totalCount, bookedCount, heldCount, price, closed}]`. 설정은 `PUT` 같은 경로에 `{startDate, endDate, totalCount?, price?, closed?}`이고, 기간 전체에 같은 값이 들어간다. |
| Q8 | 찜 여부 | 숙소 목록·상세 응답에 로그인 사용자의 찜 여부가 들어오는지 | 없으면 `GET /api/favorites/me`로 판단(현재 명세 방식) | **들어오지 않는다.** 현재 방식대로 `GET /api/favorites/me`를 쓴다. 단, 이 API도 페이지 응답(기본 20개)이라 찜이 많으면 페이지를 더 받아야 한다. 찜은 `POST`/`DELETE /api/favorites/{accommodationId}`. |
| Q9 | 체크인 날짜 | "오늘 이후"에 당일이 포함되는지 | 미정 | **포함된다.** 오늘보다 이전 날짜만 거부하므로 당일 체크인을 예약할 수 있다. 체크아웃은 체크인 다음 날 이후여야 한다. 기준은 서버 시간대(Asia/Seoul)다. |
| Q10 | 호스트 숙소·객실 수정 | `PATCH /api/host/accommodations`의 수정 대상 ID를 경로로 받는지 본문으로 받는지. 객실 수정도 같은 질문 | 미정 | **경로**로 받는다. 숙소 `PATCH /api/host/accommodations/{id}`, 객실 `PATCH /api/host/accommodations/{id}/rooms/{roomId}`. 보내지 않은 필드는 그대로 두고, `imageUrls`·`amenityIds`는 보내면 통째로 바뀐다. 객실 수정에는 `status`(ACTIVE\|INACTIVE)도 있다. |
| Q11 | 예약 목록 | 호스트 예약 목록·내 예약 목록의 필터(상태, 숙소, 기간)와 페이지 조건 | 미정 | **필터는 없다.** `GET /api/reservations/me`, `GET /api/host/reservations` 모두 `page`(0부터), `size`(기본 20, 최대 50)만 받고 최신순이다. 상태·숙소·기간 필터가 필요하면 백엔드에 추가를 요청해야 한다. |

## 결제·업로드·기타

외부 연동과 참고 문서에 관한 항목이다. Q12는 다른 항목의 필드 타입을 맞추는 데 필요하다.

| 번호 | 항목 | 확인할 내용 | 현재 프론트 가정 | 답변 |
| --- | --- | --- | --- | --- |
| Q6 | PG | 사용할 PG사 / 결제창 호출에 필요한 값 / `confirm` 요청 필드 | 미정 | **토스페이먼츠**(로컬·테스트는 `PG_PROVIDER=fake`). 1) `POST /api/payments/prepare` `{reservationId}` → `{orderId, amount, orderName, pgProvider}`. 2) 이 값으로 토스 결제창을 띄운다. 클라이언트 키는 응답에 없으므로 프론트 환경 변수로 둔다. 3) `POST /api/payments/confirm` `{orderId, paymentKey, amount}` → `{orderId, reservationId, amount, method, status, paidAt}`. 서버가 `amount`를 예약 금액과 다시 비교한다. |
| Q7 | 이미지 업로드 | 허용 형식 / 최대 크기 / 요청 필드명 / 반환 URL이 절대 경로인지 | 미정 | `POST /api/images`, `multipart/form-data`, 필드명 **`file`**, 로그인 필요. 형식은 **JPEG·PNG·GIF·WebP**이고 확장자가 아니라 파일 내용으로 판별한다. 최대 **5MB**(초과 시 `STORAGE-003`). 응답 `{url}`은 **절대 URL**이다(기본 `http://localhost:8080/...`, 서버의 `STORAGE_BASE_URL`로 바뀜). 이 URL을 숙소·객실의 `imageUrls`에 넣는다. |
| Q12 | ERD 문서 | 백엔드 문서가 참조하는 `docs/StayBook_ERD_1차구현_Mermaid.md`가 저장소에 없음. 공유 요청 | 없음 | 백엔드 저장소에는 `docs/StayBook_ERD_1차구현.md`(이름에 `_Mermaid` 없음)가 있다. 문서의 참조 경로가 틀린 것으로 보인다. 실제 테이블 정의는 `src/main/resources/db/migration/V1~V7`에 있다. |
