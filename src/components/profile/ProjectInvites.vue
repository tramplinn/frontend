<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ProjectLogo from '@/components/projects/ProjectLogo.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useI18n } from '@/i18n'
import { errorText } from '@/lib/errors'
import { roleLabel } from '@/lib/projects'
import { useProjectInvitesStore } from '@/stores/projectInvites'

const { t, d } = useI18n()
const invites = useProjectInvitesStore()
const router = useRouter()
const error = ref<string | null>(null)
const emit = defineEmits<{ changed: [] }>()

async function accept(inviteId: string, slug: string): Promise<void> {
  error.value = null
  try {
    await invites.accept(inviteId)
    emit('changed')
    await router.push({ name: 'project', params: { slug } })
  } catch (cause) {
    error.value = errorText(cause)
  }
}

async function decline(inviteId: string): Promise<void> {
  error.value = null
  try {
    await invites.decline(inviteId)
  } catch (cause) {
    error.value = errorText(cause)
  }
}

onMounted(() => void invites.load().catch((cause: unknown) => (error.value = errorText(cause))))
</script>

<template>
  <section v-if="invites.items.length || error" class="invites" :aria-label="t('invites.heading')">
    <h2>{{ t('invites.heading') }}</h2>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <article v-for="invite in invites.items" :key="invite.id" class="invite">
      <ProjectLogo :title="invite.project.title" :url="invite.project.logoUrl" :size="40" />
      <div class="copy">
        <strong>{{ invite.project.title }}</strong>
        <small>{{
          t('invites.from', {
            inviter: invite.inviterLogin ? `@${invite.inviterLogin}` : '—',
            role: roleLabel(invite.role),
            date: d(invite.expiresAt, { dateStyle: 'medium' }),
          })
        }}</small>
      </div>
      <AppButton
        size="sm"
        variant="primary"
        :loading="invites.busyId === invite.id"
        @click="accept(invite.id, invite.project.slug)"
        >{{ t('invites.accept') }}</AppButton
      >
      <AppButton
        size="sm"
        variant="quiet"
        :disabled="invites.busyId === invite.id"
        @click="decline(invite.id)"
        >{{ t('invites.decline') }}</AppButton
      >
    </article>
  </section>
</template>

<style scoped>
.invites {
  display: grid;
  gap: var(--space-2);
}
h2 {
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}
.invite {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--accent);
  border-radius: var(--radius-card);
  background: var(--accent-soft);
}
.copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
.copy small {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.error {
  color: var(--danger);
  font-size: var(--text-caption);
}
@media (max-width: 520px) {
  .invite {
    flex-wrap: wrap;
  }
}
</style>
