# Preen Frontend 커스텀 훅 및 컴포넌트 분석 보고서

본 문서는 `preen-front-withAI` 프로젝트의 모든 커스텀 훅(Custom Hooks), 페이지(Pages), 컴포넌트(Components) 구조와 상호 의존 관계를 체계적으로 정리한 분석서입니다.

---

# 섹션 1. 프론트엔드 커스텀 훅(Custom Hook) 전체 정리

`preen-front-withAI` 프로젝트에서는 공통 모듈 및 각 비즈니스 피처(`features`)별로 총 **24개의 커스텀 훅**이 구현되어 있습니다. React Context API 및 TanStack React Query(`@tanstack/react-query`)를 기반으로 서버 상태와 클라이언트 상태를 효율적으로 관리합니다.

---

## 1. 인증 및 전역 UI 훅 (`common`)

### 1.1 `useSession`
- **파일 위치**: `src/common/auth/session.tsx`
- **시그니처**: `useSession(): SessionValue`
- **반환값**:
  - `status`: `'loading' | 'anonymous' | 'authenticated'`
  - `user`: 현재 로그인 사용자 정보(`SessionUser | null`)
  - `isAuthenticated`: 로그인 여부 불리언
  - `signupCompleted`: 회원가입 절차(추가정보 입력) 완료 여부
  - `isHost`: 호스트 권한 여부 (`role === 'HOST'`)
  - `signIn({ accessToken, refreshToken })`: 토큰 저장 후 세션 시작 및 사용자 정보 로드
  - `replaceAccessToken(accessToken)`: 토큰 교체 및 사용자 정보 재동기화
  - `reloadUser()`: `/api/users/me` 호출을 통한 사용자 정보 최신화
  - `signOut()`: 서버 로그아웃 호출 및 세션/캐시 비우기
  - `clearSession()`: 로컬 토큰 및 쿼리 캐시 초기화
- **설명**: 전역 세션 컨텍스트(`SessionContext`)를 구독하여 로그인 상태, 사용자 권한, 토큰 라이프사이클을 관리합니다. 스토리지 이벤트 감지를 통해 다중 탭 로그아웃 동기화도 지원합니다.

### 1.2 `useToast`
- **파일 위치**: `src/common/components/Toast.tsx`
- **시그니처**: `useToast(): { show: (message: string, type?: ToastType, duration?: number) => void }`
- **반환값**:
  - `show(message, type, duration)`: 전역 토스트 팝업 알림 메시지를 화면에 출력하는 함수 (`type`: `'info' | 'success' | 'error'`, 기본 지속시간 3000ms)
- **설명**: `ToastProvider` 내부의 컨텍스트를 사용하여 화면 상단/하단에 토스트 알림을 띄웁니다.

---

## 2. 숙소 및 검색 훅 (`features/accommodation`)

### 2.1 `useRegions`
- **파일 위치**: `src/features/accommodation/hooks/useAccommodationQueries.ts`
- **시그니처**: `useRegions(): UseQueryResult<Region[]>`
- **Query Key**: `['accommodation', 'regions']`
- **설명**: 서비스에서 제공하는 지역 목록을 서버에서 조회합니다. 캐시 시간(`staleTime`)이 5분으로 설정되어 있습니다.

### 2.2 `useCategories`
- **파일 위치**: `src/features/accommodation/hooks/useAccommodationQueries.ts`
- **시그니처**: `useCategories(): UseQueryResult<Category[]>`
- **Query Key**: `['accommodation', 'categories']`
- **설명**: 숙소 카테고리(호텔, 펜션, 게스트하우스 등) 목록을 조회합니다. `staleTime: 5분`.

### 2.3 `useAmenities`
- **파일 위치**: `src/features/accommodation/hooks/useAccommodationQueries.ts`
- **시그니처**: `useAmenities(): UseQueryResult<Amenity[]>`
- **Query Key**: `['accommodation', 'amenities']`
- **설명**: 숙소 부대시설/편의시설 옵션 목록을 조회합니다. `staleTime: 5분`.

### 2.4 `useAccommodations`
- **파일 위치**: `src/features/accommodation/hooks/useAccommodationQueries.ts`
- **시그니처**: `useAccommodations(request: SearchRequest): UseQueryResult<PageResponse<AccommodationCardItem>>`
- **Query Key**: `['accommodation', 'list', request]`
- **설명**: 검색 필터 조건(지역 ID, 카테고리 ID, 인원수, 가격대, 편의시설 목록, 체크인/아웃 일자, 정렬, 페이지)에 맞춰 숙소 목록을 페이징 조회합니다. 페이지 전환 시 화면 깜빡임을 방지하기 위해 `placeholderData: keepPreviousData`가 적용되어 있습니다.

