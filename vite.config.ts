import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  plugins: [
    vue(),
    tailwindcss(),
    // AntDV 组件按需自动注册
    Components({
      resolvers: [AntDesignVueResolver({ importStyle: false })],
      dts: 'src/infrastructure/components.d.ts',
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      // 顺序重要：/api/user 先匹配，走微服务网关
      // '/api/user': { target: 'http://127.0.0.1:9000', changeOrigin: true },
      '/api': { target: 'http://127.0.0.1:9100', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ant-design-vue': ['ant-design-vue', '@ant-design/icons-vue'],
          vue: ['vue', 'vue-router', 'pinia'],
          query: ['@tanstack/vue-query'],
        },
      },
    },
  },
})
