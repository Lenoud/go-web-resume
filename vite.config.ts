import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'

const isMicro = process.env.VITE_MICRO === '1'

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
    proxy: isMicro
      ? {
          // 混合模式：微服务路由走网关 9000，其余走单体 9100
          '/api/user': { target: 'http://127.0.0.1:9000', changeOrigin: true },
          '/api/department': { target: 'http://127.0.0.1:9000', changeOrigin: true },
          '/api/opLog': { target: 'http://127.0.0.1:9000', changeOrigin: true },
          '/api': { target: 'http://127.0.0.1:9100', changeOrigin: true },
        }
      : {
          // 单体模式：全走 9100
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
