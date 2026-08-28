import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AiCoach } from './features/ai-coach/AiCoach'
import { Auth } from './features/auth/Auth'
import { Dashboard } from './features/dashboard/Dashboard'
import { FoodTracker } from './features/food-tracker/FoodTracker'
import { Hydration } from './features/hydration/Hydration'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'
import { Premium } from './features/premium/Premium'
import { Progress } from './features/progress/Progress'
import { ResultMoment } from './features/result-moment/ResultMoment'
import { EditProfile } from './features/settings/EditProfile'
import { Settings } from './features/settings/Settings'
import { Welcome } from './features/welcome/Welcome'
import { AppStateProvider, useAppState } from './shared/context/AppStateContext'
import { ThemeProvider } from './shared/context/ThemeContext'

// Requires both an authenticated session AND a profile row (onboarding completed).
function Gate({ children }: { children: React.ReactNode }) {
  const { session, user, loading } = useAppState()

  if (loading) return null
  if (!session) return <Navigate to="/welcome" replace />
  if (!user) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

// For /welcome and /auth: a fully set-up visitor (session + profile) skips
// straight to the app instead of seeing the marketing/auth screens again.
function GuestOnly({ children }: { children: React.ReactNode }) {
  const { session, user, loading } = useAppState()

  if (loading) return null
  if (session && user) return <Navigate to="/" replace />
  return <>{children}</>
}

// /onboarding needs a session (a profile row's id is the auth user's id), but must
// NOT already have a profile — otherwise a returning user could re-onboard by accident.
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { session, user, loading } = useAppState()

  if (loading) return null
  if (!session) return <Navigate to="/welcome" replace />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/welcome"
        element={
          <GuestOnly>
            <Welcome />
          </GuestOnly>
        }
      />
      <Route
        path="/auth"
        element={
          <GuestOnly>
            <Auth />
          </GuestOnly>
        }
      />
      <Route
        path="/onboarding"
        element={
          <OnboardingGate>
            <OnboardingFlow />
          </OnboardingGate>
        }
      />
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
        path="/hydration"
        element={
          <Gate>
            <Hydration />
          </Gate>
        }
      />
      <Route
        path="/progress"
        element={
          <Gate>
            <Progress />
          </Gate>
        }
      />
      <Route
        path="/settings/profile"
        element={
          <Gate>
            <EditProfile />
          </Gate>
        }
      />
      <Route
        path="/coach"
        element={
          <Gate>
            <AiCoach />
          </Gate>
        }
      />
      <Route
        path="/premium"
        element={
          <Gate>
            <Premium />
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
