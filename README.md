# Germa-Niche 2026 🇩🇪

2026년 2월 독일 여행을 위한 프라이빗 그룹 여행 앱입니다.

## 🚀 실행 가이드 (Setup Instructions)

환경 설정 및 실행 방법 안내입니다.

### 1. 필수 프로그램 설치
- **Node.js** (LTS 버전)를 [nodejs.org](https://nodejs.org/)에서 설치해주세요.
- 설치 확인: 터미널에서 `node -v` 및 `npm -v` 입력 시 버전 숫자가 나와야 합니다.

### 2. 프로젝트 초기화 및 패키지 설치
이 폴더(`germanyGo`)에서 터미널을 열고 아래 명령어를 순서대로 실행하세요:

```bash
# 의존성 패키지 설치
npm install
```

### 3. 환경 변수 설정 (중요!)
최상위 폴더에 `.env.local` 파일을 생성하고, 본인의 Firebase 설정 정보를 아래와 같이 입력해야 합니다.

> **💡 Firebase 키는 어디서 찾나요?**
> 1. [Firebase Console](https://console.firebase.google.com/)에 접속하여 로그인합니다.
> 2. **프로젝트 만들기**를 클릭하여 새 프로젝트를 생성합니다.
> 3. 프로젝트 개요 페이지에서 **웹 아이콘(`</>`)**을 클릭하여 앱을 등록합니다.
> 4. `firebaseConfig` 객체에 있는 값(`apiKey`, `authDomain` 등)을 복사하여 아래 양식에 채워넣으세요.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. 앱 실행
```bash
npm run dev
```
실행 후 브라우저에서 `http://localhost:3000`으로 접속하세요.

---

## 📂 프로젝트 구조
- `app/page.tsx`: 메인 대시보드 (교통비 비교, 추천 장소 기능 포함).
- `components/MemoPad.tsx`: 여행 할 일 및 위시리스트 (메모패드).
- `hooks/useAuth.ts`: 인증 로직 (엄격한 **3인 제한** 규칙 적용).
- `firebase.js`: Firebase 초기화 설정 파일.

## ✨ 주요 기능
- **3인 멤버 제한**: 가입자 수가 3명을 넘으면 자동으로 가입이 차단됩니다 ("Group Full").
- **K-Style 디자인**: 깔끔한 공백과 과감한 폰트, 네온 컬러 포인트.
- **교통편 최적화**: 3인 그룹 레일 패스와 개별 티켓 가격 비교 시각화.
- **니치(Niche) 장소 발견**: 평점 4.5 이상이지만 리뷰 수가 적은(100개 미만) 숨은 맛집 찾기.
