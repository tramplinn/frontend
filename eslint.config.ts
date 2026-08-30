import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  defineConfig([
    { ignores: ['dist/**', 'node_modules/**'] },
    js.configs.recommended,
    vue.configs['flat/recommended'],
    {
      files: ['**/*.{ts,vue}'],
      languageOptions: {
        globals: { ...globals.browser },
      },
    },
    {
      files: ['*.config.ts'],
      languageOptions: {
        globals: { ...globals.node },
      },
    },
    {
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
        'vue/component-api-style': ['error', ['script-setup']],
        'vue/multi-word-component-names': 'off',
        'no-console': ['error', { allow: ['warn', 'error'] }],
      },
    },
  ]),
  vueTsConfigs.strictTypeChecked,
  prettier,
)