### 2.5 `useAccommodationDetail`
- **파일 위치**: `src/features/accommodation/hooks/useAccommodationQueries.ts`
- **시그니처**: `useAccommodationDetail(id: number | undefined): UseQueryResult<AccommodationDetail>`
- **Query Key**: `['accommodation', 'detail', id]`
- **설명**: 특정 숙소의 상세 정보(객실 목록, 편의시설, 환불 정책, 소개글 등)를 조회합니다. `id`가 유효할 때만 쿼리가 실행됩니다(`enabled: id !== undefined`).

### 2.6 `useSearchConditions`
- **파일 위치**: `src/features/accommodation/hooks/useSearchConditions.ts`
- **시그니처**: `useSearchConditions(): { conditions: SearchConditions; setConditions: (next, replace?) => void; resetConditions: () => void }`
- **설명**: URL의 쿼리 파라미터(`useSearchParams`)와 React 상태를 양방향 동기화하여, 새로고침이나 URL 공유 시에도 검색 필터(지역, 카테고리, 일정, 가격, 정렬 등)가 완벽히 보존되도록 돕는 커스텀 훅입니다.

### 2.7 `useFavoriteBinding`
- **파일 위치**: `src/features/accommodation/favoriteBinding.tsx`
- **시그니처**: `useFavoriteBinding(): FavoriteBinding`
- **반환값**: `{ isFavorite: (id: number) => boolean, toggle: (id: number) => void }`
- **설명**: 숙소 카드 그리드 등에서 현재 렌더링된 숙소가 로그인한 유저의 찜 목록에 있는지 여부를 O(1)로 확인하고, 하트 버튼 클릭 시 찜 등록/해제를 처리하도록 상위 Provider와 바인딩해주는 훅입니다.

---

## 3. 찜(Favorite) 훅 (`features/favorite`)

### 3.1 `useFavoriteIds`
- **파일 위치**: `src/features/favorite/hooks/useFavorites.ts`
- **시그니처**: `useFavoriteIds(): { favoriteIds: Set<number>; isLoading: boolean }`
- **Query Key**: `['favorites', 'ids']`
- **설명**: 로그인 상태일 때 사용자가 찜한 모든 숙소 ID 배열을 가져와 빠른 조회를 위해 `Set<number>`로 변환하여 제공합니다. 비로그인 시 빈 Set을 반환합니다.

### 3.2 `useFavoritePage`
- **파일 위치**: `src/features/favorite/hooks/useFavorites.ts`
- **시그니처**: `useFavoritePage(page: number): UseQueryResult<PageResponse<AccommodationCardItem>>`
- **Query Key**: `['favorites', 'page', page]`
- **설명**: 찜 목록 페이지에서 사용자가 찜한 숙소들을 페이징으로 조회합니다. `keepPreviousData`가 적용되어 있습니다.

### 3.3 `useToggleFavorite`
- **파일 위치**: `src/features/favorite/hooks/useFavorites.ts`
- **시그니처**: `useToggleFavorite(): (accommodationId: number) => void`
- **Mutation Key**: `['favorites', 'toggle']`
- **설명**: 숙소의 찜 상태를 토글하는 뮤테이션 함수를 반환합니다. 실행 시 `['favorites']` 캐시를 무효화하고 적절한 성공/안내 토스트 메시지를 표시합니다.

---

## 4. 호스트(Host) 훅 (`features/host`)

### 4.1 `useMyBusiness`
- **파일 위치**: `src/features/host/hooks/useHostQueries.ts`
- **시그니처**: `useMyBusiness(enabled = true): UseQueryResult<BusinessInfo | null>`
- **Query Key**: `['host', 'business', 'me']`
- **설명**: 현재 로그인한 사용자의 호스트 사업자 등록 신청 정보 및 승인 상태를 조회합니다.

### 4.2 `useHostAccommodations`
- **파일 위치**: `src/features/host/hooks/useHostQueries.ts`
- **시그니처**: `useHostAccommodations(): UseQueryResult<HostAccommodationItem[]>`
- **Query Key**: `['host', 'accommodations']`
- **설명**: 호스트가 직접 등록하고 운영 중인 숙소 목록 전체를 조회합니다.

### 4.3 `useHostAccommodation`
- **파일 위치**: `src/features/host/hooks/useHostQueries.ts`
- **시그니처**: `useHostAccommodation(id: number | undefined): UseQueryResult<HostAccommodationDetail>`
- **Query Key**: `['host', 'accommodations', id]`
- **설명**: 호스트가 관리하는 특정 숙소의 세부 설정(기본정보, 객실 목록, 환불 규정 등)을 조회합니다.

