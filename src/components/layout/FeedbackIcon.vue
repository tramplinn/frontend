<template>
  <svg class="feedback-icon" viewBox="0 0 20 20" aria-hidden="true">
    <path class="bubble" d="M3 3.2h14v10.5H9l-4.2 3v-3H3z" />
    <rect class="line" x="5.5" y="6" width="7.8" height="1.8" rx="0.9" />
    <rect class="detail" x="5.5" y="9.3" width="5.2" height="1.8" rx="0.9" />
    <circle class="spark" cx="15.7" cy="4.3" r="2.1" />
  </svg>
</template>

<style scoped>
.feedback-icon {
  display: block;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
}

.bubble {
  fill: var(--icon-purple-soft);
}

.line {
  fill: var(--icon-purple);
}

.detail {
  fill: var(--icon-cyan);
}

.spark {
  fill: var(--warning);
}
</style>
