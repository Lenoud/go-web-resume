import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { parseJobApi } from './parse-job-api.mjs'
import { resolveSwaggerProjectPaths } from './project-paths.mjs'
import { dereferenceSchema, rewriteSwaggerDoc } from './rewrite-swagger.mjs'

const SWAGGER_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'head', 'options'])

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function resolveProjectPaths() {
  return resolveSwaggerProjectPaths(import.meta.url)
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

  const parsed = parseJobApi(jobApiSource)
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
