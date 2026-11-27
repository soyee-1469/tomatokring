/**
 * 지표별 아이콘·색 — 모든 화면이 이 표 하나를 쓴다 (아이콘만 봐도 어떤 지표인지 알 수 있게).
 * 아이콘 칩에는 `metric-ico` 클래스(연한 바탕까지 원하면 `tinted` 추가)와 `data-metric` 을 달면 색이 입혀진다 (index.css 의 --m-* 토큰과 같은 값).
 * 설문은 측정값이 아니라 색을 주지 않는다(먹색).
 */
export type MetricId = 'hr' | 'spo2' | 'temp' | 'hrv' | 'stress' | 'walk' | 'sleep' | 'diet' | 'survey'

export const METRIC_STYLE: Record<MetricId, { label: string; icon: string; color: string; soft: string }> = {
  hr: { label: '심박수', icon: 'heart-pulse', color: '#F96B6D', soft: '#FFEDED' }, // 산호
  spo2: { label: '혈중 산소', icon: 'drop', color: '#2BCFDD', soft: '#E3FAFC' }, // 청록
  temp: { label: '피부 온도', icon: 'temp-hot', color: '#FF8E50', soft: '#FFF1E8' }, // 주황
  hrv: { label: '심박변이도', icon: 'pulse', color: '#568EE4', soft: '#EAF1FC' }, // 파랑
  stress: { label: '스트레스', icon: 'brain', color: '#E07DE5', soft: '#FBEEFC' }, // 분홍
  walk: { label: '걷기', icon: 'walk', color: '#1CCE68', soft: '#E4FAEC' }, // 연두
  sleep: { label: '수면', icon: 'moon', color: '#7E3FF2', soft: '#F1EAFE' }, // 보라 (수면 단계 그래프와 같은 계열)
  diet: { label: '식단', icon: 'restaurant', color: '#F2A900', soft: '#FFF8D9' }, // 노랑 (흰 바탕에서 보이도록 팔레트 노랑보다 조금 진하게)
  survey: { label: '설문', icon: 'survey', color: '#1a2332', soft: '#F2F4F6' },
}
