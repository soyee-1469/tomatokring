/** 토마톡 링 공식 구매 링크 (앱 내 결제 없음 · 외부 링크로만 구매) — TODO: 실제 토마톡 링 판매 페이지 주소로 교체 */
export const VITALING_SHOP_URL = 'https://www.tomatalk.co.kr/ring'

export function openVitalingShop() {
  window.open(VITALING_SHOP_URL, '_blank', 'noopener,noreferrer')
}
