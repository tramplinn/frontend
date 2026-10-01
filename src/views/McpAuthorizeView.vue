<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import {
  approveMcpAuthorization,
  denyMcpAuthorization,
  getMcpAuthorizationRequest,
} from '@/api/auth'
import type { McpAuthorizationRequest } from '@/api/schemas/auth'
import AppButton from '@/components/ui/AppButton.vue'
import { errorText } from '@/lib/errors'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const route = useRoute()
const authorization = ref<McpAuthorizationRequest | null>(null)
const error = ref<string | null>(null)
const approving = ref(false)
const denying = ref(false)
const requestId = typeof route.query.request === 'string' ? route.query.request : ''

onMounted(async () => {
  if (!requestId) {
    error.value = t('mcp.badRequest')
    return
  }
  try {
    authorization.value = await getMcpAuthorizationRequest(requestId)
  } catch (cause) {
    error.value = errorText(cause)
  }
})

async function approve(): Promise<void> {
  approving.value = true
  error.value = null
  try {
    const result = await approveMcpAuthorization(requestId)
    window.location.assign(result.redirectUrl)
  } catch (cause) {
    error.value = errorText(cause)
    approving.value = false
  }
}

async function deny(): Promise<void> {
  denying.value = true
  error.value = null
  try {
    const result = await denyMcpAuthorization(requestId)
    window.location.assign(result.redirectUrl)
  } catch (cause) {
    error.value = errorText(cause)
    denying.value = false
  }
}
</script>

<template>
  <section class="authorize">
    <div class="card">
      <p class="eyebrow">{{ t('mcp.eyebrow') }}</p>
      <h1>{{ t('mcp.title') }}</h1>

      <template v-if="authorization">
        <p class="description">
          {{ t('mcp.description', { client: authorization.clientName }) }}
        </p>
        <div class="scope">
          <strong>{{ t('mcp.permission') }}</strong>
          <span>{{ t('mcp.scope', { scope: authorization.scope }) }}</span>
        </div>
        <div class="actions">
          <AppButton variant="primary" :loading="approving" :disabled="denying" @click="approve">
            {{ t('mcp.allow') }}
          </AppButton>
          <AppButton variant="quiet" :loading="denying" :disabled="approving" @click="deny">
            {{ t('mcp.deny') }}
          </AppButton>
        </div>
      </template>

      <p v-else-if="!error" class="description">{{ t('mcp.checking') }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </div>
  </section>
</template>

<style scoped>
.authorize {
  display: grid;
  place-items: center;
  min-height: min(70vh, 680px);
  padding: var(--space-8) 0;
}

.card {
  width: min(560px, 100%);
  padding: var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}

.eyebrow {
  margin-bottom: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

h1 {
  font-size: var(--text-title);
}

.description {
  margin-top: var(--space-5);
  color: var(--text-muted);
  line-height: 1.6;
}

.scope {
  display: grid;
  gap: var(--space-1);
  margin-top: var(--space-6);
  padding: var(--space-4);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}

.scope span {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.error {
  margin-top: var(--space-5);
  color: var(--danger);
}
</style>
