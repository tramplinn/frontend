import type { IdentityProvider } from '@/api/schemas/common'
import { translate } from '@/i18n'

/** Названия провайдеров пишем так, как они сами себя называют; переводим только те,
    у которых есть официальное название на другом языке. */
export function providerName(provider: IdentityProvider): string {
  switch (provider) {
    case 'github':
      return 'GitHub'
    case 'gitlab':
      return 'GitLab'
    case 'yandex':
      return translate('providers.yandex')
    case 'email':
      return translate('providers.email')
  }
}
