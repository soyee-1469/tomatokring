import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  GuideScreen,
  HelpScreen,
  HomeScreen,
  PairScreen,
  SettingsScreen,
  TermsScreen,
} from './screens'
import { lazy, Suspense } from 'react'
// 상세 화면들은 처음 들어갈 때 따로 받는다 (첫 화면 묶음 크기를 줄여 빌드 크기 경고 해소)
const DayScoreScreen = lazy(() => import('./screens/DayScoreScreen').then((m) => ({ default: m.DayScoreScreen })))
const LiveVitalsScreen = lazy(() => import('./screens/LiveVitalsScreen').then((m) => ({ default: m.LiveVitalsScreen })))
const MeasureHistoryScreen = lazy(() => import('./screens/MeasureHistoryScreen').then((m) => ({ default: m.MeasureHistoryScreen })))
const MeasureScreen = lazy(() => import('./screens/MeasureScreen').then((m) => ({ default: m.MeasureScreen })))
const AutoMeasureScreen = lazy(() => import('./screens/AutoMeasureScreen').then((m) => ({ default: m.AutoMeasureScreen })))
const SurveyReportScreen = lazy(() => import('./screens/SurveyReportScreen').then((m) => ({ default: m.SurveyReportScreen })))
const MyScreen = lazy(() => import('./screens/MyScreen').then((m) => ({ default: m.MyScreen })))
const SignalScreen = lazy(() => import('./screens/SignalScreen').then((m) => ({ default: m.SignalScreen })))
const GoalsScreen = lazy(() => import('./screens/ProfileGoalsScreen').then((m) => ({ default: m.GoalsScreen })))
const ProfileScreenMy = lazy(() => import('./screens/ProfileGoalsScreen').then((m) => ({ default: m.ProfileScreenMy })))
const RewardHistoryAllScreen = lazy(() => import('./screens/RewardHistoryScreen').then((m) => ({ default: m.RewardHistoryAllScreen })))
const SleepAnalysisScreen = lazy(() => import('./screens/AnalysisScreens').then((m) => ({ default: m.SleepAnalysisScreen })))
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      {/* 상세 화면을 받는 동안은 빈 화면 (아주 짧음) */}
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Navigate to="/vitaling/home" replace />} />
        <Route path="/vitaling" element={<Navigate to="/vitaling/home" replace />} />
        <Route path="/vitaling/serial" element={<Navigate to="/vitaling/settings" replace />} /> {/* 고유번호는 반지 연결 시 자동 연동 — 입력 화면 없음 */}
        <Route path="/vitaling/terms" element={<TermsScreen />} />
        <Route path="/vitaling/pair" element={<PairScreen />} />
        <Route path="/vitaling/home" element={<HomeScreen />} />
        <Route path="/vitaling/day" element={<DayScoreScreen />} />
        <Route path="/vitaling/reward" element={<Navigate to="/vitaling/day" replace />} />
        <Route path="/reward" element={<Navigate to="/reward/history" replace />} />
        <Route path="/reward/history" element={<RewardHistoryAllScreen />} />
        <Route path="/reward/points" element={<Navigate to="/reward/history" replace />} />
        <Route path="/reward/tott" element={<Navigate to="/reward/history" replace />} />
        <Route path="/vitaling/live" element={<LiveVitalsScreen />} />
        <Route path="/vitaling/measure/:kind/history" element={<MeasureHistoryScreen />} />
        <Route path="/vitaling/measure/:kind" element={<MeasureScreen />} />
        <Route path="/vitaling/stress" element={<Navigate to="/vitaling/measure/stress" replace />} />
        <Route path="/vitaling/activity" element={<Navigate to="/vitaling/measure/walk" replace />} />
        <Route path="/vitaling/sleep" element={<SleepAnalysisScreen />} />
        <Route path="/vitaling/signal" element={<SignalScreen />} />
        <Route path="/vitaling/survey" element={<SurveyReportScreen />} />
        <Route path="/vitaling/my" element={<MyScreen />} />
        <Route path="/vitaling/my/profile" element={<ProfileScreenMy />} />
        <Route path="/vitaling/goals" element={<GoalsScreen />} />
        <Route path="/vitaling/settings" element={<SettingsScreen />} />
        <Route path="/vitaling/settings/auto-measure" element={<AutoMeasureScreen />} />
        <Route path="/vitaling/guide" element={<GuideScreen />} />
        <Route path="/vitaling/help" element={<HelpScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
