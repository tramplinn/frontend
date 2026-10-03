<script setup lang="ts">
import { BookOpen, Code, Globe, Link, Palette, Presentation, Video } from '@lucide/vue'
import { computed } from 'vue'

import type { ProjectLinkKind } from '@/api/schemas/projects'
import ProviderIcon from '@/components/layout/ProviderIcon.vue'
import { repositoryHost } from '@/lib/projects'

const props = defineProps<{ kind: ProjectLinkKind; url: string }>()

const ICONS = {
  repository: Code,
  demo: Globe,
  docs: BookOpen,
  design: Palette,
  video: Video,
  presentation: Presentation,
  other: Link,
} satisfies Record<ProjectLinkKind, unknown>

/** Для репозитория иконка по хосту: GitHub и GitLab узнаваемее общего «кода». */
const host = computed(() => (props.kind === 'repository' ? repositoryHost(props.url) : 'other'))
</script>

<template>
  <ProviderIcon v-if="host !== 'other'" :provider="host" />
  <component :is="ICONS[kind]" v-else :size="16" aria-hidden="true" />
</template>
