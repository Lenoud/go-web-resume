import type { App } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,         // 30s 内不重新请求
      gcTime: 5 * 60_000,       // 5min 缓存保留
      retry: 1,                  // 仅重试一次
      refetchOnWindowFocus: false,
      throwOnError: false,       // 不抛到全局，由组件处理
    },
    mutations: {
      throwOnError: false,
    },
  },
})

export function installQueryPlugin(app: App) {
  app.use(VueQueryPlugin, { queryClient })
}

export { queryClient }
