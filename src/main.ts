import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app.vue'
import router from './infrastructure/router'
import { installQueryPlugin } from './infrastructure/query/plugin'
import { registerPermissionDirective } from './infrastructure/permission/directive'

// 副作用：初始化 API 客户端拦截器
import '@/infrastructure/api/client'

// AntDV CSS（全量导入，按需导入由 unplugin-vue-components 处理组件）
import 'ant-design-vue/dist/reset.css'

// Tailwind CSS v4 入口
import './styles.css'

const app = createApp(App)

// 注册顺序：Pinia → Query → Router → Directive
const pinia = createPinia()
app.use(pinia)

installQueryPlugin(app)
registerPermissionDirective(app)

app.use(router)
app.mount('#app')
