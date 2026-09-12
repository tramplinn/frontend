<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { logoutEverywhere } from '@/api/auth'
import type { PublicProfile } from '@/api/schemas/users'
import { getPublicProfile } from '@/api/users'
import ProfileSummary from '@/components/profile/ProfileSummary.vue'
import ResumeField from '@/components/profile/ResumeField.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ComboInput from '@/components/ui/ComboInput.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import OtpInput from '@/components/ui/OtpInput.vue'
import TagPicker from '@/components/ui/TagPicker.vue'
import { useIdentityLinking } from '@/composables/useIdentityLinking'
import { useProfileForm } from '@/composables/useProfileForm'
import { errorText } from '@/lib/errors'
import { GRADES, SPECIALTIES } from '@/lib/profile'
import { providerName } from '@/lib/providers'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'

const auth = useAuthStore()
const progress = useProgressStore()
const router = useRouter()
const publicProfile = ref<PublicProfile | null>(null)
const signingOut = ref(false)
const error = ref<string | null>(null)

const specialtyOptions = [{ value: '', label: 'не выбрано' }, ...SPECIALTIES]
const gradeOptions = [{ value: '', label: 'не выбрано' }, ...GRADES]

async function loadPublicProfile(): Promise<void> {
  if (auth.user) publicProfile.value = await getPublicProfile(auth.user.login)
}

const form = useProfileForm(loadPublicProfile)
const identity = useIdentityLinking()

onMounted(() => {
  void loadPublicProfile().catch((cause: unknown) => (error.value = errorText(cause)))
  void auth.loadProviders()
})

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
</script>

<template>
  <section v-if="auth.user" class="profile">
    <ProfileSummary v-if="publicProfile" :profile="publicProfile" own />
    <p v-else-if="error" class="summary-error" role="alert">{{ error }}</p>
    <div class="columns">
      <form class="card editor" @submit.prevent="form.save">
        <header>
          <p>публично</p>
          <h2>о себе</h2>
        </header>
        <label
          ><span>имя</span><input v-model="form.name" class="text-field" maxlength="200"
        /></label>
        <label
          ><span>коротко о себе</span
          ><input
            v-model="form.headline"
            class="text-field"
            maxlength="120"
            placeholder="Что делаете и куда растёте"
        /></label>
        <div class="pair">
          <label
            ><span>направление</span
            ><AppSelect v-model="form.specialty" :options="specialtyOptions" label="Направление"
          /></label>
          <label
            ><span>грейд</span
            ><AppSelect v-model="form.grade" :options="gradeOptions" label="Грейд"
          /></label>
        </div>
        <div class="triple">
          <label
            ><span>опыт, лет</span
            ><input
              v-model.number="form.experienceYears"
              class="text-field"
              type="number"
              min="0"
              max="80"
          /></label>
          <label
            ><span>компания</span
            ><ComboInput
              v-model="form.company"
              :suggestions="form.companySuggestions"
              placeholder="где работаете"
          /></label>
          <label
            ><span>вуз</span
            ><ComboInput
              v-model="form.university"
              :suggestions="form.universitySuggestions"
              placeholder="где учитесь"
          /></label>
        </div>
        <label
          ><span>интересы</span
          ><TagPicker
            v-model="form.interests"
            :suggestions="form.interestSuggestions"
            placeholder="добавить интерес"
          /><small class="hint">Enter или запятая — добавить</small></label
        >
        <ResumeField v-model:asset-id="form.resumeAssetId" v-model:url="form.resumeUrl" />
        <label
          ><span>подробнее</span
          ><textarea
            v-model="form.bio"
            class="text-field"
            rows="5"
            maxlength="1000"
            placeholder="Стек, цели"
          ></textarea>
        </label>
        <AppButton type="submit" variant="primary" :loading="form.saving"
          >сохранить профиль</AppButton
        >
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
          <li v-for="item in identity.identities" :key="item.provider">
            <span
              ><strong>{{ providerName(item.provider) }}</strong
              ><small v-if="item.email">{{ item.email }}</small></span
            >
            <ConfirmButton
              v-if="identity.canUnlink"
              label="отвязать"
              confirm-label="точно отвязать?"
              :loading="identity.busyAction === `unlink:${item.provider}`"
              :disabled="identity.anyBusy && identity.busyAction !== `unlink:${item.provider}`"
              @confirm="identity.unlink(item.provider)"
            />
            <small v-else>единственный вход</small>
          </li>
        </ul>
        <div v-if="identity.unlinked.length || !identity.emailLinked" class="links">
          <AppButton
            v-for="provider in identity.unlinked"
            :key="provider"
            size="sm"
            :loading="identity.busyAction === `link:${provider}`"
            :disabled="identity.anyBusy && identity.busyAction !== `link:${provider}`"
            @click="identity.link(provider)"
            >привязать {{ providerName(provider) }}</AppButton
          >
          <AppButton
            v-if="!identity.emailLinked && identity.emailLinkStep === 'idle'"
            size="sm"
            :disabled="identity.anyBusy"
            @click="identity.startEmailLink"
            >привязать почту</AppButton
          >
        </div>

        <form
          v-if="identity.emailLinkStep === 'request'"
          class="email-link-form"
          @submit.prevent="identity.sendEmailLinkCode"
        >
          <input
            v-model="identity.linkEmail"
            type="email"
            class="text-field"
            placeholder="почта"
            autocomplete="email"
            required
          />
          <AppButton
            type="submit"
            size="sm"
            variant="primary"
            :loading="identity.busyAction === 'email-request'"
            >получить код</AppButton
          >
          <AppButton
            type="button"
            size="sm"
            :disabled="identity.anyBusy"
            @click="identity.cancelEmailLink"
            >отмена</AppButton
          >
        </form>

        <form
          v-else-if="identity.emailLinkStep === 'code'"
          class="email-link-form"
          @submit.prevent="identity.confirmEmailLink"
        >
          <p class="hint">код отправлен на {{ identity.linkEmail }}</p>
          <OtpInput
            v-model="identity.linkCode"
            autofocus
            :disabled="identity.anyBusy"
            @complete="identity.confirmEmailLink"
          />
          <AppButton
            type="submit"
            size="sm"
            variant="primary"
            :loading="identity.busyAction === 'email-confirm'"
            >привязать</AppButton
          >
          <AppButton
            type="button"
            size="sm"
            :disabled="identity.anyBusy"
            @click="identity.cancelEmailLink"
            >отмена</AppButton
          >
        </form>
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
    <p v-if="form.error || identity.error" class="error" role="alert">
      {{ form.error || identity.error }}
    </p>
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
.triple {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-3);
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
.email-link-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
.email-link-form .text-field {
  flex: 1;
  min-width: 160px;
}
.hint {
  width: 100%;
  color: var(--text-muted);
  font-size: var(--text-caption);
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
.summary-error {
  color: var(--danger);
  font-size: var(--text-caption);
}
@media (max-width: 800px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 520px) {
  .card {
    padding: var(--space-4);
  }
  .pair,
  .triple {
    grid-template-columns: 1fr;
  }
}
</style>
