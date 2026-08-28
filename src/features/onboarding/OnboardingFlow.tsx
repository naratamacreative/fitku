import { useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { userRepository } from '../../data/repositories/userRepository'
import type { NewUser } from '../../data/types/user.types'
import { calculateTdee } from '../../domain/tdee'
import { ProgressDots } from '../../shared/components/ProgressDots'
import { useAppState } from '../../shared/context/AppStateContext'
import { ActivityStep } from './steps/ActivityStep'
import { BodyDataStep } from './steps/BodyDataStep'
import { EatingHabitStep } from './steps/EatingHabitStep'
import { GoalStep } from './steps/GoalStep'
import { MotivationStep } from './steps/MotivationStep'
import { TargetWeightStep } from './steps/TargetWeightStep'
import type { OnboardingDraft, StepProps } from './onboarding.types'

const STEPS: ComponentType<StepProps>[] = [
  GoalStep,
  MotivationStep,
  BodyDataStep,
  TargetWeightStep,
  ActivityStep,
  EatingHabitStep,
]

// Read by Auth.tsx once a session exists, to finish the save that couldn't happen here.
export const PENDING_ONBOARDING_KEY = 'fitku:pendingOnboarding'

export function OnboardingFlow() {
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<OnboardingDraft>({})
  const [saving, setSaving] = useState(false)
  const { session, refreshUser } = useAppState()
  const navigate = useNavigate()

  const onChange = (patch: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...patch }))

  const onNext = async () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1)
      return
    }
    await finishOnboarding()
  }

  const finishOnboarding = async () => {
    if (
      !draft.goal ||
      !draft.motivation ||
      !draft.gender ||
      !draft.age ||
      !draft.heightCm ||
      !draft.weightKg ||
      !draft.targetWeightKg ||
      !draft.activityLevel ||
      !draft.mealsPerDay
    ) {
      return
    }
    setSaving(true)
    const tdee = calculateTdee({
      gender: draft.gender,
      age: draft.age,
      heightCm: draft.heightCm,
      weightKg: draft.weightKg,
      activityLevel: draft.activityLevel,
      goal: draft.goal,
    })

    const newUser: NewUser = {
      gender: draft.gender,
      age: draft.age,
      heightCm: draft.heightCm,
      weightKg: draft.weightKg,
      goal: draft.goal,
      motivation: draft.motivation,
      targetWeightKg: draft.targetWeightKg,
      activityLevel: draft.activityLevel,
      mealsPerDay: draft.mealsPerDay,
      targetCalories: tdee.targetCalories,
      targetProtein: tdee.targetProtein,
      targetCarbs: tdee.targetCarbs,
      targetFat: tdee.targetFat,
    }

    // Lazy auth: TDEE above is already computed and shown regardless of session — the
    // profile row itself can't be written yet (its id is FK'd to auth.users.id), so
    // without a session we stash the completed draft and send the user to register/
    // login. Auth.tsx picks PENDING_ONBOARDING_KEY back up once a session exists and
    // finishes this exact save — nothing here is lost, just deferred.
    if (!session) {
      sessionStorage.setItem(PENDING_ONBOARDING_KEY, JSON.stringify(newUser))
      navigate('/auth', { state: { mode: 'register' } })
      return
    }

    await userRepository.save(newUser)

    await refreshUser()
    navigate('/result', { replace: true })
  }

  const StepComponent = STEPS[stepIndex]
  const canGoBack = stepIndex > 0

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-surface-2 px-5 pt-6 pb-6">
      <div className="mb-4 flex items-center gap-3">
        {canGoBack && (
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="text-ink-dim"
            aria-label="Kembali"
          >
            ←
          </button>
        )}
        <div className="flex-1">
          <ProgressDots total={STEPS.length} current={stepIndex + 1} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <StepComponent draft={draft} onChange={onChange} onNext={onNext} />
      </div>
      {saving && <p className="pt-2 text-center text-xs text-ink-dim">Menghitung target harianmu…</p>}
    </div>
  )
}
