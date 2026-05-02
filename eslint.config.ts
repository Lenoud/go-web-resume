import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  File: 'readonly',
  FormData: 'readonly',
  URL: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
}

export default tseslint.config(
  // 全局忽略
  { ignores: ['dist/**', 'node_modules/**', 'src/client/**'] },

  // JS 基线
  js.configs.recommended,

  // TS 严格规则
  ...tseslint.configs.strict,

  // Vue 推荐规则
  ...pluginVue.configs['flat/recommended'],

  // Vue 文件解析器
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: browserGlobals,
    },
  },

  // 浏览器端 TS 模块同样允许 DOM 全局变量。
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: browserGlobals,
    },
  },

  // 自定义规则
  {
    files: ['src/**/*.{ts,vue}'],
    rules: {
      // 业务源码禁止显式 any；自动生成的 src/client/** 已在全局忽略中排除。
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-dynamic-delete': 'warn',
      // 未使用变量（下划线前缀除外）
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Vue 规则
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
    },
  },
)
