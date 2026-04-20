import { client } from '@/client/client.gen'
import {
  attachRequestInterceptor,
  attachResponseInterceptor,
  attachErrorInterceptor,
} from './interceptors.js'

// 初始化客户端
client.setConfig({ baseUrl: '' })

// 注册拦截器（顺序重要）
attachRequestInterceptor()
attachResponseInterceptor()
attachErrorInterceptor()

// 导出供 main.ts 副作用导入
export { client }
