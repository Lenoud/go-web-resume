import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

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
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
      },
    },
  },

  // 自定义规则
  {
    files: ['src/**/*.{ts,vue}'],
    rules: {
      // 禁止 any
      '@typescript-eslint/no-explicit-any': 'error',
      // 未使用变量（下划线前缀除外）
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Vue 规则
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'error',
    },
  },
)
