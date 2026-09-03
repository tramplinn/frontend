import type { DeveloperGrade, Specialty } from '@/api/schemas/users'

export const SPECIALTIES: { value: Specialty; label: string }[] = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Fullstack' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'data', label: 'Data / ML' },
  { value: 'devops', label: 'DevOps' },
  { value: 'qa', label: 'QA' },
]

export const GRADES: { value: DeveloperGrade; label: string }[] = [
  { value: 'learning', label: 'Учусь' },
  { value: 'junior', label: 'Junior' },
  { value: 'middle', label: 'Middle' },
  { value: 'senior', label: 'Senior' },
]

export function specialtyName(value: Specialty | null): string | null {
  return SPECIALTIES.find((item) => item.value === value)?.label ?? null
}

export function gradeName(value: DeveloperGrade | null): string | null {
  return GRADES.find((item) => item.value === value)?.label ?? null
}
