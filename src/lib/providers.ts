import type { IdentityProvider } from '@/api/schemas/common'

/** Названия провайдеров пишем так, как они сами себя называют. */
const PROVIDER_NAMES: Record<IdentityProvider, string> = {
  github: 'GitHub',
  yandex: 'Яндекс ID',
  gitlab: 'GitLab',
  email: 'Почта',
}

export function providerName(provider: IdentityProvider): string {
  return PROVIDER_NAMES[provider]
}
