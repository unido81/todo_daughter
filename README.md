# 우리집 할일판 (todo_daughter)

아빠와 딸, 단 둘만 사용하는 스케줄 관리 웹앱입니다. Cloudflare Workers + D1 위에서 동작하며, 프론트엔드는 React + Tailwind CSS입니다.

## 주요 기능

- **역할별 로그인**: 아빠 / 딸 계정을 비밀번호로 구분해서 로그인 (Cloudflare Secrets로 관리, DB에 저장하지 않음)
- **할일 등록**: 한 번 / 매일 / 매주(요일 선택) / 매월(날짜 선택) 반복 설정, 완료 시 지급할 포인트 지정
- **달력 보기**: 월 단위 달력에서 그날 달성 정도를 색으로 표시
  - 초록: 그날 할일을 모두 완료
  - 노랑: 일부만 완료
  - 분홍 테두리: 지난 날인데 미완료
  - 하늘색 테두리: 앞으로 예정된 일
- **하이클래스 알림장 가져오기**: 알림장 텍스트를 붙여넣으면 숙제/준비물/시험/행사/전달사항/기타로 자동 분류한 뒤, 아빠가 검수·수정하고 확정된 항목만 할일로 등록 (하이클래스 자동 로그인/스크래핑은 계정정보 노출과 약관 위반 우려로 구현하지 않았습니다)
  - 한 번호 안에 여러 지시가 섞여 있으면 문장 단위로 쪼갭니다. 예를 들어 `4. 금요일 송편만들기 있음. 모두 개인 도시락 꼭 가져오기`는 **행사**(송편만들기)와 **준비물**(도시락) 두 개의 체크 항목이 되고, 앞에서 찾은 날짜(금요일)를 둘 다 물려받습니다
  - `수익 46-47쪽` 같은 줄임말은 `수학익힘책 46-47쪽`으로 펼쳐서 아이가 바로 알아볼 수 있게 합니다
  - `차조심 사람조심`처럼 체크할 일이 아니라 알아두면 되는 문장은 **전달사항**으로 분류되어 할일 목록 맨 아래에 표시됩니다
  - 과목만 나열된 시간표 줄(`사회 체육 미술`)은 기본적으로 등록에서 제외됩니다
- **보상 상점**: 아빠가 보상 항목과 필요 포인트를 설정하면, 딸이 모은 포인트로 교환

## 기술 스택

- Cloudflare Workers (Hono) — 백엔드 API + 정적 파일 서빙 (하나의 Worker로 통합)
- Cloudflare D1 (SQLite 호환) — 데이터 저장
- React + Vite + TypeScript + Tailwind CSS — 프론트엔드
- 세션은 httpOnly 쿠키에 담긴 JWT로 관리

## 로컬 개발

```bash
npm install

# 로컬 비밀값 설정
cp .dev.vars.example .dev.vars
# .dev.vars 안의 JWT_SECRET / DAD_PASSWORD / DAUGHTER_PASSWORD 를 원하는 값으로 수정

# 로컬 D1 데이터베이스에 스키마 적용
npm run db:migrate:local

# 프론트엔드 빌드 (Worker가 dist/ 를 서빙합니다)
npm run build

# Worker + 정적 파일을 한 번에 로컬에서 실행 (http://localhost:8787)
npm run dev
```

프론트엔드만 빠르게 확인하고 싶다면 `npm run dev:frontend` 로 Vite 개발 서버(HMR)를 띄우고, `vite.config.ts`의 프록시 설정을 통해 `/api` 요청은 8787 포트의 `wrangler dev`로 전달됩니다. 이 경우 두 명령을 각각 다른 터미널에서 함께 실행해야 합니다.

## Cloudflare 배포

1. **Cloudflare 계정 로그인**
   ```bash
   npx wrangler login
   ```

2. **D1 데이터베이스 생성**
   ```bash
   npx wrangler d1 create todo_daughter_db
   ```
   출력된 `database_id` 값을 `wrangler.toml`의 `REPLACE_WITH_YOUR_D1_DATABASE_ID` 자리에 넣어주세요.

3. **원격 데이터베이스에 스키마 적용**
   ```bash
   npm run db:migrate:remote
   ```

4. **비밀값 등록** (평문 비밀번호가 저장소나 wrangler.toml에 들어가지 않도록 Cloudflare Secrets로 관리합니다)
   ```bash
   npx wrangler secret put JWT_SECRET
   npx wrangler secret put DAD_PASSWORD
   npx wrangler secret put DAUGHTER_PASSWORD
   ```

5. **배포**
   ```bash
   npm run deploy
   ```
   배포 후 `https://todo-daughter.<your-subdomain>.workers.dev` 같은 주소가 발급됩니다. 필요하면 Cloudflare 대시보드에서 커스텀 도메인을 연결할 수 있습니다.

### 비밀번호를 바꾸고 싶을 때

`wrangler secret put DAD_PASSWORD` / `wrangler secret put DAUGHTER_PASSWORD` 를 다시 실행하면 즉시 반영됩니다. (앱 안에서 바꾸는 화면은 없습니다 — 가족 두 명만 쓰는 서비스라 CLI로 관리하는 편이 오히려 더 안전합니다.)

## 데이터 백업

D1은 Cloudflare가 관리하는 SQLite이며, 아래 명령으로 언제든 통째로 내보낼 수 있습니다.

```bash
npx wrangler d1 export todo_daughter_db --remote --output backup.sql
```

## 알려진 제약

- 하이클래스 연동은 **수동 붙여넣기 + 자동 분류(초안)** 방식입니다. 분류는 키워드 기반 휴리스틱이라 완벽하지 않으므로, 반드시 등록 전 검수 화면에서 카테고리·날짜·제목을 확인해주세요.
- 보상 교환은 별도 승인 절차 없이 즉시 포인트가 차감됩니다(신뢰 기반 MVP). 승인 절차가 필요하면 추후 `redemptions.status` 워크플로를 확장하면 됩니다.
