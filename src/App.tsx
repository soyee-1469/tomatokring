import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  GuideScreen,
  HelpScreen,
  HomeScreen,
  PairScreen,
  SettingsScreen,
  SerialScreen,
  TermsScreen,
} from './screens'
import { DayScoreScreen } from './screens/DayScoreScreen'
import { LiveVitalsScreen } from './screens/LiveVitalsScreen'
import { MeasureHistoryScreen } from './screens/MeasureHistoryScreen'
import { MeasureScreen } from './screens/MeasureScreen'
import { AutoMeasureScreen } from './screens/AutoMeasureScreen'
import { SurveyReportScreen } from './screens/SurveyReportScreen'
import { MyScreen } from './screens/MyScreen'
import { SignalScreen } from './screens/SignalScreen'
import { GoalsScreen, ProfileScreenMy } from './screens/ProfileGoalsScreen'
import { RewardHistoryAllScreen, RewardHistoryScreen } from './screens/RewardHistoryScreen'
import {
  SleepAnalysisScreen,
} from './screens/AnalysisScreens'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/vitaling/home" replace />} />
        <Route path="/vitaling" element={<Navigate to="/vitaling/home" replace />} />
        <Route path="/vitaling/serial" element={<SerialScreen />} />
        <Route path="/vitaling/terms" element={<TermsScreen />} />
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
    </BrowserRouter>
  )
}
