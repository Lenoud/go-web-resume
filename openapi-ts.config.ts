import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from '@hey-api/openapi-ts'

function findCanonicalWebDir(startDir: string): string {
  let currentDir = startDir

  while (true) {
    const candidateApiPath = path.resolve(currentDir, '../api/job.api')
    if (path.basename(currentDir) === 'web' && existsSync(candidateApiPath)) {
      return currentDir
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      throw new Error(`Unable to resolve the canonical web directory from "${startDir}"`)
    }

    currentDir = parentDir
  }
}

const configDir = path.dirname(fileURLToPath(import.meta.url))
const webDir = findCanonicalWebDir(configDir)
const namedSwaggerPath = path.resolve(webDir, '../api/doc/swagger/swagger.named.json')

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
