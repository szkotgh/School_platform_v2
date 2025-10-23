# 학교 플랫폼 V2

덕영고등학교 소프트웨어과 학생들을 위한 작업물 공유 플랫폼입니다.

## 기능

- 사용자 회원가입 및 로그인
- 프로젝트 등록 및 관리
- 관리자 승인 시스템
- 이미지 갤러리
- 반응형 웹 디자인

## 기술 스택

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **File Upload**: Multer

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 서버 실행
```bash
npm start
```

### 3. 개발 모드 (자동 재시작)
```bash
npm run dev
```

## 서버 배포

### Heroku
1. Heroku CLI 설치
2. `heroku create your-app-name`
3. `git push heroku main`

### Vercel
1. Vercel CLI 설치
2. `vercel --prod`

### Railway
1. Railway CLI 설치
2. `railway login`
3. `railway up`

## 파일 구조

```
├── public/
│   ├── css/          # 스타일시트
│   ├── js/           # JavaScript 파일
│   └── uploads/       # 업로드된 파일
├── backups/          # 데이터베이스 백업
├── server.js         # 메인 서버 파일
├── package.json      # 프로젝트 설정
└── README.md         # 프로젝트 문서
```

## 데이터베이스

- SQLite 데이터베이스 사용
- 자동 테이블 생성
- 백업 파일은 `backups/` 폴더에 저장

## 라이선스

MIT License