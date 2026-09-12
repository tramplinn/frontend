import { computed, reactive, ref } from 'vue'

import type { DeveloperGrade, Specialty } from '@/api/schemas/users'
import { useCompanySuggestions } from '@/composables/useCompanySuggestions'
import { useInterestSuggestions } from '@/composables/useInterestSuggestions'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import { useUniversitySuggestions } from '@/composables/useUniversitySuggestions'
import { runBusyAction } from '@/lib/asyncAction'
import { errorText } from '@/lib/errors'
import { blankToNull } from '@/lib/forms'
import { useAuthStore } from '@/stores/auth'

function sameInterests(current: string[], original: { name: string }[]): boolean {
  return (
    current.length === original.length &&
    current.every((name, index) => name === original[index]?.name)
  )
}

export function useProfileForm(afterSave: () => void | Promise<void>) {
  const auth = useAuthStore()

  const name = ref(auth.user?.name ?? '')
  const headline = ref(auth.user?.headline ?? '')
  const bio = ref(auth.user?.bio ?? '')
  const specialty = ref<Specialty | ''>(auth.user?.specialty ?? '')
  const grade = ref<DeveloperGrade | ''>(auth.user?.grade ?? '')
  const experienceYears = ref<number | null>(auth.user?.experienceYears ?? null)
  const company = ref(auth.user?.company?.name ?? '')
  const university = ref(auth.user?.university?.name ?? '')
  const interests = ref(auth.user?.interests.map((interest) => interest.name) ?? [])
  const resumeAssetId = ref(auth.user?.resumeAssetId ?? null)
  const resumeUrl = ref(auth.user?.resumeUrl ?? null)

  const companySuggestions = useCompanySuggestions()
  const universitySuggestions = useUniversitySuggestions()
  const interestSuggestions = useInterestSuggestions()

  const saving = ref(false)
  const error = ref<string | null>(null)

  const dirty = computed(() => {
    const user = auth.user
    if (!user) return false
    return (
      name.value !== (user.name ?? '') ||
      headline.value !== (user.headline ?? '') ||
      bio.value !== (user.bio ?? '') ||
      specialty.value !== (user.specialty ?? '') ||
      grade.value !== (user.grade ?? '') ||
      experienceYears.value !== user.experienceYears ||
      company.value !== (user.company?.name ?? '') ||
      university.value !== (user.university?.name ?? '') ||
      resumeAssetId.value !== user.resumeAssetId ||
      !sameInterests(interests.value, user.interests)
    )
  })

  useUnsavedChangesGuard(dirty, 'Есть несохранённые изменения профиля. Уйти со страницы?')

  async function save(): Promise<void> {
    await runBusyAction(
      {
        setBusy: (active) => (saving.value = active),
        clearError: () => (error.value = null),
        setError: (cause) => (error.value = errorText(cause)),
      },
      async () => {
        await auth.updateProfile({
          name: blankToNull(name.value),
          headline: blankToNull(headline.value),
          bio: blankToNull(bio.value),
          specialty: specialty.value || null,
          grade: grade.value || null,
          experienceYears: experienceYears.value,
          company: blankToNull(company.value),
          university: blankToNull(university.value),
          interests: interests.value,
          resumeAssetId: resumeAssetId.value,
        })
        // Сервер нормализует значения (обрезает пробелы и т.п.) — синхронизируем
        // локальные поля, иначе форма ошибочно останется «грязной» сразу после сохранения.
        if (auth.user) {
          name.value = auth.user.name ?? ''
          headline.value = auth.user.headline ?? ''
          bio.value = auth.user.bio ?? ''
          specialty.value = auth.user.specialty ?? ''
          grade.value = auth.user.grade ?? ''
          experienceYears.value = auth.user.experienceYears
          company.value = auth.user.company?.name ?? ''
          university.value = auth.user.university?.name ?? ''
          interests.value = auth.user.interests.map((interest) => interest.name)
          resumeAssetId.value = auth.user.resumeAssetId
        }
        await afterSave()
      },
    )
  }

  return reactive({
    name,
    headline,
    bio,
    specialty,
    grade,
    experienceYears,
    company,
    university,
    interests,
    resumeAssetId,
    resumeUrl,
    companySuggestions,
    universitySuggestions,
    interestSuggestions,
    saving,
    error,
    save,
  })
}
