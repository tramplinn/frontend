<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronRight } from '@lucide/vue'

import { searchPeople } from '@/api/users'
import type { PublicUser } from '@/api/schemas/users'
import SignInGate from '@/components/layout/SignInGate.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useVersionedLoad } from '@/composables/useVersionedLoad'
import { gradeName, specialtyName } from '@/lib/profile'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'

const { t, tc } = useI18n()
const auth = useAuthStore()

const SEARCH_DEBOUNCE_MS = 250

const query = ref('')
const people = ref<PublicUser[]>([])
const total = ref(0)
const pending = ref(true)
const error = ref<unknown>(null)

// Ответ на «a.m» может прийти позже ответа на «a.mo» — показываем только последний.
const searchGuard = useVersionedLoad()

async function search(): Promise<void> {
  if (!auth.isAuthenticated) return
  const version = searchGuard.start()
  pending.value = true
  error.value = null
  try {
    const page = await searchPeople(query.value.trim())
    if (!searchGuard.isCurrent(version)) return
    people.value = page.items
    total.value = page.total
  } catch (cause) {
    if (searchGuard.isCurrent(version)) error.value = cause
  } finally {
    if (searchGuard.isCurrent(version)) pending.value = false
  }
}

let debounce: ReturnType<typeof setTimeout> | undefined

watch(query, () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => void search(), SEARCH_DEBOUNCE_MS)
})

onMounted(() => void search())
// Вход по коду проходит без перезагрузки — сразу показываем список.
watch(
  () => auth.isAuthenticated,
  () => void search(),
)
onUnmounted(() => {
  clearTimeout(debounce)
})

function subtitle(person: PublicUser): string {
  const role = [specialtyName(person.specialty), gradeName(person.grade)]
    .filter(Boolean)
    .join(' · ')
  return person.headline ?? (role || t('people.defaultSubtitle'))
}
</script>

<template>
  <section class="people">
    <header class="head">
      <div>
        <h1>{{ t('people.heading') }}</h1>
      </div>
      <p v-if="auth.isAuthenticated && !pending && !error">{{ tc('units.profiles', total) }}</p>
    </header>
    <SignInGate
      v-if="!auth.isAuthenticated"
      :title="t('people.gateTitle')"
      :text="t('people.gateText')"
    />
    <template v-else>
      <input
        v-model="query"
        class="text-field search"
        type="search"
        :placeholder="t('people.search')"
      />
      <LoadState :pending="pending" :error="error" @retry="search">
        <p v-if="people.length === 0" class="empty">{{ t('people.empty') }}</p>
        <div v-else class="grid">
          <RouterLink
            v-for="person in people"
            :key="person.id"
            :to="{ name: 'user-profile', params: { login: person.login } }"
            class="person"
          >
            <img
              v-if="person.avatarUrl"
              :src="person.avatarUrl"
              :alt="person.name ?? person.login"
            />
            <span v-else class="fallback">{{
              (person.name ?? person.login).slice(0, 1).toUpperCase()
            }}</span>
            <span class="person-copy"
              ><strong>{{ person.name ?? person.login }}</strong
              ><small>@{{ person.login }}</small
              ><span>{{ subtitle(person) }}</span></span
            >
            <ChevronRight class="arrow" :size="18" aria-hidden="true" />
          </RouterLink>
        </div>
      </LoadState>
    </template>
  </section>
</template>

<style scoped>
.people {
  max-width: 1000px;
}
.head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.head h1 {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}
.head > p {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.search {
  width: min(440px, 100%);
  margin-bottom: var(--space-6);
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.person {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}
.person:hover {
  background: var(--card-hover);
  transform: translateY(-1px);
}
.person img,
.fallback {
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
}
.person img {
  object-fit: cover;
}
.fallback {
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: var(--weight-semibold);
}
.person-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
.person-copy strong,
.person-copy small,
.person-copy > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.person-copy small,
.person-copy > span {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.arrow {
  flex-shrink: 0;
  color: var(--text-muted);
}
.empty {
  color: var(--text-muted);
}
@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .head > p {
    display: none;
  }
}
</style>
