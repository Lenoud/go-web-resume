import { defineConfig } from '@hey-api/openapi-ts'
import { readSwaggerForClient } from './scripts/swagger/openapi-input.mjs'
import { resolveSwaggerProjectPaths } from './scripts/swagger/project-paths.mjs'

const { outputPath: namedSwaggerPath } = resolveSwaggerProjectPaths(import.meta.url)

export default defineConfig({
  input: readSwaggerForClient(namedSwaggerPath),
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
