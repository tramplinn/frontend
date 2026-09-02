<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { linkUrl, logoutEverywhere, unlinkIdentity } from '@/api/auth'
import type { IdentityProvider } from '@/api/schemas/common'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import { providerName } from '@/lib/providers'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'

const auth = useAuthStore()
const progress = useProgressStore()
const router = useRouter()

const signingOut = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)

const roleNames: Record<string, string> = {
  student: 'студент',
  teacher: 'преподаватель',
  admin: 'администратор',
}

const identities = computed(() => auth.user?.identities ?? [])
const canUnlink = computed(() => identities.value.length > 1)
const linkedProviders = computed(() => new Set(identities.value.map((item) => item.provider)))

onMounted(() => {
  void progress.load()
  void auth.loadProviders()
})

async function signOut(): Promise<void> {
  signingOut.value = true
  error.value = null
  try {
    await auth.logout()
    progress.reset()
    await router.push({ name: 'home' })
  } catch {
    error.value = 'Не удалось выйти. Попробуйте ещё раз.'
  } finally {
    signingOut.value = false
  }
}

async function signOutEverywhere(): Promise<void> {
  signingOut.value = true
  error.value = null
  try {
    await logoutEverywhere()
    auth.forget()
    progress.reset()
    await router.push({ name: 'home' })
  } catch {
    error.value = 'Не удалось завершить сеансы.'
  } finally {
    signingOut.value = false
  }
}

const unlinked = computed(() => auth.providers.filter((item) => !linkedProviders.value.has(item)))

async function link(provider: IdentityProvider): Promise<void> {
  busy.value = true
  error.value = null
  try {
    const { authorizeUrl } = await linkUrl(provider, '/me')
    window.location.assign(authorizeUrl)
  } catch {
    error.value = 'Не удалось начать привязку.'
    busy.value = false
  }
}

async function unlink(provider: IdentityProvider): Promise<void> {
  busy.value = true
  error.value = null
  try {
    await unlinkIdentity(provider)
    await auth.reload()
  } catch {
    error.value = 'Не удалось отвязать способ входа.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section v-if="auth.user" class="profile">
    <h1 class="heading">профиль</h1>

    <dl class="facts">
      <div class="fact">
        <dt>имя</dt>
        <dd>{{ auth.displayName }}</dd>
      </div>
      <div class="fact">
        <dt>логин</dt>
        <dd>{{ auth.user.login }}</dd>
      </div>
      <div v-if="auth.user.email" class="fact">
        <dt>почта</dt>
        <dd>{{ auth.user.email }}</dd>
      </div>
      <div v-if="auth.user.studentNumber" class="fact">
        <dt>номер студента</dt>
        <dd>{{ auth.user.studentNumber }}</dd>
      </div>
      <div class="fact">
        <dt>роль</dt>
        <dd>{{ roleNames[auth.user.role] ?? auth.user.role }}</dd>
      </div>
      <div class="fact">
        <dt>пройдено уроков</dt>
        <dd>{{ progress.completedCount }}</dd>
      </div>
    </dl>

    <h2 class="subheading">способы входа</h2>
    <ul class="identities">
      <li v-for="identity in identities" :key="identity.provider" class="identity">
        <span class="identity-name">
          {{ providerName(identity.provider) }}
        </span>
        <span v-if="identity.email" class="identity-email">{{ identity.email }}</span>
        <ConfirmButton
          v-if="canUnlink"
          label="отвязать"
          confirm-label="точно отвязать?"
          :loading="busy"
          @confirm="unlink(identity.provider)"
        />
        <span v-else class="identity-note">единственный вход</span>
      </li>
    </ul>

    <div v-if="unlinked.length > 0" class="link-buttons">
      <AppButton
        v-for="provider in unlinked"
        :key="provider"
        variant="secondary"
        size="sm"
        :loading="busy"
        @click="link(provider)"
      >
        привязать {{ providerName(provider) }}
      </AppButton>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="session">
      <AppButton variant="secondary" :loading="signingOut" @click="signOut">выйти</AppButton>
      <ConfirmButton
        label="выйти на всех устройствах"
        confirm-label="точно завершить все сеансы?"
        size="md"
        :loading="signingOut"
        @confirm="signOutEverywhere"
      />
    </div>
  </section>
</template>

<style scoped>
.profile {
  max-width: var(--measure);
}

.heading {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
  margin-bottom: var(--space-8);
}

.subheading {
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
  margin: var(--space-12) 0 var(--space-4);
}

.facts {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.fact {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border);
}

.fact dt {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.identities {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.identity {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3) var(--space-2) var(--space-4);
  background: var(--surface);
  border-radius: var(--radius-ctl);
}

.identity-name {
  font-weight: var(--weight-medium);
  font-size: var(--text-caption);
}

.identity-email,
.identity-note {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.identity-email {
  margin-right: auto;
}

.identity-note {
  margin-left: auto;
}

.link-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);

  margin-top: var(--space-3);
}

.error {
  margin-top: var(--space-3);
  color: var(--danger);
  font-size: var(--text-caption);
}

.session {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-6);
  margin-top: var(--space-12);
  border-top: 1px solid var(--border);
}
</style>