### 4.4 `useInvalidateHost`
- **파일 위치**: `src/features/host/hooks/useHostQueries.ts`
- **시그니처**: `useInvalidateHost(): () => void`
- **설명**: 숙소 등록/수정/삭제 등 호스트 관련 데이터가 변경되었을 때, `['host']` 키로 시작하는 모든 캐시를 일괄 무효화하여 최신 상태로 갱신하는 헬퍼 함수를 반환합니다.

---

## 5. 재고 및 가격 훅 (`features/inventory`)

### 5.1 `useAvailability`
- **파일 위치**: `src/features/inventory/hooks/useInventoryQueries.ts`
- **시그니처**: `useAvailability(accommodationId: number | undefined, checkIn: string | undefined, checkOut: string | undefined): UseQueryResult<RoomAvailability[]>`
- **Query Key**: `['inventory', 'availability', accommodationId, checkIn, checkOut]`
- **설명**: 특정 숙소에 대해 사용자가 선택한 체크인~체크아웃 기간 동안 각 객실의 실시간 예약 가능 잔여 수량 및 요금을 조회합니다. 예약 변동이 잦으므로 `staleTime: 0`으로 유지됩니다.

### 5.2 `useHostInventories`
- **파일 위치**: `src/features/inventory/hooks/useInventoryQueries.ts`
- **시그니처**: `useHostInventories(roomId: number, month: string): UseQueryResult<InventoryItem[]>`
- **Query Key**: `['inventory', 'host', roomId, month]`
- **설명**: 호스트 재고 캘린더에서 특정 객실의 지정 월 1달간 일자별 잔여 수량 및 판매가를 조회합니다 (`staleTime: 0`).

---

## 6. 예약(Reservation) 훅 (`features/reservation`)

### 6.1 `useMyReservations`
- **파일 위치**: `src/features/reservation/hooks/useReservations.ts`
- **시그니처**: `useMyReservations(page: number): UseQueryResult<PageResponse<ReservationItem>>`
- **Query Key**: `['reservation', 'mine', page]`
- **설명**: 게스트 사용자의 본인 예약 내역을 페이징으로 조회합니다.

### 6.2 `useHostReservations`
- **파일 위치**: `src/features/reservation/hooks/useReservations.ts`
- **시그니처**: `useHostReservations(page: number): UseQueryResult<PageResponse<HostReservationItem>>`
- **Query Key**: `['reservation', 'host', page]`
- **설명**: 호스트가 접수한 고객들의 예약 내역을 페이징으로 조회합니다.

### 6.3 `useReservation`
- **파일 위치**: `src/features/reservation/hooks/useReservations.ts`
- **시그니처**: `useReservation(id: number | undefined): UseQueryResult<ReservationDetail>`
- **Query Key**: `['reservation', 'detail', id]`
- **설명**: 단건 예약 상세 정보를 조회합니다 (`staleTime: 0`).

### 6.4 `useInvalidateReservations`
- **파일 위치**: `src/features/reservation/hooks/useReservations.ts`
- **시그니처**: `useInvalidateReservations(): (accommodationId?: number) => void`
- **설명**: 예약 생성/취소, 결제 승인 완료 후 내 예약 쿼리(`['reservation']`) 및 숙소 재고 현황(`['inventory']`) 캐시를 무효화하여 최신화합니다.

### 6.5 `useHoldRemaining`
- **파일 위치**: `src/features/reservation/hooks/useReservations.ts`
- **시그니처**: `useHoldRemaining(reservation: Reservation | undefined): number | null`
- **설명**: 가예약(`PENDING`) 상태의 결제 제한 시간(`holdExpiresAt`)까지 남은 밀리초(ms)를 계산하는 실시간 타이머 훅입니다. 매초 `setInterval`로 갱신되며, 만료 시 0을 반환합니다.

---

## 7. 약관(Terms) 훅 (`features/terms`)

### 7.1 `useTerms`
- **파일 위치**: `src/features/terms/hooks/useTerms.ts`
- **시그니처**: `useTerms(enabled = true): UseQueryResult<Term[]>`
- **Query Key**: `['terms']`
- **설명**: 서비스 이용약관 및 개인정보 처리방침 목록을 조회합니다. 변경이 거의 없는 데이터이므로 `staleTime: 1시간`이 적용됩니다.

---

# 섹션 2. 각 페이지 및 컴포넌트 전체 정리

프론트엔드 애플리케이션의 화면 단위(Pages) 23개와 UI 부품 단위(Components) 37개를 도메인 및 기능별로 정리하였습니다.

---

## 2.1 페이지 (Pages - 총 23개)

