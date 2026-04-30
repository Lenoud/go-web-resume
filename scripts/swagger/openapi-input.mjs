import { readFileSync } from 'node:fs'

export function normalizeSwaggerForClient(value) {
  if (Array.isArray(value)) {
    value.forEach(normalizeSwaggerForClient)
    return value
  }

  if (value && typeof value === 'object') {
    if (value.type === 'integer' && value.format === 'int64') {
      delete value.format
    }

    Object.values(value).forEach(normalizeSwaggerForClient)
  }

  return value
}

export function readSwaggerForClient(swaggerPath) {
  return normalizeSwaggerForClient(JSON.parse(readFileSync(swaggerPath, 'utf8')))
}
