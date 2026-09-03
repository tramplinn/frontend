<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import CourseCard from '@/components/course/CourseCard.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useContentStore } from '@/stores/content'

const content = useContentStore()
const route = useRoute()
const pending = ref(true)
const error = ref<unknown>(null)
const active = ref('')

function requested(): string {
  const value = route.query.track
  return typeof value === 'string' ? value : ''
}

onMounted(async () => {
  try {
    const tracks = await content.loadTracks()
    const wanted = requested()
    active.value = tracks.find((track) => track.slug === wanted)?.slug ?? tracks[0]?.slug ?? ''
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
})

watch(
  () => route.query.track,
  () => {
    const wanted = requested()
    if (content.tracks.some((track) => track.slug === wanted)) {
      active.value = wanted
    }
  },
)
</script>

<template>
  <section>
    <h1 class="heading">курсы</h1>

    <LoadState :pending="pending" :error="error">
      <p v-if="content.tracks.length === 0" class="empty">пока ничего не опубликовано</p>

      <TabsRoot v-else v-model="active">
        <TabsList class="tabs" aria-label="Треки">
          <TabsTrigger
            v-for="track in content.tracks"
            :key="track.id"
            :value="track.slug"
            class="tab"
          >
            {{ track.title.toLowerCase() }}
          </TabsTrigger>
        </TabsList>

        <TabsContent v-for="track in content.tracks" :key="track.id" :value="track.slug">
          <p v-if="track.description" class="track-description">{{ track.description }}</p>
          <p v-if="track.courses.length === 0" class="empty">в треке пока нет курсов</p>
          <div v-else class="grid">
            <CourseCard v-for="link in track.courses" :key="link.course.id" :course="link.course" />
          </div>
        </TabsContent>
      </TabsRoot>
    </LoadState>
  </section>
</template>

<style scoped>
.heading {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
  margin-bottom: var(--space-6);
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
}

.tab {
  height: var(--ctl-sm);
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.tab:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.tab[data-state='active'] {
  background: var(--selected);
  color: var(--on-selected);
}

.track-description {
  max-width: var(--measure);
  color: var(--text-muted);
  margin-bottom: var(--space-6);
}

.grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 1120px;
}

.empty {
  padding: var(--space-12) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}
</style>
