<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import type { Locale } from '@/i18n'
import { LOCALES, useI18n } from '@/i18n'
import { localeSaveFailed, selectLocale } from '@/i18n/useLocaleSync'

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()

const SHORT: Record<Locale, string> = { ru: 'RU', en: 'EN' }

async function pick(value: Locale): Promise<void> {
  if (value === locale.value) {
    return
  }
  // Язык из ссылки остаётся в адресе, но должен совпадать с выбранным —
  // иначе переход по ссылке снова переключил бы интерфейс обратно.
  if (typeof route.query.locale === 'string') {
    void router.replace({ query: { ...route.query, locale: value } })
  }
  await selectLocale(value)
}
</script>

<template>
  <div class="locale">
    <div class="switch" role="group" :aria-label="t('locale.switcher')">
      <button
        v-for="value in LOCALES"
        :key="value"
        type="button"
        class="option"
        :class="{ 'option--active': value === locale }"
        :lang="value"
        :title="t(`locale.${value}`)"
        :aria-label="t(`locale.${value}`)"
        :aria-pressed="value === locale"
        @click="pick(value)"
      >
        {{ SHORT[value] }}
      </button>
    </div>
    <span v-if="localeSaveFailed" class="save-failed" role="status">
      {{ t('locale.saveFailed') }}
    </span>
  </div>
</template>

<style scoped>
.locale {
  position: relative;
  display: flex;
  align-items: center;
}

.switch {
  display: inline-flex;
  padding: 2px;
  border-radius: var(--radius-pill);
  background: var(--surface);
}

.option {
  min-width: var(--ctl-sm);
  height: calc(var(--ctl-sm) - 4px);
  padding: 0 var(--space-2);
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.option:hover {
  color: var(--text);
}

.option--active {
  background: var(--card);
  color: var(--text);
}

.save-failed {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  z-index: 10;
  width: max-content;
  max-width: 240px;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--card);
  box-shadow: var(--shadow-raised);
  color: var(--danger);
  font-size: var(--text-caption);
}
</style>
