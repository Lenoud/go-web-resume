import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseJobApi } from './parse-job-api.mjs'
import { dereferenceSchema, rewriteSwaggerDoc } from './rewrite-swagger.mjs'

const SWAGGER_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'head', 'options'])

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function findCanonicalWebDir(startDir) {
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

function resolveProjectPaths() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const webDir = findCanonicalWebDir(scriptDir)
  const apiDir = path.resolve(webDir, '../api')

  return {
    apiDir,
    jobApiPath: path.resolve(apiDir, 'job.api'),
    swaggerPath: path.resolve(apiDir, 'doc/swagger/swagger.json'),
    outputPath: path.resolve(apiDir, 'doc/swagger/swagger.named.json'),
    webDir,
  }
}

function normalizeSource(source) {
  return source.replace(/\r\n?/g, '\n')
}

function stripComments(source) {
  let result = ''
  let inBlockComment = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false
        index += 1
      } else if (char === '\n') {
        result += '\n'
      }
      continue
    }

    if (char === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') {
        index += 1
      }
      if (source[index] === '\n') {
        result += '\n'
      }
      continue
    }

    if (char === '/' && next === '*') {
      inBlockComment = true
      index += 1
      continue
    }

    result += char
  }

  return result
}

function joinRoutePath(prefix, routePath) {
  const segments = [prefix, routePath]
    .filter(Boolean)
    .flatMap((value) => value.split('/'))
    .filter(Boolean)

  return `/${segments.join('/')}`
}

function toOperationId(group, handler) {
  if (!handler) {
    return undefined
  }

  if (!group) {
    return handler
  }

  return `${group}${handler[0].toUpperCase()}${handler.slice(1)}`
}

function parseServerRoutes(source) {
  const lines = stripComments(normalizeSource(source)).split('\n')
  const routes = []

  let inServerAnnotation = false
  let inServiceBlock = false
  let pendingHandler = null
  let pendingGroup = ''
  let pendingPrefix = ''
  let currentGroup = ''
  let currentPrefix = ''

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    if (!inServiceBlock && line === '@server (') {
      inServerAnnotation = true
      pendingGroup = ''
      pendingPrefix = ''
      continue
    }

    if (inServerAnnotation) {
      if (line === ')') {
        inServerAnnotation = false
        continue
      }

      const prefixMatch = line.match(/^prefix:\s*(\S+)$/)
      if (prefixMatch) {
        pendingPrefix = prefixMatch[1]
        continue
      }

      const groupMatch = line.match(/^group:\s*(\S+)$/)
      if (groupMatch) {
        pendingGroup = groupMatch[1]
      }
      continue
    }

    if (!inServiceBlock) {
      if (line.startsWith('service ')) {
        inServiceBlock = true
        currentGroup = pendingGroup
        currentPrefix = pendingPrefix
        pendingHandler = null
      }
      continue
    }

    if (line === '}') {
      inServiceBlock = false
      pendingHandler = null
      currentGroup = ''
      currentPrefix = ''
      continue
    }

    const handlerMatch = line.match(/^@handler\s+([A-Za-z_][A-Za-z0-9_]*)$/)
    if (handlerMatch) {
      pendingHandler = handlerMatch[1]
      continue
    }

    const routeMatch = line.match(/^([a-z]+)\s+(\S+)\s+\(([^)]+)\)\s+returns\s+\(([^)]+)\)$/i)
    if (!routeMatch) {
      continue
    }

    const [, method, routePath, requestType, responseType] = routeMatch
    if (!SWAGGER_METHODS.has(method.toLowerCase())) {
      continue
    }

    routes.push({
      method: method.toUpperCase(),
      operationId: toOperationId(currentGroup, pendingHandler),
      path: joinRoutePath(currentPrefix, routePath),
      requestType,
      responseType,
    })
  }

  return routes
}

function getSuccessSchema(operation) {
  const successResponse = operation?.responses?.[200] ?? operation?.responses?.['200']
  return successResponse?.schema
}

