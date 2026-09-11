import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { initTheme } from './composables/useTheme'
import { clearStaleChunkGuard, reloadOnStaleChunk } from './lib/staleChunk'
import { router } from './router'
import './styles/base.css'

initTheme()

// Ловит провалы динамических import() вне навигации роутера (например, лениво
// подгружаемые модули внутри компонентов) — см. src/lib/staleChunk.ts.
window.addEventListener('vite:preloadError', (event) => {
  reloadOnStaleChunk((event as CustomEvent<Error>).detail)
})

createApp(App).use(createPinia()).use(router).mount('#app')
clearStaleChunkGuard()
