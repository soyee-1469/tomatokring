import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  AlertsScreen,
  GuideScreen,
  HelpScreen,
  HomeScreen,
  IndexScreen,
  PairScreen,
  ProfileScreen,
  ServiceScreen,
  SettingsScreen,
  SerialScreen,
  TeamScreen,
  TermsScreen,
  VitalingEntryScreen,
  VitalingGateScreen,
} from './screens'
import { DayScoreScreen } from './screens/DayScoreScreen'
import { LiveVitalsScreen } from './screens/LiveVitalsScreen'
import { MeasureHistoryScreen } from './screens/MeasureHistoryScreen'
import { MeasureScreen } from './screens/MeasureScreen'
import { AutoMeasureScreen } from './screens/AutoMeasureScreen'
import { SurveyReportScreen } from './screens/SurveyReportScreen'
import {
  AlarmScreen,
  CycleScreen,
  MyScreen,
  RankingScreen,
  WorkoutScreen,
} from './screens/ExtraScreens'
import { RewardHistoryAllScreen, RewardHistoryScreen } from './screens/RewardHistoryScreen'
import { VitalDetailScreen } from './screens/VitalDetailScreen'
import {
  ActivityIndexScreen,
  SleepAnalysisScreen,
  StressAnalysisScreen,
} from './screens/AnalysisScreens'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/vitaling/home" replace />} />
        <Route path="/service" element={<ServiceScreen />} />
        <Route path="/vitaling" element={<VitalingEntryScreen />} />
        <Route path="/vitaling/serial" element={<SerialScreen />} />
        <Route path="/vitaling/intro" element={<VitalingGateScreen />} />
        <Route path="/vitaling/terms" element={<TermsScreen />} />
        <Route path="/vitaling/profile" element={<ProfileScreen />} />
        <Route path="/vitaling/pair" element={<PairScreen />} />
        <Route path="/vitaling/home" element={<HomeScreen />} />
        <Route path="/vitaling/day" element={<DayScoreScreen />} />
        <Route path="/vitaling/reward" element={<Navigate to="/vitaling/day" replace />} />
        <Route path="/reward" element={<RewardHistoryScreen />} />
        <Route path="/reward/history" element={<RewardHistoryAllScreen />} />
        <Route path="/reward/points" element={<Navigate to="/reward/history" replace />} />
        <Route path="/reward/tott" element={<Navigate to="/reward/history" replace />} />
        <Route path="/vitaling/live" element={<LiveVitalsScreen />} />
        <Route path="/vitaling/measure/:kind/history" element={<MeasureHistoryScreen />} />
        <Route path="/vitaling/measure/:kind" element={<MeasureScreen />} />
        <Route path="/vitaling/vital/:metricId" element={<VitalDetailScreen />} />
        <Route path="/vitaling/stress" element={<StressAnalysisScreen />} />
        <Route path="/vitaling/activity" element={<ActivityIndexScreen />} />
        <Route path="/vitaling/sleep" element={<SleepAnalysisScreen />} />
        <Route path="/vitaling/survey" element={<SurveyReportScreen />} />
        <Route path="/vitaling/cycle" element={<CycleScreen />} />
        <Route path="/vitaling/alarm" element={<AlarmScreen />} />
        <Route path="/vitaling/workout" element={<WorkoutScreen />} />
        <Route path="/vitaling/ranking" element={<RankingScreen />} />
        <Route path="/vitaling/my" element={<MyScreen />} />
        <Route path="/vitaling/alerts" element={<AlertsScreen />} />
        <Route path="/vitaling/team" element={<TeamScreen />} />
        <Route path="/vitaling/settings" element={<SettingsScreen />} />
        <Route path="/vitaling/settings/auto-measure" element={<AutoMeasureScreen />} />
        <Route path="/vitaling/guide" element={<GuideScreen />} />
        <Route path="/vitaling/help" element={<HelpScreen />} />
        <Route path="/index" element={<IndexScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