function normalizeValue(value, seen = new Map()) {
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return `__cycle:${seen.get(value)}`
    }

    const cycleId = seen.size
    seen.set(value, cycleId)
    return value.map((item) => normalizeValue(item, seen))
  }

  if (!isPlainObject(value)) {
    return value
  }

  if (seen.has(value)) {
    return `__cycle:${seen.get(value)}`
  }

  const cycleId = seen.size
  seen.set(value, cycleId)

  const normalized = {}
  for (const key of Object.keys(value).sort()) {
    const nextValue = normalizeValue(value[key], seen)
    normalized[key] = key === 'required' && Array.isArray(nextValue) ? [...nextValue].sort() : nextValue
  }

  return normalized
}

function listSuccessOperations(swaggerDoc) {
  const operations = []

  for (const [routePath, pathItem] of Object.entries(swaggerDoc.paths ?? {})) {
    if (!isPlainObject(pathItem)) {
      continue
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!SWAGGER_METHODS.has(method) || !isPlainObject(operation)) {
        continue
      }

      if (!getSuccessSchema(operation)) {
        continue
      }

      operations.push({
        method: method.toUpperCase(),
        operation,
        routePath,
      })
    }
  }

  return operations
}

function verifySwaggerStructure({ original, rewritten }) {
  let namedResponses = 0
  let verifiedResponses = 0

  for (const { method, operation, routePath } of listSuccessOperations(original)) {
    const originalSchema = getSuccessSchema(operation)
    const rewrittenOperation = rewritten.paths?.[routePath]?.[method.toLowerCase()]
    const rewrittenSchema = getSuccessSchema(rewrittenOperation)

    if (!originalSchema || !rewrittenSchema) {
      throw new Error(`Missing success schema while verifying ${method} ${routePath}`)
    }

    if (rewrittenSchema.$ref) {
      namedResponses += 1
    }

    const normalizedOriginal = normalizeValue(
      dereferenceSchema({
        root: original,
        schema: originalSchema,
      }),
    )
    const normalizedRewritten = normalizeValue(
      dereferenceSchema({
        root: rewritten,
        schema: rewrittenSchema,
      }),
    )

    if (JSON.stringify(normalizedOriginal) !== JSON.stringify(normalizedRewritten)) {
      throw new Error(`Structural verification failed for ${method} ${routePath}`)
    }

    verifiedResponses += 1
  }

  return {
    namedResponses,
    verifiedResponses,
  }
}

function toWorktreeRelativePath(targetPath) {
  return path.relative(process.cwd(), targetPath) || '.'
}

async function main() {
  const paths = resolveProjectPaths()
  const [jobApiSource, swaggerSource] = await Promise.all([
    readFile(paths.jobApiPath, 'utf8'),
    readFile(paths.swaggerPath, 'utf8'),
  ])

  const parsedTypes = parseJobApi(jobApiSource)
  const parsed = {
    ...parsedTypes,
    routes: parseServerRoutes(jobApiSource),
  }
  const swaggerDoc = JSON.parse(swaggerSource)
  const rewritten = rewriteSwaggerDoc({
    parsed,
    swaggerDoc,
  })
  const verification = verifySwaggerStructure({
    original: swaggerDoc,
    rewritten,
  })

  await writeFile(paths.outputPath, `${JSON.stringify(rewritten, null, 2)}\n`, 'utf8')

  const originalDefinitionCount = Object.keys(swaggerDoc.definitions ?? {}).length
  const rewrittenDefinitionCount = Object.keys(rewritten.definitions ?? {}).length

  console.log([
    'Swagger postprocess complete.',
    `job.api: ${toWorktreeRelativePath(paths.jobApiPath)}`,
    `swagger.json: ${toWorktreeRelativePath(paths.swaggerPath)}`,
    `swagger.named.json: ${toWorktreeRelativePath(paths.outputPath)}`,
    `parsed routes: ${parsed.routes.length}`,
    `verified success responses: ${verification.verifiedResponses}`,
    `named success responses: ${verification.namedResponses}`,
    `definitions: ${originalDefinitionCount} -> ${rewrittenDefinitionCount}`,
  ].join('\n'))
}

main().catch((error) => {
  console.error(`Swagger postprocess failed: ${error.message}`)
  if (error.stack) {
    console.error(error.stack)
  }
  process.exitCode = 1
})