| 번호 | 페이지 파일명 | 파일 경로 | 주요 역할 및 화면 기능 |
|:---:|:---|:---|:---|
| 1 | `MainPage` | `features/mainPage/pages/MainPage.tsx` | 서비스 메인 랜딩 페이지. 검색 바, 추천 카테고리 큐레이션, 인기 지역 바로가기, 음악 배너 렌더링 |
| 2 | `AccommodationListPage` | `features/accommodation/pages/AccommodationListPage.tsx` | 숙소 목록 및 검색 결과 페이지. 조건 필터, 정렬, 페이지네이션 및 카드 그리드 제공 |
| 3 | `AccommodationDetailPage` | `features/accommodation/pages/AccommodationDetailPage.tsx` | 숙소 상세 페이지. 숙소 소개, 이미지 갤러리, 객실 목록 및 잔여 수량, 환불 규정, 후기 제공 |
| 4 | `LoginPage` | `features/auth/pages/LoginPage.tsx` | 로그인 페이지. 이메일/비밀번호 로그인 및 소셜 로그인(카카오, 구글) 버튼 제공 |
| 5 | `SignupPage` | `features/auth/pages/SignupPage.tsx` | 자체 이메일 회원가입 페이지. 이메일, 비밀번호, 닉네임 입력 및 필수/선택 약관 동의 |
| 6 | `SocialSignupPage` | `features/auth/pages/SocialSignupPage.tsx` | 소셜 로그인 최초 가입 시 추가 정보(닉네임, 연락처 등) 입력 및 약관 동의를 완료하는 페이지 |
| 7 | `ForgotPasswordPage` | `features/auth/pages/ForgotPasswordPage.tsx` | 비밀번호 찾기 페이지. 가입된 이메일로 비밀번호 재설정 인증 메일 발송 요청 |
| 8 | `ResetPasswordPage` | `features/auth/pages/ResetPasswordPage.tsx` | 이메일 링크를 통해 토큰을 검증받고 새 비밀번호로 변경하는 페이지 |
| 9 | `OAuthCallbackPage` | `features/auth/pages/OAuthCallbackPage.tsx` | 소셜 로그인 리다이렉트 콜백 처리 페이지. URL 토큰 파싱 후 세션 시작 또는 추가정보 페이지로 이동 |
| 10 | `MyPage` | `features/user/pages/MyPage.tsx` | 마이페이지. 내 기본 정보 확인, 닉네임 변경, 비밀번호 변경, 회원 탈퇴 처리 |
| 11 | `FavoritesPage` | `features/favorite/pages/FavoritesPage.tsx` | 내가 찜한 숙소 모아보기 페이지. 찜 목록 페이징 렌더링 및 찜 해제 기능 |
| 12 | `ReservationNewPage` | `features/reservation/pages/ReservationNewPage.tsx` | 예약 생성 페이지. 객실 선택 정보 확인, 투숙객 정보 입력, 가예약(HOLD) 생성 후 결제 페이지로 이동 |
| 13 | `PaymentPage` | `features/payment/pages/PaymentPage.tsx` | 결제 진행 페이지. 가예약 만료 타이머 카운트다운, 결제 수단 선택 및 결제 승인 요청 |
| 14 | `PaymentResultPages` | `features/payment/pages/PaymentResultPages.tsx` | 결제 성공(`PaymentSuccessPage`) 및 결제 실패(`PaymentFailPage`) 안내 결과 화면 |
| 15 | `MyReservationsPage` | `features/reservation/pages/MyReservationsPage.tsx` | 게스트 내 예약 목록 페이지. 예약 번호, 숙소, 일정, 상태별(확정, 취소, 대기) 목록 표시 |
| 16 | `ReservationDetailPage` | `features/reservation/pages/ReservationDetailPage.tsx` | 예약 상세 페이지. 예약 정보, 결제 금액, 취소/환불 규정 확인 및 예약 취소 요청 |
| 17 | `ReviewWritePage` | `features/review/pages/ReviewWritePage.tsx` | 숙소 후기 작성 페이지. 평점 별점, 후기 본문 및 숙소와 어울리는 음악(트랙) 검색 첨부 |
| 18 | `HostHomePage` | `features/host/pages/HostHomePage.tsx` | 호스트 센터 메인 대시보드. 호스트가 등록한 숙소 목록과 상태 확인 |
| 19 | `HostRegisterPage` | `features/host/pages/HostRegisterPage.tsx` | 호스트 사업자 최초 등록 신청 페이지. 사업자 등록번호, 대표자명, 상호명 입력 |
| 20 | `HostAccommodationNewPage` | `features/host/pages/HostAccommodationNewPage.tsx` | 신규 숙소 등록 페이지. 숙소 기본정보, 카테고리, 위치, 편의시설, 환불 규정 최초 등록 |
| 21 | `HostAccommodationPage` | `features/host/pages/HostAccommodationPage.tsx` | 호스트 숙소 관리 상세 페이지. 숙소 정보 수정, 객실 관리, 캘린더 재고 관리 탭 제공 |
| 22 | `HostOtherPages` | `features/host/pages/HostOtherPages.tsx` | 호스트 전용 추가 페이지들 (`HostReservationsPage` - 호스트 예약 관리, `HostInventoriesPage` - 재고 관리) |
| 23 | `AboutPage` | `features/staticPage/pages/AboutPage.tsx` | Preen 서비스 소개 및 브랜드 철학을 전달하는 정적 안내 페이지 |

