# 경력기술서 포트폴리오

실무에서 사용한 기술 스택 그대로 만든 경력기술서 사이트입니다.
방명록(댓글/대댓글)을 MySQL로 관리하며, JWT 회원 댓글과 게스트(닉네임+비밀번호) 댓글을 모두 지원합니다.

- 저장소: https://github.com/nhj1013/portfolio
- 운영 배포: [DEPLOY.md](DEPLOY.md) (Oracle Cloud 무료 VM + Docker Compose)

## 아키텍처

```
┌─────────────────────┐  /api  ┌──────────────────────┐        ┌───────────┐
│  frontend (:3000)   │ proxy  │  backend (:8080)     │  JPA   │  MySQL 8  │
│  Express + Vanilla  │ ─────► │  Spring Boot 3       │ ─────► │  (Docker) │
│  JS (ES Modules)    │        │  Security(JWT) + JPA │        │           │
└─────────────────────┘        └──────────────────────┘        └───────────┘
```

브라우저는 프론트 단일 오리진만 바라보고, Express 가 `/api` 를 백엔드로 프록시합니다.
운영 환경에서는 프론트(80)만 외부에 노출됩니다.

- **댓글/대댓글**: `comment` 테이블 self-reference(`parent_id`), 2-depth
- **soft delete**: 대댓글이 남아 있는 댓글은 "삭제된 댓글입니다" 로 마스킹
- **게스트 댓글**: 비밀번호를 BCrypt 로 해싱 저장, 수정/삭제 시 검증
- **회원 댓글**: 회원가입/로그인 → JWT(HS256) 발급, `Authorization: Bearer` 헤더

## 실행 방법 (로컬 개발)

### 1. MySQL (Docker)
```bash
docker compose up -d
```

### 2. Backend (Spring Boot, :8080)
```bash
cd backend
./gradlew bootRun        # Windows: .\gradlew.bat bootRun
```
- Swagger: http://localhost:8080/swagger-ui.html

### 3. Frontend (Express, :3000)
```bash
cd frontend
npm install
npm start
```
- http://localhost:3000

## API 요약

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/v1/auth/signup` | 회원가입 (즉시 토큰 발급) |
| POST | `/api/v1/auth/login` | 로그인 |
| GET | `/api/v1/comments?page=&size=` | 루트 댓글 페이징 + 대댓글 포함 조회 |
| POST | `/api/v1/comments` | 댓글/대댓글 작성 (회원 또는 게스트) |
| PUT | `/api/v1/comments/{id}` | 댓글 수정 (본인 or 게스트 비밀번호) |
| DELETE | `/api/v1/comments/{id}` | 댓글 삭제 (대댓글 있으면 soft delete) |

## 운영 배포 (24시간 가동)

```bash
cp .env.example .env   # 비밀값 교체
docker compose -f docker-compose.prod.yml up -d --build
```

MySQL → Spring Boot → Express 가 모두 컨테이너로 뜨고, `restart: always` 로 재부팅에도 자동 복구됩니다.
전체 과정은 [DEPLOY.md](DEPLOY.md) 참고.

## 수정할 것

- `frontend/public/index.html` — 이름/회사명/GitHub 주소 등 개인 정보 (`회사명 수정` 표시 참고)
- `backend/src/main/resources/application.yml` — 운영 배포 시 DB 접속 정보와 `jwt.secret` 을 환경변수로 분리
