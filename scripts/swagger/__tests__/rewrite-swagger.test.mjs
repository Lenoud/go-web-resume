import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { parseJobApi } from '../parse-job-api.mjs'
import { rewriteSwaggerDoc, dereferenceSchema } from '../rewrite-swagger.mjs'

const apiFixture = new URL('../__fixtures__/job.api.fixture', import.meta.url)
const swaggerFixture = new URL('../__fixtures__/swagger.fixture.json', import.meta.url)

test('rewriteSwaggerDoc hoists response schemas bottom-up and preserves structure', async () => {
  const [apiSource, swaggerSource] = await Promise.all([
    readFile(apiFixture, 'utf8'),
    readFile(swaggerFixture, 'utf8'),
  ])

  const parsed = parseJobApi(apiSource)
  const original = JSON.parse(swaggerSource)
  const before = structuredClone(original.paths['/api/company/list'].get.responses['200'].schema)
  const rewritten = rewriteSwaggerDoc({
    parsed,
    swaggerDoc: original,
  })

  assert.ok(rewritten.definitions.CompanyInfo)
  assert.ok(rewritten.definitions.CompanyListData)
  assert.ok(rewritten.definitions.CompanyListResp)
  assert.equal(
    rewritten.paths['/api/company/list'].get.responses['200'].schema.$ref,
    '#/definitions/CompanyListResp',
  )

  const after = dereferenceSchema({
    root: rewritten,
    schema: rewritten.paths['/api/company/list'].get.responses['200'].schema,
  })

  assert.deepEqual(after, before)
})

test('rewriteSwaggerDoc hoists base-only responses and matches operationId before method+path fallback', () => {
  const swaggerDoc = {
    swagger: '2.0',
    paths: {
      '/api/match-precedence': {
        post: {
          operationId: 'prefer-operation-id',
          responses: {
            200: {
              description: '',
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  msg: { type: 'string' },
                },
              },
            },
          },
        },
      },
      '/api/match-fallback': {
        get: {
          operationId: 'no-parser-operation-id',
          responses: {
            200: {
              description: '',
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  msg: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }

  const parsed = {
    typesByName: {
      OperationMatchedResp: {
        name: 'OperationMatchedResp',
        fields: [],
        fieldsByName: {},
        data: { kind: 'none' },
      },
      FallbackMatchedResp: {
        name: 'FallbackMatchedResp',
        fields: [],
        fieldsByName: {},
        data: { kind: 'none' },
      },
      WrongFallbackResp: {
        name: 'WrongFallbackResp',
        fields: [],
        fieldsByName: {},
        data: { kind: 'none' },
      },
    },
    routes: [
      {
        operationId: 'prefer-operation-id',
        method: 'POST',
        path: '/api/other-path',
        responseType: 'OperationMatchedResp',
      },
      {
        method: 'POST',
        path: '/api/match-precedence',
        responseType: 'WrongFallbackResp',
      },
      {
        method: 'GET',
        path: '/api/match-fallback',
        responseType: 'FallbackMatchedResp',
      },
    ],
  }

  const precedenceBefore = structuredClone(swaggerDoc.paths['/api/match-precedence'].post.responses[200].schema)
  const fallbackBefore = structuredClone(swaggerDoc.paths['/api/match-fallback'].get.responses[200].schema)
  const rewritten = rewriteSwaggerDoc({ parsed, swaggerDoc })

  assert.equal(
    rewritten.paths['/api/match-precedence'].post.responses[200].schema.$ref,
    '#/definitions/OperationMatchedResp',
  )
  assert.equal(
    rewritten.paths['/api/match-fallback'].get.responses[200].schema.$ref,
    '#/definitions/FallbackMatchedResp',
  )
  assert.equal(rewritten.definitions.WrongFallbackResp, undefined)
  assert.deepEqual(
    dereferenceSchema({
      root: rewritten,
      schema: rewritten.paths['/api/match-precedence'].post.responses[200].schema,
    }),
    precedenceBefore,
  )
  assert.deepEqual(
    dereferenceSchema({
      root: rewritten,
      schema: rewritten.paths['/api/match-fallback'].get.responses[200].schema,
    }),
    fallbackBefore,
  )
})

test('rewriteSwaggerDoc throws when the same definition name resolves to different schemas', () => {
  const parsed = {
    typesByName: {
      SharedResp: {
        name: 'SharedResp',
        fields: [],
        fieldsByName: {},
        data: { kind: 'none' },
      },
    },
    routes: [
      {
        operationId: 'shared-one',
        method: 'GET',
        path: '/api/shared-one',
        responseType: 'SharedResp',
      },
      {
        operationId: 'shared-two',
        method: 'GET',
        path: '/api/shared-two',
        responseType: 'SharedResp',
      },
    ],
  }

  const swaggerDoc = {
    swagger: '2.0',
    paths: {
      '/api/shared-one': {
        get: {
          operationId: 'shared-one',
          responses: {
            200: {
              description: '',
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  msg: { type: 'string' },
                },
              },
            },
          },
        },
      },
      '/api/shared-two': {
        get: {
          operationId: 'shared-two',
          responses: {
            200: {
              description: '',
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  msg: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
  }

  assert.throws(
    () => rewriteSwaggerDoc({ parsed, swaggerDoc }),
    /SharedResp.*different schema/i,
  )
})