---

## 2.2 공통 컴포넌트 (Common Components - 총 13개)

| 컴포넌트명 | 파일 경로 | 주요 역할 및 설명 |
|:---|:---|:---|
| `Header` | `common/components/Header.tsx` | 상단 전역 네비게이션 헤더. 로고, 메뉴 링크, 로그인/로그아웃, 마이페이지/호스트센터 이동 |
| `Footer` | `common/components/Footer.tsx` | 하단 전역 푸터. 회사 정보, 약관 링크, 카피라이트 표기 |
| `Layout` | `common/components/Layout.tsx` | 헤더, 메인 콘텐츠 영역(`Outlet`), 푸터를 감싸는 기본 레이아웃 프레임워크 |
| `Dialog` | `common/components/Dialog.tsx` | 확인/취소 알림 모달 팝업. 포커스 트랩, 배경 클릭 닫기, 키보드 ESC 지원 |
| `Toast` / `ToastProvider` | `common/components/Toast.tsx` | 화면에 일시적으로 나타나는 전역 알림 메시지 팝업 컨테이너 |
| `Pagination` | `common/components/Pagination.tsx` | 목록 하단 페이지 이동 버튼(이전, 숫자 버튼, 다음) 렌더링 컴포넌트 |
| `FormField` | `common/components/FormField.tsx` | 폼 입력용 필드 래퍼. 라벨, 필수 입력 표시, 에러 메시지 서식 통일 |
| `ImageUploader` | `common/components/ImageUploader.tsx` | 다중 이미지 파일 선택, 미리보기 썸네일 표시, 순서 정렬 및 삭제 기능 |
| `StatusViews` | `common/components/StatusViews.tsx` | 공통 화면 상태 표시기 (`LoadingView`, `ErrorView`, `EmptyView`) |
| `Screens` | `common/components/Screens.tsx` | 라우트 에러 바운더리(`RootErrorBoundary`) 및 404 에러 화면(`NotFoundScreen`) |
| `icons.tsx` | `common/components/icons.tsx` | SVG 아이콘 집합 (별점, 하트, 검색, 사용자, 닫기 등) |
| `guards.tsx` | `common/auth/guards.tsx` | 라우트 보호 가드 (`RequireAuth`: 로그인 필수, `RequireGuest`: 비로그인 전용) |
| `session.tsx` | `common/auth/session.tsx` | `SessionProvider`: 최상단에서 세션 상태를 공급하는 Provider 컴포넌트 |

---

## 2.3 도메인별 피처 컴포넌트 (Feature Components - 총 24개)

### Accommodation (숙소)
1. `AccommodationCard` (`features/accommodation/components/AccommodationCard.tsx`): 숙소 대표 이미지, 이름, 지역, 가격, 찜 하트 버튼이 포함된 개별 카드 컴포넌트.
2. `AccommodationGrid` (`features/accommodation/components/AccommodationGrid.tsx`): 여러 개의 `AccommodationCard`를 반응형 그리드로 정렬하고 `FavoriteBinding` 컨텍스트를 주입받아 찜 상태를 연결하는 컴포넌트.
3. `AccommodationSection` (`features/accommodation/components/AccommodationSection.tsx`): 특정 조건의 숙소 목록을 쿼리로 조회하여 로딩/에러 상태를 처리하며 그리드로 보여주는 섹션 컴포넌트.
4. `CategoryMenu` (`features/accommodation/components/CategoryMenu.tsx`): 카테고리 목록(호텔, 리조트 등)을 가로 스크롤 탭 메뉴 형태로 렌더링.
5. `RefundPolicyTable` (`features/accommodation/components/RefundPolicyTable.tsx`): 숙소 상세 페이지에 취소일자별 환불 수수료 비율을 테이블 형태로 안내.
6. `FavoriteBindingProvider` (`features/favorite/components/FavoriteBindingProvider.tsx`): 숙소 카드 목록에 찜 조회/토글 기능을 Context로 주입하는 Provider.

