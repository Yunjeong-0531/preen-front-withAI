# 📘 백엔드/자바 개발자를 위한 모던 React 핵심 용어 완벽 가이드

> 이 문서는 `preen-front-withAI` 프로젝트와 최신 프론트엔드 코드에 쓰인 **리액트·웹 전용 용어와 개념**을 중요도 순으로 정리한 치트시트입니다.  
> 자바(Java)와 스프링(Spring) 개념에 빗대어 처음 보는 분도 직관적으로 이해할 수 있도록 구성했습니다.

---

## 🏆 중요도 레벨 요약

```text
[Tier 1: 필수 기본기]     컴포넌트, JSX, Props, className, children, key, useState, useEffect
          ▼
[Tier 2: 실무 핵심]       useNavigate, useParams, useSearchParams, Link / useQuery, useMutation, queryKey
          ▼
[Tier 3: 상태·성능·폼]     useRef, useContext, useMemo, useCallback / FormEvent, ChangeEvent
          ▼
[Tier 4: 심화·브라우저]    ComponentType, createElement / import.meta.env, FormData, Web Locks, ?, ??
```

---

## ⭐️ Tier 1. 필수 기본기 (이걸 모르면 코드 한 줄도 못 읽음)

### 1. `JSX / TSX`
* **설명**: 자바스크립트/타입스크립트 코드 안에 HTML 태그를 자연스럽게 섞어 쓰는 문법입니다.
* **자바 비유**: JSP나 Thymeleaf 템플릿 문법을 자바 메서드 안에 바로 집어넣은 것과 같습니다.
```tsx
const element = <h1 className="title">안녕하세요!</h1>;
```

### 2. `Props`와 `children`
* **`Props`**: 부모 컴포넌트가 자식에게 전달하는 **함수 인자(파라미터)**입니다. 읽기 전용(불변)입니다.
* **`children`**: 태그 사이에 끼워 넣은 내용물이 자식에게 자동으로 넘어가는 특별한 Props입니다.
* **자바 비유**: 자바 클래스 생성자의 매개변수(`new Card(title, content)`).
```tsx
// 부모: <Card title="숙소">여기가 children 자리입니다</Card>
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
```

### 3. `className`과 `htmlFor`
* **설명**: HTML의 `class`와 `for` 속성을 대체하는 리액트 단어입니다.
* **이유**: 자바스크립트 언어 자체에 이미 `class`(클래스 선언), `for`(반복문) 예약어가 있기 때문에 충돌을 피하려고 이름을 바꿨습니다.
```tsx
// HTML: <label for="email" class="form-label">
// JSX:
<label htmlFor="email" className="form-label">이메일</label>
```

### 4. `key`
* **설명**: 반복문(`.map()`)으로 리스트 목록을 그릴 때, 각 태그에 **반드시 붙여야 하는 고유 식별 번호표(ID)**입니다.
* **이유**: 리액트가 리스트에서 어떤 항목이 수정·삭제되었는지 정확히 찾아내어 그 부분만 빠르게 다시 그리기 위함입니다.
```tsx
{rooms.map(room => (
  <li key={room.id}>{room.name}</li> // key 필수!
))}
```

### 5. `useState` (상태)
* **설명**: **화면에 반영되는 변수**를 만듭니다. 값이 바뀌면 리액트가 화면을 자동으로 다시 그립니다(리렌더링).
* **자바 비유**: 값이 바뀔 때마다 자동으로 화면 갱신 이벤트를 쏴주는 자바빈즈(JavaBeans) 프로퍼티.
```tsx
const [count, setCount] = useState(0); // [현재값, 변경함수]
setCount(count + 1); // 1 증가시키고 화면 자동 갱신
```

### 6. `useEffect` (화면 뒷작업)
* **설명**: 화면이 브라우저에 다 그려진 직후(마운트) 실행되는 **사이드 이펙트(API 호출, 타이머 등)**를 정의합니다.
* **자바 비유**: 스프링의 `@PostConstruct` (초기화 메서드)와 유사합니다.
```tsx
useEffect(() => {
  console.log('화면이 떴습니다!');
}, []); // []는 "처음 화면 뜰 때 딱 한 번만 실행"이라는 뜻
```

---

## 🚀 Tier 2. 실무 핵심 (페이지 이동 & 서버 통신)

### A. React Router DOM (화면 전환)

| 단어 | 역할 | 코드 예시 |
|---|---|---|
| **`useNavigate`** | 코드로 페이지를 이동시킴 | `const navigate = useNavigate();`<br>`navigate('/login');` |
| **`useParams`** | URL 경로 변수 추출 (`/rooms/:id`) | `const { id } = useParams();` |
| **`useSearchParams`** | 물음표 뒤 쿼리스트링 읽기/수정 | `const [params] = useSearchParams();`<br>`const page = params.get('page');` |
| **`<Link to="...">`** | 새로고침 없이 화면 이동 (`<a>` 대체) | `<Link to="/me">마이페이지</Link>` |
| **`<Navigate to="..." />`** | 렌더링 즉시 강제 리다이렉트 (튕겨내기) | `if (!isLoggedIn) return <Navigate to="/login" />;` |
| **`<Outlet />`** | 부모 레이아웃 안에 자식 페이지가 들어갈 구멍 | `<Header /><Outlet /><Footer />` |

