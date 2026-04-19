import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  client: '@hey-api/client-axios',
  input: '../api/doc/swagger/swagger.json',
  output: 'src/client',
  plugins: [
    '@hey-api/schemas',
    '@hey-api/sdk',
    {
      name: '@hey-api/transformers',
      type: 'createOnly',
    },
  ],
})