### Auth (인증)
7. `SocialButtons` (`features/auth/components/SocialButtons.tsx`): 카카오, 구글 원클릭 소셜 로그인 버튼 모음 컴포넌트.

### Host (호스트 센터)
8. `HostLayout` (`features/host/components/HostLayout.tsx`): 호스트 센터 전용 상단 네비게이션 및 사이드 메뉴 레이아웃.
9. `AccommodationForm` (`features/host/components/AccommodationForm.tsx`): 숙소 기본 정보(이름, 지역, 카테고리, 소개, 주소 등) 등록 및 편집 폼.
10. `RoomManager` (`features/host/components/RoomManager.tsx`): 숙소에 속한 객실(룸) 추가, 가격 및 기준 인원 설정, 수정, 삭제 모달 관리.
11. `RefundPolicyEditor` (`features/host/components/RefundPolicyEditor.tsx`): 호스트가 숙소별 취소/환불 기준을 직접 설정하고 저장하는 편집기.

### Inventory (재고 및 예약 가능 여부)
12. `RoomAvailabilitySection` (`features/inventory/components/RoomAvailabilitySection.tsx`): 숙소 상세 페이지에서 선택한 날짜에 투숙 가능한 객실 목록과 잔여 수량, 1박 요금을 확인하고 예약하기 버튼을 제공하는 핵심 섹션.
13. `InventoryCalendar` (`features/inventory/components/InventoryCalendar.tsx`): 호스트가 월별 달력 형태로 객실의 재고 수량과 요금을 확인하고 클릭하여 즉시 변경할 수 있는 인터랙티브 캘린더.

### MainPage (메인 페이지)
14. `SearchSection` (`features/mainPage/components/SearchSection.tsx`): 메인 상단의 통합 검색 바 (지역 선택, 체크인/아웃 날짜, 인원수 설정).
15. `CurationSection` (`features/mainPage/components/CurationSection.tsx`): 카테고리별 테마 숙소 추천 섹션.
16. `RegionSection` (`features/mainPage/components/RegionSection.tsx`): 인기 여행지(제주, 강원, 부산 등) 큐레이션 카드 섹션.
17. `MusicBanner` (`features/mainPage/components/MusicBanner.tsx`): 음악과 함께하는 감성 숙소 컨셉을 소개하는 배너.
18. `SupportSection` (`features/mainPage/components/SupportSection.tsx`): 고객 문의 및 호스트 모집 안내 섹션.

### Reservation (예약)
19. `ReservationParts` (`features/reservation/components/ReservationParts.tsx`): 예약 상태 뱃지(`ReservationStatusBadge`), 숙소 및 객실 요약 카드, 결제 금액 명세 등의 소형 재사용 컴포넌트 모음.

### Review (후기 및 음악)
20. `AccommodationReviews` (`features/review/components/AccommodationReviews.tsx`): 숙소 상세 페이지 하단에 방문객들의 평균 평점 및 리뷰 리스트를 렌더링.
21. `ReviewParts` (`features/review/components/ReviewParts.tsx`): 별점 입력/표시 컴포넌트(`StarRating`), 개별 리뷰 카드 등 리뷰 전용 부품 컴포넌트.
22. `TrackSearch` (`features/review/components/TrackSearch.tsx`): 리뷰 작성 시 Spotify 트랙 검색 API를 호출하여 숙소와 어울리는 추천 음악을 검색하고 선택하는 컴포넌트.

### Terms (약관)
23. `TermsAgreement` (`features/terms/components/TermsAgreement.tsx`): 회원가입 및 결제 시 필요한 필수/선택 약관 목록과 전체 동의 체크박스 컴포넌트.
24. `TermsLinks` (`features/terms/components/TermsLinks.tsx`): 약관 전문을 모달로 열어볼 수 있는 링크 버튼 목록 컴포넌트.

---

# 섹션 3. 컴포넌트 및 페이지별 사용 훅(Hook) 매핑

모든 페이지 및 컴포넌트가 어떤 커스텀 훅과 내장/라이브러리 훅을 호출하고 있는지 상세히 매핑하였습니다.

---

## 3.1 종합 매핑 테이블