### B. TanStack Query (서버 캐시 & 통신)

| 단어 | 역할 | 설명 |
|---|---|---|
| **`useQuery`** | 데이터 조회 (GET) | 로딩, 에러, 캐시 관리를 한 번에 처리 |
| **`useMutation`** | 데이터 변경 (POST/PUT/DELETE) | 등록, 수정, 삭제 비동기 요청 처리 |
| **`useQueryClient`** | 캐시 총괄 관리자 | 전역 캐시를 비우거나 갱신할 때 사용 |
| **`queryKey`** | 캐시의 고유 이름표 (배열) | `['accommodation', id]` 처럼 캐시를 구분하는 Key |
| **`staleTime`** | 캐시가 신선하다고 인정하는 시간 | 이 시간 동안은 백엔드를 다시 호출하지 않음 |
| **`invalidateQueries`** | 특정 캐시 강제 폐기 | 데이터 수정 후 최신 목록을 다시 긁어오게 만듦 |

```tsx
// 숙소 단건 조회 예시
const { data, isPending, isError } = useQuery({
  queryKey: ['accommodation', id],
  queryFn: () => fetchAccommodation(id),
  staleTime: 60 * 1000, // 1분간 캐시 유지
});
```

---

## 💡 Tier 3. 상태·성능 최적화·폼 이벤트

### 1. `useRef`
* **설명**: 
  1. 화면을 다시 그릴 필요는 없지만 값을 기억해 두고 싶을 때 (자바의 클래스 인스턴스 필드)
  2. 실제 HTML 태그 엘리먼트를 직접 가리켜서 포커스를 주거나 조작할 때
```tsx
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus(); // 특정 인풋 창으로 커서 이동
```

### 2. `createContext` & `useContext`
* **설명**: 부모-자식 간에 Props를 일일이 넘겨주지 않고, **전체 컴포넌트 트리에 공통 데이터를 주입(DI)**하는 통로입니다.
* **자바 비유**: 스프링의 `@Autowired` / 의존성 주입(ApplicationContext)과 개념이 같습니다.

### 3. `useMemo` & `useCallback`
* **`useMemo`**: 비용이 많이 드는 계산 결과를 메모리에 캐싱해 둡니다. (메모이제이션)
* **`useCallback`**: 컴포넌트가 다시 그려질 때 함수가 매번 새로 생성되는 것을 방지합니다.

### 4. `FormEvent` & `ChangeEvent`
* **`FormEvent`**: `<form onSubmit={...}>` 이벤트 타입. `e.preventDefault()`로 브라우저의 기본 새로고침을 막을 때 씁니다.
* **`ChangeEvent`**: `<input onChange={...}>` 이벤트 타입. `e.target.value`로 입력된 텍스트를 꺼냅니다.

---

## 🛠️ Tier 4. 심화 및 브라우저 웹 API / 최신 문법

### 1. 프레임워크 타입 및 특수 함수
* **`ComponentType`**: 컴포넌트 자체를 변수나 Props로 넘길 때 붙이는 타입 (자바의 `Class<? extends Component>`).
* **`createElement`**: JSX 문법 대신 자바스크립트 함수로 컴포넌트를 동적으로 찍어내는 저수준 메서드.
* **`RouteObject`**: React Router에서 하나의 URL 경로 규칙을 정의하는 객체 타입.

### 2. 브라우저 최신 웹 API
* **`import.meta.env`**: Vite 빌드 도구에서 환경 변수를 꺼내오는 문법 (`VITE_API_BASE_URL`).
* **`FormData`**: 파일 업로드(`multipart/form-data`)를 위해 자바스크립트에서 폼 데이터를 패키징하는 객체.
* **`AbortController` / `AbortSignal`**: 진행 중인 비동기 HTTP 요청을 중간에 강제 취소하는 리모컨.
* **`navigator.locks`**: 여러 탭이 열려 있어도 단 하나의 탭에서만 토큰을 갱신하도록 조율하는 브라우저 락(Lock).

### 3. 자바스크립트 특유의 기호들

| 기호 | 이름 | 의미 / 자바 비교 |
|---|---|---|
| **`!`** | Non-null Assertion | `el!` : "절대 null 아니니까 컴파일러 넌 안심해" (강제 단언) |
| **`?.`** | Optional Chaining | `user?.name` : `if (user != null) user.getName()`의 축약 |
| **`??`** | Nullish Coalescing | `a ?? b` : a가 null이나 undefined일 때만 b 사용 |
| **`...`** | Spread 연산자 | `[...list, item]` : 기존 배열을 펼쳐서 새 배열로 불변 복사 |
| **`as const`** | Const Assertion | `['a', 'b'] as const` : 완벽한 불변 리터럴 튜플로 고정 |
