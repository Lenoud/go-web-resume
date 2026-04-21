import path from 'node:path'

import { defineConfig } from '@hey-api/openapi-ts'
import { resolveSwaggerProjectPaths } from './scripts/swagger/project-paths.mjs'

const { outputPath: namedSwaggerPath } = resolveSwaggerProjectPaths(import.meta.url)

export default defineConfig({
  input: namedSwaggerPath,
  output: 'src/client',
  plugins: [
    {
      name: '@hey-api/client-axios',
    },
    '@hey-api/schemas',
    '@hey-api/sdk',
    {
      name: '@hey-api/transformers',
      type: 'createOnly',
    },
  ],
})
