/** 토마톡 링 공식 구매 링크 (앱 내 결제 없음 · 외부 링크로만 구매) — TODO: 실제 토마톡 링 판매 페이지 주소로 교체 */
export const VITALING_SHOP_URL = 'https://www.tomatalk.co.kr/ring'

/** 토마톡 링 설문 — 프로토 딥링크 (TODO: 실제 주소로 교체) */
export const VITALING_APP_URL = 'https://www.tomatalk.co.kr/ring/app'
export const VITALING_SURVEY_URL = 'https://www.tomatalk.co.kr/ring/survey'

export function openVitalingShop() {
  window.open(VITALING_SHOP_URL, '_blank', 'noopener,noreferrer')
}

export function openVitalingApp() {
  window.open(VITALING_APP_URL, '_blank', 'noopener,noreferrer')
}

export function openVitalingSurvey() {
  window.open(VITALING_SURVEY_URL, '_blank', 'noopener,noreferrer')
}
