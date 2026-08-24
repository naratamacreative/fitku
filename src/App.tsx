import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { Dashboard } from './features/dashboard/Dashboard'
import { FoodTracker } from './features/food-tracker/FoodTracker'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'
import { ResultMoment } from './features/result-moment/ResultMoment'
import { Settings } from './features/settings/Settings'
import { WeightTracker } from './features/weight-tracker/WeightTracker'
import { AppStateProvider, useAppState } from './shared/context/AppStateContext'
import { ThemeProvider } from './shared/context/ThemeContext'

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAppState()

  if (loading) return null
  if (!user) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingFlow />} />
      <Route path="/result" element={<ResultMoment />} />
      <Route
        path="/"
        element={
          <Gate>
            <Dashboard />
          </Gate>
        }
      />
      <Route
        path="/tracker"
        element={
          <Gate>
            <FoodTracker />
          </Gate>
        }
      />
      <Route
        path="/progress"
        element={
          <Gate>
            <WeightTracker />
          </Gate>
        }
      />
      <Route
        path="/settings"
        element={
          <Gate>
            <Settings />
          </Gate>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AppStateProvider>
    </ThemeProvider>
  )
}

export default App
