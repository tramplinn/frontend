import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { onSessionLost } from './api/client'
import { initTheme } from './composables/useTheme'
import { initLocale } from './i18n'
import { queryClient } from './lib/queryClient'
import { clearStaleChunkGuard, reloadOnStaleChunk } from './lib/staleChunk'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import { useProgressStore } from './stores/progress'
import './styles/base.css'

initTheme()
initLocale()

// Ловит провалы динамических import() вне навигации роутера (например, лениво
// подгружаемые модули внутри компонентов) — см. src/lib/staleChunk.ts.
window.addEventListener('vite:preloadError', (event) => {
  reloadOnStaleChunk(event.payload)
})

const pinia = createPinia()
onSessionLost(() => {
  useAuthStore(pinia).forget()
  useProgressStore(pinia).reset()
})

createApp(App).use(pinia).use(VueQueryPlugin, { queryClient }).use(router).mount('#app')
clearStaleChunkGuard()
