import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function findCanonicalWebDir(startDir) {
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

export function resolveSwaggerProjectPaths(fromUrl) {
  const sourceDir = path.dirname(fileURLToPath(fromUrl))
  const webDir = findCanonicalWebDir(sourceDir)
  const apiDir = path.resolve(webDir, '../api')

  return {
    apiDir,
    jobApiPath: path.resolve(apiDir, 'job.api'),
    swaggerPath: path.resolve(apiDir, 'doc/swagger/swagger.json'),
    outputPath: path.resolve(apiDir, 'doc/swagger/swagger.named.json'),
    webDir,
  }
}