| 구분 | 컴포넌트 / 페이지명 | 사용하는 커스텀 훅 | 사용하는 React 및 라이브러리 훅 |
|:---:|:---|:---|:---|
| **Root/Auth** | `App.tsx` | - | - |
| | `guards.tsx` (`RequireAuth` 등) | `useSession` | `useLocation`, `useSearchParams` |
| | `session.tsx` (`SessionProvider`) | `useSession` | `useQueryClient`, `useRef`, `useCallback`, `useEffect`, `useState`, `useMemo`, `useContext` |
| **Common** | `Header.tsx` | `useSession` | `useNavigate` |
| | `Toast.tsx` | `useToast` | `useState`, `useCallback`, `useMemo`, `useContext` |
| | `Dialog.tsx` | - | `useEffect` |
| | `ImageUploader.tsx` | - | `useId`, `useState` |
| | `Screens.tsx` (`RootErrorBoundary`) | - | `useRouteError` |
| **Main** | `MainPage.tsx` | - | - |
| | `SearchSection.tsx` | `useRegions`, `useCategories` | `useNavigate`, `useState` |
| | `RegionSection.tsx` | `useRegions` | - |
| | `CurationSection.tsx` | `useCategories` | - |
| | `AboutPage.tsx` | - | - |
| **Accommodation** | `AccommodationListPage.tsx` | `useSearchConditions`, `useRegions`, `useCategories`, `useAccommodations` | `useState`, `useEffect` |
| | `AccommodationDetailPage.tsx` | `useAccommodationDetail`, `useFavoriteBinding` | `useParams` |
| | `AccommodationSection.tsx` | `useAccommodations` | - |
| | `AccommodationGrid.tsx` | `useFavoriteBinding` | - |
| | `CategoryMenu.tsx` | `useCategories` | `useState`, `useLocation`, `useEffect` |
| | `favoriteBinding.tsx` | `useFavoriteBinding` | `useContext` |
| **Favorite** | `FavoritesPage.tsx` | `useFavoritePage` | `useSearchParams` |
| | `FavoriteBindingProvider.tsx` | `useSession`, `useFavoriteIds`, `useToggleFavorite` | `useNavigate`, `useLocation`, `useMemo`, `useCallback` |
| **Auth** | `LoginPage.tsx` | `useSession` | `useNavigate`, `useLocation`, `useSearchParams`, `useState` |
| | `SignupPage.tsx` | `useTerms` | `useNavigate`, `useState`, `useEffect` |
| | `SocialSignupPage.tsx` | `useSession`, `useTerms` | `useNavigate`, `useState`, `useEffect` |
| | `OAuthCallbackPage.tsx` | `useSession`, `useToast` | `useParams`, `useSearchParams`, `useNavigate`, `useRef`, `useEffect` |
| | `ForgotPasswordPage.tsx` | - | `useState` |
| | `ResetPasswordPage.tsx` | `useSession` | `useSearchParams`, `useNavigate`, `useState` |
| | `SocialButtons.tsx` | - | `useState` |
| **User** | `MyPage.tsx` | `useSession`, `useToast` | `useNavigate`, `useState` |
| **Reservation** | `ReservationNewPage.tsx` | `useSession`, `useInvalidateReservations`, `useAccommodationDetail`, `useAvailability` | `useSearchParams`, `useNavigate`, `useState` |
| | `ReservationDetailPage.tsx` | `useReservation`, `useInvalidateReservations`, `useToast`, `useHoldRemaining` | `useParams`, `useState`, `useEffect` |
| | `MyReservationsPage.tsx` | `useMyReservations` | `useSearchParams` |
| **Payment** | `PaymentPage.tsx` | `useReservation`, `useHoldRemaining` | `useParams`, `useState`, `useEffect` |
| | `PaymentResultPages.tsx` | `useInvalidateReservations`, `useReservation` | `useParams`, `useSearchParams`, `useEffect` |
| **Review** | `ReviewWritePage.tsx` | `useSession`, `useToast`, `useReservation` | `useParams`, `useNavigate`, `useQueryClient`, `useState` |
| | `AccommodationReviews.tsx` | - | `useState`, `useQuery` |
| | `TrackSearch.tsx` | - | `useState`, `useEffect`, `useQuery` |
| **Host** | `HostHomePage.tsx` | `useHostAccommodations` | - |
| | `HostRegisterPage.tsx` | `useMyBusiness`, `useSession`, `useToast` | `useNavigate`, `useState` |
| | `HostAccommodationNewPage.tsx`| `useToast`, `useInvalidateHost` | `useNavigate`, `useState` |
| | `HostAccommodationPage.tsx` | `useToast`, `useHostAccommodation`, `useInvalidateHost` | `useState`, `useParams` |
| | `HostOtherPages.tsx` | `useHostReservations` | `useParams`, `useSearchParams`, `useLocation` |
| | `HostLayout.tsx` | `useSession` | `useNavigate` |
| | `AccommodationForm.tsx` | `useRegions`, `useCategories`, `useAmenities` | `useState` |
| | `RoomManager.tsx` | `useToast` | `useState` |
| | `RefundPolicyEditor.tsx` | `useToast` | `useState` |
| **Inventory** | `InventoryCalendar.tsx` | `useToast`, `useHostInventories` | `useQueryClient`, `useState`, `useMemo`, `useMutation` |
| | `RoomAvailabilitySection.tsx` | `useAvailability` | `useSearchParams` |
| **Terms** | `TermsAgreement.tsx` | `useTerms` | - |
| | `TermsLinks.tsx` | `useTerms` | - |

