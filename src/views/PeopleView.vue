<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { searchPeople } from '@/api/users'
import type { PublicUser } from '@/api/schemas/users'
import AppButton from '@/components/ui/AppButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { gradeName, specialtyName } from '@/lib/profile'

const query = ref('')
const people = ref<PublicUser[]>([])
const total = ref(0)
const pending = ref(true)
const error = ref<unknown>(null)

async function search(): Promise<void> {
  pending.value = true
  error.value = null
  try {
    const page = await searchPeople(query.value.trim())
    people.value = page.items
    total.value = page.total
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
}

onMounted(() => void search())

function subtitle(person: PublicUser): string {
  const role = [specialtyName(person.specialty), gradeName(person.grade)]
    .filter(Boolean)
    .join(' · ')
  return person.headline ?? (role || 'учится и развивается')
}
</script>

<template>
  <section class="people">
    <header class="head">
      <div>
        <h1>люди</h1>
      </div>
      <p>{{ total }} профилей</p>
    </header>
    <form class="search" @submit.prevent="search">
      <input
        v-model="query"
        class="text-field"
        type="search"
        placeholder="имя, логин или направление"
      />
      <AppButton type="submit" size="sm" variant="primary">найти</AppButton>
    </form>
    <LoadState :pending="pending" :error="error">
      <p v-if="people.length === 0" class="empty">никого не нашлось</p>
      <div v-else class="grid">
        <RouterLink
          v-for="person in people"
          :key="person.id"
          :to="{ name: 'user-profile', params: { login: person.login } }"
          class="person"
        >
          <img v-if="person.avatarUrl" :src="person.avatarUrl" :alt="person.name ?? person.login" />
          <span v-else class="fallback">{{
            (person.name ?? person.login).slice(0, 1).toUpperCase()
          }}</span>
          <span class="person-copy"
            ><strong>{{ person.name ?? person.login }}</strong
            ><small>@{{ person.login }}</small
            ><span>{{ subtitle(person) }}</span></span
          >
          <span class="arrow" aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </LoadState>
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
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}
.search input {
  width: min(440px, 100%);
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
  color: var(--text-muted);
}
.empty {
  color: var(--text-muted);
}
@media (max-width: 680px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .head > p {
    display: none;
  }
}
</style>
