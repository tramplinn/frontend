import { z } from 'zod'

import { request } from './client'
import { companySchema, interestSchema, universitySchema } from './schemas/directories'
import type { Company, Interest, University } from './schemas/directories'

export function listCompanies(): Promise<Company[]> {
  return request('/companies', { schema: z.array(companySchema) })
}

export function listUniversities(): Promise<University[]> {
  return request('/universities', { schema: z.array(universitySchema) })
}

export function listInterests(): Promise<Interest[]> {
  return request('/interests', { schema: z.array(interestSchema) })
}
