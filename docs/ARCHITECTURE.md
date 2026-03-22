# LoA Scheduler — 프론트 구조 (로그인 · 원정대)

## 폴더 구조 제안

```
src/
  app/
    (auth)/                    # 선택: 인증 전용 레이아웃 그룹 (로그인 등)
      login/page.tsx
    (app)/                     # 선택: 로그인 후 공통 레이아웃 그룹 (사이드바 등)
      layout.tsx
      expedition/page.tsx
      dashboard/page.tsx
    layout.tsx                 # 루트 레이아웃
    globals.css
  components/
    layout/                    # Sidebar, AppShell 등
    features/
      auth/                    # LoginForm, RequireAuth
      expedition/              # ExpeditionSearchForm, CharacterList, SaveButton 등
  lib/
    api/
      client.ts                # 공통 fetch + 헤더/에러 처리
      auth.ts                  # login / logout 관련 API
      expedition.ts            # 원정대 미리보기, 저장 API (다음 단계)
    auth/
      storage.ts               # 토큰 저장/삭제 (브라우저)
    constants.ts
  types/
    auth.ts
    expedition.ts              # 다음 단계에서 확장
```

**원칙**

- **API**: `lib/api/*`에 엔드포인트별 함수만 두고, HTTP 공통은 `client.ts`.
- **타입**: `types/*`에 요청/응답 DTO.
- **UI**: `components/features/*`에 화면 단위로 분리.
- **기존 `.js` 페이지**: 점진적으로 `.tsx`로 옮기면 됨 (혼용 가능).

## 인증 토큰 저장 방식 (제안)

| 방식 | 장점 | 단점 |
|------|------|------|
| **httpOnly 쿠키 (백엔드 Set-Cookie)** | XSS에 강함, `middleware`에서 보호 라우팅 가능 | CORS·쿠키 도메인 설정 필요, `credentials: 'include'` |
| **localStorage + Bearer** | 백엔드 연동이 단순, 지금 구조와 잘 맞음 | XSS 시 노출 위험 → CSP·입력 검증 권장 |

**현재 구현(1차)**: `localStorage`에 `accessToken` 저장 + `Authorization: Bearer` 헤더.  
백엔드가 쿠키 세션으로 바꾸면 `client.ts`의 `getAuthHeader()`/`credentials`만 수정하면 됩니다.

## 보호 라우팅 처리 방식 (제안)

1. **클라이언트 가드 (현재 구현)**  
   - `RequireAuth`: 로그인 후 페이지에서 토큰 없으면 `/login`으로 이동.  
   - **localStorage**는 서버 미들웨어에서 읽을 수 없어 이 방식이 가장 단순합니다.

2. **middleware + 쿠키 (백엔드가 세션 쿠키 줄 때)**  
   - `src/middleware.ts`에서 쿠키 존재 여부로 `/login` 리다이렉트.  
   - **추천**: 프로덕션에서 쿠키 세션으로 갈 때 추가.

## 환경 변수

`.env.local` 예시는 `.env.example` 참고.

- `NEXT_PUBLIC_API_BASE_URL`: 백엔드 베이스 URL (예: `https://api.example.com`)

## 다음 단계 (원정대)

- `lib/api/expedition.ts`: 미리보기 조회, `characterNames` 저장 API.
- `components/features/expedition/*`: 검색 폼, 리스트, 저장 버튼.
- `types/expedition.ts`: 응답 스키마.

## 이번에 추가된 파일 (로그인 1차)

| 파일 | 역할 |
|------|------|
| `tsconfig.json`, `next-env.d.ts` | TypeScript |
| `docs/ARCHITECTURE.md` | 구조·인증·보호 라우팅 문서 |
| `.env.example` | API 베이스 URL 예시 |
| `src/types/api.ts`, `src/types/auth.ts` | 공통 에러, 로그인 DTO |
| `src/lib/constants.ts` | 스토리지 키 |
| `src/lib/auth/storage.ts` | accessToken 저장/삭제 |
| `src/lib/api/client.ts` | 공통 `fetch` + Bearer |
| `src/lib/api/auth.ts` | `loginApi` |
| `src/components/features/auth/LoginForm.tsx` | 로그인 폼 |
| `src/components/features/auth/RequireAuth.tsx` | 클라이언트 보호 가드 |
| `src/app/login/page.tsx` | `/login` |
| `src/app/expedition/page.tsx` | `/expedition` 플레이스홀더 + 가드 |
