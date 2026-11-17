# 토마톡 링 (tomatokring)

토마톡 링 앱 화면 목업입니다. 50~70대 사용자를 기준으로 홈·측정·수면·설문·보상 내역 화면과
포인트 지급 흐름(스트레스 / AI 식단 / 운동하기(걷기) / 수면 / 설문조사)을 담고 있습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5180/vitaling/home 을 엽니다.

## 구조

- `src/screens.tsx` 홈(HomeScreen), 설정, 온보딩 화면
- `src/screens/` 측정 상세, 수면, 설문, 보상 내역, 자동 측정 모드 등
- `src/session.ts` 측정 완료·포인트 수령 상태(날짜 키), 자동 측정 모드, 식단 사진 저장
- `src/measureLog.ts` 자동/실시간 측정 기록 샘플 생성
