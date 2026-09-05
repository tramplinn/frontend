<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { linkUrl, logoutEverywhere, unlinkIdentity } from '@/api/auth'
import type { IdentityProvider } from '@/api/schemas/common'
import type { DeveloperGrade, PublicProfile, Specialty } from '@/api/schemas/users'
import { getPublicProfile } from '@/api/users'
import ProfileSummary from '@/components/profile/ProfileSummary.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import { errorText } from '@/lib/errors'
import { blankToNull } from '@/lib/forms'
import { GRADES, SPECIALTIES } from '@/lib/profile'
import { providerName } from '@/lib/providers'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'

const auth = useAuthStore()
const progress = useProgressStore()
const router = useRouter()
const publicProfile = ref<PublicProfile | null>(null)
const name = ref(auth.user?.name ?? '')
const headline = ref(auth.user?.headline ?? '')
const bio = ref(auth.user?.bio ?? '')
const specialty = ref<Specialty | ''>(auth.user?.specialty ?? '')
const grade = ref<DeveloperGrade | ''>(auth.user?.grade ?? '')
const experienceYears = ref<number | null>(auth.user?.experienceYears ?? null)
const saving = ref(false)
const signingOut = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)

const specialtyOptions = [{ value: '', label: 'не выбрано' }, ...SPECIALTIES]
const gradeOptions = [{ value: '', label: 'не выбрано' }, ...GRADES]

const identities = computed(() => auth.user?.identities ?? [])
const canUnlink = computed(() => identities.value.length > 1)
const linkedProviders = computed(() => new Set(identities.value.map((item) => item.provider)))
const unlinked = computed(() => auth.providers.filter((item) => !linkedProviders.value.has(item)))

async function loadPublicProfile(): Promise<void> {
  if (auth.user) publicProfile.value = await getPublicProfile(auth.user.login)
}

onMounted(() => {
  void loadPublicProfile().catch((cause: unknown) => (error.value = errorText(cause)))
  void auth.loadProviders()
})

async function saveProfile(): Promise<void> {
  saving.value = true
  error.value = null
  try {
    await auth.updateProfile({
      name: blankToNull(name.value),
      headline: blankToNull(headline.value),
      bio: blankToNull(bio.value),
      specialty: specialty.value || null,
      grade: grade.value || null,
      experienceYears: experienceYears.value,
    })
    await loadPublicProfile()
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    saving.value = false
  }
}

async function signOut(all = false): Promise<void> {
  signingOut.value = true
  error.value = null
  try {
    if (all) {
      await logoutEverywhere()
      auth.forget()
    } else {
      await auth.logout()
    }
    progress.reset()
    await router.push({ name: 'home' })
  } catch {
    error.value = all ? 'Не удалось завершить сеансы.' : 'Не удалось выйти. Попробуйте ещё раз.'
  } finally {
    signingOut.value = false
  }
}

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
    <ProfileSummary v-if="publicProfile" :profile="publicProfile" own />
    <div class="columns">
      <form class="card editor" @submit.prevent="saveProfile">
        <header>
          <p>публично</p>
          <h2>о себе</h2>
        </header>
        <label><span>имя</span><input v-model="name" class="text-field" maxlength="200" /></label>
        <label
          ><span>коротко о себе</span
          ><input
            v-model="headline"
            class="text-field"
            maxlength="120"
            placeholder="Что делаете и куда растёте"
        /></label>
        <div class="pair">
          <label
            ><span>направление</span
            ><AppSelect v-model="specialty" :options="specialtyOptions" label="Направление"
          /></label>
          <label
            ><span>грейд</span><AppSelect v-model="grade" :options="gradeOptions" label="Грейд"
          /></label>
        </div>
        <label
          ><span>опыт, лет</span
          ><input
            v-model.number="experienceYears"
            class="text-field years"
            type="number"
            min="0"
            max="80"
        /></label>
        <label
          ><span>подробнее</span
          ><textarea
            v-model="bio"
            class="text-field"
            rows="5"
            maxlength="1000"
            placeholder="Интересы, стек, цели"
          ></textarea>
        </label>
        <AppButton type="submit" variant="primary" :loading="saving">сохранить профиль</AppButton>
      </form>

      <section class="card account">
        <header>
          <p>приватно</p>
          <h2>аккаунт</h2>
        </header>
        <dl class="facts">
          <div>
            <dt>логин</dt>
            <dd>{{ auth.user.login }}</dd>
          </div>
          <div v-if="auth.user.email">
            <dt>почта</dt>
            <dd>{{ auth.user.email }}</dd>
          </div>
          <div v-if="auth.user.studentNumber">
            <dt>номер студента</dt>
            <dd>{{ auth.user.studentNumber }}</dd>
          </div>
        </dl>
        <h3>способы входа</h3>
        <ul class="identities">
          <li v-for="identity in identities" :key="identity.provider">
            <span
              ><strong>{{ providerName(identity.provider) }}</strong
              ><small v-if="identity.email">{{ identity.email }}</small></span
            >
            <ConfirmButton
              v-if="canUnlink"
              label="отвязать"
              confirm-label="точно отвязать?"
              :loading="busy"
              @confirm="unlink(identity.provider)"
            />
            <small v-else>единственный вход</small>
          </li>
        </ul>
        <div v-if="unlinked.length" class="links">
          <AppButton
            v-for="provider in unlinked"
            :key="provider"
            size="sm"
            :loading="busy"
            @click="link(provider)"
            >привязать {{ providerName(provider) }}</AppButton
          >
        </div>
        <div class="sessions">
          <AppButton :loading="signingOut" @click="signOut(false)">выйти</AppButton>
          <ConfirmButton
            label="выйти везде"
            confirm-label="завершить все сеансы?"
            size="md"
            :loading="signingOut"
            @confirm="signOut(true)"
          />
        </div>
      </section>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.profile {
  display: grid;
  gap: var(--space-6);
  max-width: 1100px;
}
.columns {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
  gap: var(--space-6);
  align-items: start;
}
.card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}
header {
  margin-bottom: var(--space-6);
}
header p {
  color: var(--accent);
  font-size: var(--text-caption);
}
header h2 {
  font-size: var(--text-title);
}
.editor {
  display: grid;
  gap: var(--space-4);
}
.editor label {
  display: grid;
  gap: var(--space-2);
}
.editor label > span,
.facts dt {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.editor textarea.text-field {
  height: auto;
  padding-block: var(--space-3);
  resize: vertical;
}
.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.years {
  width: 120px;
}
.facts {
  display: grid;
  gap: var(--space-3);
}
.facts div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border);
}
.facts dd {
  text-align: right;
  overflow-wrap: anywhere;
}
.account h3 {
  margin: var(--space-8) 0 var(--space-3);
  font-size: var(--text-caption);
  color: var(--text-muted);
  font-weight: var(--weight-medium);
}
.identities {
  display: grid;
  gap: var(--space-2);
  list-style: none;
}
.identities li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}
.identities li > span {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.identities small {
  color: var(--text-muted);
  font-size: var(--text-caption);
  overflow: hidden;
  text-overflow: ellipsis;
}
.links,
.sessions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
.sessions {
  padding-top: var(--space-6);
  margin-top: var(--space-8);
  border-top: 1px solid var(--border);
}
.error {
  color: var(--danger);
  font-size: var(--text-caption);
}
@media (max-width: 820px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 520px) {
  .card {
    padding: var(--space-4);
  }
  .pair {
    grid-template-columns: 1fr;
  }
}
</style>