---

## 3.2 도메인별 상세 분석 및 훅 활용 목적

### 1) Auth & User 모듈
- **`LoginPage`**: `useSession`의 `signIn` 함수를 호출하여 로그인을 처리하며, `useLocation`과 `useSearchParams`를 통해 로그인 후 원래 접근하려던 보호된 페이지로 리다이렉트합니다.
- **`OAuthCallbackPage`**: 소셜 인증 완료 후 리다이렉트되어 URL 쿼리 파라미터에서 토큰을 추출하고, `useSession().signIn`을 실행합니다. 오류 발생 시 `useToast`로 사용자에게 안내합니다.
- **`MyPage`**: 현재 로그인된 사용자의 프로필 정보를 표시하고 `useSession().reloadUser` 또는 `useSession().signOut`을 호출합니다.
- **`SignupPage` & `SocialSignupPage`**: `useTerms`로 서버에 등록된 최신 이용약관 목록을 조회하여 체크박스를 렌더링하고, 가입 완료 시 세션을 수립합니다.

### 2) Accommodation (숙소 및 검색) 모듈
- **`AccommodationListPage`**:
  - `useSearchConditions`를 통해 URL 쿼리스트링(지역, 카테고리, 일정 등)을 읽어오고, 필터 변경 시 URL을 동기화합니다.
  - `useRegions`, `useCategories`로 필터 옵션을 구성합니다.
  - `useAccommodations`로 실시간 조건에 맞는 숙소 목록을 페이징 조회합니다.
- **`AccommodationDetailPage`**:
  - `useParams`로 URL 경로의 `id`를 읽어 `useAccommodationDetail(id)`를 호출합니다.
  - 하위 숙소 카드나 헤더에서 찜 기능을 즉시 쓸 수 있도록 `useFavoriteBinding`을 연결합니다.
- **`CategoryMenu`**: `useCategories`로 탭 버튼을 구성하고, 현재 선택된 카테고리를 URL과 동기화합니다.

### 3) Reservation & Payment (예약 및 결제) 모듈
- **`ReservationNewPage`**: `useSession`으로 로그인 여부를 검증하고, `useAccommodationDetail` 및 `useAvailability`를 호출하여 선택된 객실의 잔여 수량과 요금을 실시간 검증합니다. 예약 완료 시 `useInvalidateReservations`로 캐시를 갱신합니다.
- **`PaymentPage` & `ReservationDetailPage`**:
  - `useReservation(id)`로 예약 정보를 확인합니다.
  - 가예약 상태인 경우 `useHoldRemaining` 훅을 구동하여 15분 결제 제한 카운트다운 타이머를 화면에 실시간으로 표시합니다.
  - 결제 승인 또는 취소 발생 시 `useInvalidateReservations`로 예약 및 재고 데이터를 무효화합니다.

### 4) Host (호스트 센터) 모듈
- **`HostRegisterPage`**: `useMyBusiness`로 이미 신청한 사업자 내역이 있는지 확인하고, 신청 성공 시 새 토큰을 `useSession().replaceAccessToken`에 전달하여 호스트 권한으로 즉시 갱신합니다.
- **`HostAccommodationPage` & `HostAccommodationNewPage`**: `useHostAccommodation`으로 등록된 정보를 불러오며, 저장 후에는 `useInvalidateHost`를 호출해 숙소 목록 캐시를 무효화합니다.
- **`AccommodationForm`**: 숙소 등록 시 필요한 `useRegions`, `useCategories`, `useAmenities` 데이터를 호출하여 콤보박스 및 체크박스를 동적으로 채웁니다.
- **`InventoryCalendar`**: `useHostInventories`로 한 달 치 객실 재고를 달력에 렌더링하고, 셀 클릭 시 `useMutation`을 실행하여 서버의 재고/가격을 갱신한 후 `useToast`로 성공 알림을 제공합니다.

### 5) Review (후기) 모듈
- **`ReviewWritePage`**: `useReservation(id)`로 본인이 숙박 완료한 예약인지를 확인하고, `TrackSearch` 컴포넌트(`useQuery`)를 통해 Spotify 음악 검색 결과를 실시간으로 받아와 후기에 첨부합니다.

---
*본 문서는 `preen-front-withAI` 프론트엔드 프로젝트의 전체 소스코드를 기반으로 분석·작성되었습니다.*
