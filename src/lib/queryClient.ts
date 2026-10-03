import { QueryClient } from '@tanstack/vue-query'

/** Единый кеш серверных данных. Экспортируется как синглтон, чтобы сторы и код
    вне компонентов (выход из аккаунта, мутации) могли инвалидировать запросы. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
