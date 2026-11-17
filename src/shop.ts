/** 토마톡 링 공식 구매 링크 (앱 내 결제 없음 · 외부 링크로만 구매) */
export const VITALING_SHOP_URL =
  'https://vitalring.cafe24.com/product/%EB%B0%94%EC%9D%B4%ED%83%88%EB%A7%81-%ED%95%9C%EA%B5%AD%EC%B5%9C%EC%B4%88-sos%EC%9D%91%EA%B8%89%ED%98%BC%EC%B6%9C-%EA%B8%B0%EB%8A%A5-%EC%88%98%EB%A9%B4-%EC%8A%A4%ED%8A%B8%EB%A0%88%EC%8A%A4-%EA%B0%80%EC%A1%B1-%EC%9D%B4%EC%83%81%EC%8B%A0%ED%98%B8-%EA%B4%80%EB%A6%AC-%EC%88%9C%EC%88%98-%ED%95%9C%EA%B5%AD-%EA%B8%B0%EC%88%A0-%ED%95%9C%EA%B5%AD%EC%A0%9C%EC%A1%B0-%EC%8A%A4%EB%A7%88%ED%8A%B8%EB%A7%81/11/category/1/display/2/'

/** 바이탈링(Vital Ring) 앱 · 설문 — 프로토 딥링크 */
export const VITALING_APP_URL = 'https://vitalring.co.kr/app'
export const VITALING_SURVEY_URL = 'https://vitalring.co.kr/survey'

export function openVitalingShop() {
  window.open(VITALING_SHOP_URL, '_blank', 'noopener,noreferrer')
}

export function openVitalingApp() {
  window.open(VITALING_APP_URL, '_blank', 'noopener,noreferrer')
}

export function openVitalingSurvey() {
  window.open(VITALING_SURVEY_URL, '_blank', 'noopener,noreferrer')
}
