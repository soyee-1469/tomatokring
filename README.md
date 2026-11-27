# t.ring (tomatokring)

토마톡 앱 안의 스마트링 서비스 **t.ring** 화면 목업입니다. 50~70대 사용자를 기준으로 홈·바디 리듬·측정·수면·설문·보상 내역 화면과
포인트 지급 흐름(스트레스 / 식단 / 걷기 / 수면 / 설문)을 담고 있습니다. 데이터는 모두 샘플입니다.

**개발 전달 문서: [docs/HANDOFF.md](docs/HANDOFF.md)** — 화면 목록, 데이터 연동 구조, 포인트·바디 리듬 규칙, 문구 원칙, 목업에서 실제로 바꿀 곳

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5180/vitaling/home 을 엽니다.

## 구조

- `src/screens.tsx` 홈(HomeScreen), 설정, 온보딩 화면
- `src/screens/` 바디 리듬·측정 상세, 수면, 설문, 이상 징후, 마이 페이지, 보상 내역 등
- `src/session.ts` 연결·포인트 수령·유효 기록일 등 사용자 상태 (목업은 localStorage)
- `src/rhythm.ts` 바디 리듬 점수·등급 · `src/measureLog.ts` 측정 기록 샘플 · `src/dates.ts` 날짜 도우미
- `src/dev/DemoControls.tsx` 시연용 버튼 (개발 서버에서만 보임)
