<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'
import { computed } from 'vue'

import type { ProfileBlock } from '@/api/schemas/projects'
import type { PublicProfile } from '@/api/schemas/users'
import ProfileAboutBlock from '@/components/profile/blocks/ProfileAboutBlock.vue'
import ProfileCoursesBlock from '@/components/profile/blocks/ProfileCoursesBlock.vue'
import ProfileProjectsBlock from '@/components/profile/blocks/ProfileProjectsBlock.vue'
import ProfileResumeBlock from '@/components/profile/blocks/ProfileResumeBlock.vue'
import ProfileStatsBlock from '@/components/profile/blocks/ProfileStatsBlock.vue'
import { gradeName, specialtyName } from '@/lib/profile'
import { profileBlocksToRender } from '@/lib/profileLayout'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ profile: PublicProfile; own?: boolean }>()
const displayName = computed(() => props.profile.name ?? props.profile.login)
const initials = computed(() => displayName.value.slice(0, 2).toUpperCase())
const blocks = computed(() => profileBlocksToRender(props.profile))

const BLOCK_COMPONENTS = {
  about: ProfileAboutBlock,
  projects: ProfileProjectsBlock,
  stats: ProfileStatsBlock,
  courses: ProfileCoursesBlock,
  resume: ProfileResumeBlock,
} satisfies Record<ProfileBlock, unknown>
</script>

<template>
  <section class="summary">
    <div class="hero">
      <AvatarRoot class="avatar">
        <AvatarImage
          v-if="profile.avatarUrl"
          :src="profile.avatarUrl"
          :alt="displayName"
          class="avatar-image"
        />
        <AvatarFallback class="avatar-fallback">{{ initials }}</AvatarFallback>
      </AvatarRoot>
      <div class="identity">
        <div class="eyebrow">{{ own ? t('profile.mine') : `@${profile.login}` }}</div>
        <h1>{{ displayName }}</h1>
        <p class="headline">{{ profile.headline ?? t('profile.defaultHeadline') }}</p>
        <div class="chips">
          <span v-if="specialtyName(profile.specialty)">{{
            specialtyName(profile.specialty)
          }}</span>
          <span v-if="gradeName(profile.grade)">{{ gradeName(profile.grade) }}</span>
          <span v-if="profile.experienceYears !== null">
            {{ t('profile.experience', { years: profile.experienceYears }) }}
          </span>
          <span v-if="profile.company">{{ profile.company.name }}</span>
          <span v-if="profile.university">{{ profile.university.name }}</span>
        </div>
      </div>
    </div>

    <div v-for="block in blocks" :key="block" class="block" :class="`block--${block}`">
      <component :is="BLOCK_COMPONENTS[block]" :profile="profile" />
    </div>
  </section>
</template>

<style scoped>
.summary {
  overflow: hidden;
  padding-bottom: var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}

.hero {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-8);
  background: linear-gradient(135deg, var(--accent-soft), var(--card) 70%);
}

.avatar {
  display: block;
  flex: 0 0 auto;
  width: 104px;
  height: 104px;
  overflow: hidden;
  border: 4px solid var(--card);
  border-radius: var(--radius-pill);
  background: var(--surface);
  box-shadow: var(--shadow-raised);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-fallback {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--accent);
  font-size: var(--text-display);
  font-weight: var(--weight-semibold);
}
.identity {
  min-width: 0;
}
.eyebrow {
  color: var(--accent);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}
h1 {
  margin-top: var(--space-1);
  font-size: var(--text-display);
  line-height: 1.15;
  letter-spacing: -0.03em;
}
.headline {
  margin-top: var(--space-2);
  color: var(--text-muted);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
.chips span {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.block {
  padding: var(--space-6) var(--space-8) 0;
}

@media (max-width: 620px) {
  .hero {
    align-items: center;
    padding: var(--space-6);
  }
  .avatar {
    width: 72px;
    height: 72px;
  }
  .block {
    padding-inline: var(--space-4);
  }
}
</style>
