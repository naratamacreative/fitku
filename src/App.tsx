import { lazy, Suspense } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AppStateProvider, useAppState } from './shared/context/AppStateContext'
import { ThemeProvider } from './shared/context/ThemeContext'

// Route-level code splitting: each feature ships as its own chunk, fetched
// only when its route is visited, instead of all being in the one main
// bundle every visitor downloads up front (incl. Welcome/Auth, the first
// screen for most new users, who don't need Dashboard/FoodTracker/AiCoach/
// Premium code yet). No behavior change — same components, same props.
const AiCoach = lazy(() => import('./features/ai-coach/AiCoach').then((m) => ({ default: m.AiCoach })))
const Auth = lazy(() => import('./features/auth/Auth').then((m) => ({ default: m.Auth })))
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })))
const FoodTracker = lazy(() => import('./features/food-tracker/FoodTracker').then((m) => ({ default: m.FoodTracker })))
const Hydration = lazy(() => import('./features/hydration/Hydration').then((m) => ({ default: m.Hydration })))
const OnboardingFlow = lazy(() => import('./features/onboarding/OnboardingFlow').then((m) => ({ default: m.OnboardingFlow })))
const Premium = lazy(() => import('./features/premium/Premium').then((m) => ({ default: m.Premium })))
const Progress = lazy(() => import('./features/progress/Progress').then((m) => ({ default: m.Progress })))
const ResetPassword = lazy(() => import('./features/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })))
const ResultMoment = lazy(() => import('./features/result-moment/ResultMoment').then((m) => ({ default: m.ResultMoment })))
const EditProfile = lazy(() => import('./features/settings/EditProfile').then((m) => ({ default: m.EditProfile })))
const Settings = lazy(() => import('./features/settings/Settings').then((m) => ({ default: m.Settings })))
const Welcome = lazy(() => import('./features/welcome/Welcome').then((m) => ({ default: m.Welcome })))

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

// Lazy auth: /onboarding is reachable WITHOUT a session — TDEE is computed and shown
// purely client-side, no session needed for that. Auth only kicks in when the user
// finishes onboarding and wants to see/save the result (see OnboardingFlow.tsx). Still
// blocks an already-onboarded user from accidentally re-onboarding.
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAppState()

  if (loading) return null
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
      <Route path="/reset-password" element={<ResetPassword />} />
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
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
        </Router>
      </AppStateProvider>
    </ThemeProvider>
  )
}

export default App
