import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeSwaggerForClient } from '../openapi-input.mjs'

test('normalizeSwaggerForClient keeps integer schemas as number-compatible OpenAPI integers', () => {
  const swagger = {
    definitions: {
      JobInfo: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          status: {
            type: 'integer',
            format: 'int32',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
    paths: {
      '/job/list': {
        get: {
          parameters: [
            {
              name: 'page',
              in: 'query',
              type: 'integer',
              format: 'int64',
            },
          ],
        },
      },
    },
  }

  const normalized = normalizeSwaggerForClient(swagger)

  assert.equal(normalized.definitions.JobInfo.properties.id.format, undefined)
  assert.equal(normalized.definitions.JobInfo.properties.status.format, 'int32')
  assert.equal(normalized.definitions.JobInfo.properties.createdAt.format, 'date-time')
  assert.equal(normalized.paths['/job/list'].get.parameters[0].format, undefined)
})
