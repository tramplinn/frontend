<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'
import { computed } from 'vue'

import type { PublicProfile } from '@/api/schemas/users'
import { gradeName, specialtyName } from '@/lib/profile'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ profile: PublicProfile; own?: boolean }>()
const displayName = computed(() => props.profile.name ?? props.profile.login)
const initials = computed(() => displayName.value.slice(0, 2).toUpperCase())
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

    <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>

    <ul v-if="profile.interests.length" class="interests">
      <li v-for="interest in profile.interests" :key="interest.id">{{ interest.name }}</li>
    </ul>

    <a
      v-if="profile.resumeUrl"
      :href="profile.resumeUrl"
      target="_blank"
      rel="noopener"
      class="resume-link"
      >{{ t('profile.resumePdf') }}</a
    >

    <dl class="stats">
      <div>
        <dt>{{ profile.completedLessons }}</dt>
        <dd>{{ t('profile.statLessons') }}</dd>
      </div>
      <div>
        <dt>{{ profile.passedQuizzes }}</dt>
        <dd>{{ t('profile.statQuizzes') }}</dd>
      </div>
      <div>
        <dt>{{ profile.solvedAlgorithms }}</dt>
        <dd>{{ t('profile.statProblems') }}</dd>
      </div>
    </dl>

    <div v-if="profile.activeCourses.length" class="courses">
      <h2>{{ t('profile.learningNow') }}</h2>
      <RouterLink
        v-for="course in profile.activeCourses"
        :key="course.slug"
        :to="{ name: 'course', params: { course: course.slug } }"
        class="course"
      >
        <span class="course-mark" :style="{ background: course.color ?? 'var(--accent)' }"></span>
        <span class="course-title">{{ course.title }}</span>
        <span class="course-progress">{{ course.completedLessons }}/{{ course.totalLessons }}</span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.summary {
  overflow: hidden;
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
.bio {
  max-width: var(--measure);
  padding: var(--space-6) var(--space-8) 0;
  white-space: pre-line;
}
.interests {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-8) 0;
  list-style: none;
}
.interests li {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.resume-link {
  display: inline-flex;
  width: fit-content;
  margin: var(--space-4) var(--space-8) 0;
  color: var(--accent);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}
.resume-link:hover {
  text-decoration: underline;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: var(--space-6) var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
}
.stats div {
  padding: var(--space-4);
  text-align: center;
  border-right: 1px solid var(--border);
}
.stats div:last-child {
  border-right: 0;
}
.stats dt {
  font-size: var(--text-display);
  font-weight: var(--weight-semibold);
}
.stats dd {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.courses {
  padding: 0 var(--space-8) var(--space-8);
}
.courses h2 {
  margin-bottom: var(--space-3);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
}
.course {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}
.course + .course {
  margin-top: var(--space-2);
}
.course:hover {
  background: var(--surface-hover);
}
.course-mark {
  width: var(--space-2);
  height: var(--space-8);
  border-radius: var(--radius-pill);
}
.course-title {
  flex: 1;
  font-weight: var(--weight-medium);
}
.course-progress {
  color: var(--text-muted);
  font-size: var(--text-caption);
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
  .bio,
  .courses {
    padding-inline: var(--space-4);
  }
  .stats {
    margin-inline: var(--space-4);
  }
  .stats div {
    padding-inline: var(--space-2);
  }
  .stats dt {
    font-size: var(--text-title);
  }
}
</style>
