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

test('dereferenceSchema preserves shared and recursive reference identity', () => {
  const root = {
    definitions: {
      Node: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          next: { $ref: '#/definitions/Node' },
        },
      },
      Pair: {
        type: 'object',
        properties: {
          left: { $ref: '#/definitions/Node' },
          right: { $ref: '#/definitions/Node' },
        },
      },
    },
  }

  const pair = dereferenceSchema({
    root,
    schema: { $ref: '#/definitions/Pair' },
  })

  assert.equal(pair.properties.left, pair.properties.right)
  assert.equal(pair.properties.left.properties.next, pair.properties.left)
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
    },
    routes: [
      {
        operationId: 'prefer-operation-id',
        method: 'POST',
        path: '/api/other-path',
        responseType: 'OperationMatchedResp',
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

test('rewriteSwaggerDoc only rewrites responses.200.schema', () => {
  const parsed = {
    typesByName: {
      OnlySuccessResp: {
        name: 'OnlySuccessResp',
        fields: [],
        fieldsByName: {},
        data: { kind: 'none' },
      },
    },
    routes: [
      {
        operationId: 'only-success',
        method: 'GET',
        path: '/api/only-success',
        responseType: 'OnlySuccessResp',
      },
    ],
  }

  const swaggerDoc = {
    swagger: '2.0',
    paths: {
      '/api/only-success': {
        get: {
          operationId: 'only-success',
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
            400: {
              description: '',
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  msg: { type: 'string' },
                  detail: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }

  const badRequestBefore = structuredClone(swaggerDoc.paths['/api/only-success'].get.responses[400].schema)
  const rewritten = rewriteSwaggerDoc({ parsed, swaggerDoc })

  assert.equal(
    rewritten.paths['/api/only-success'].get.responses[200].schema.$ref,
    '#/definitions/OnlySuccessResp',
  )
  assert.deepEqual(rewritten.paths['/api/only-success'].get.responses[400].schema, badRequestBefore)
})

test('rewriteSwaggerDoc throws when a parsed route cannot be matched to a swagger operation', () => {
  const parsed = {
    typesByName: {
      UnmatchedResp: {
        name: 'UnmatchedResp',
        fields: [],
        fieldsByName: {},
        data: { kind: 'none' },
      },
    },
    routes: [
      {
        operationId: 'missing-operation',
        method: 'GET',
        path: '/api/missing-operation',
        responseType: 'UnmatchedResp',
      },
    ],
  }

  const swaggerDoc = {
    swagger: '2.0',
    paths: {
      '/api/other-operation': {
        get: {
          operationId: 'other-operation',
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

  assert.throws(
    () => rewriteSwaggerDoc({ parsed, swaggerDoc }),
    /missing-operation.*not matched/i,
  )
})

test('rewriteSwaggerDoc throws when a matched operation has no responses.200.schema', () => {
  const parsed = {
    typesByName: {
      MissingSuccessSchemaResp: {
        name: 'MissingSuccessSchemaResp',
        fields: [],
        fieldsByName: {},
        data: { kind: 'none' },
      },
    },
    routes: [
      {
        operationId: 'missing-success-schema',
        method: 'GET',
        path: '/api/missing-success-schema',
        responseType: 'MissingSuccessSchemaResp',
      },
    ],
  }

  const swaggerDoc = {
    swagger: '2.0',
    paths: {
      '/api/missing-success-schema': {
        get: {
          operationId: 'missing-success-schema',
          responses: {
            200: {
              description: '',
            },
            400: {
              description: '',
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
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
    /missing-success-schema.*responses\.200\.schema/i,
  )
})

test('rewriteSwaggerDoc throws when parsed response data shape is incompatible with swagger data', () => {
  const parsed = {
    typesByName: {
      IncompatibleDataResp: {
        name: 'IncompatibleDataResp',
        fields: [],
        fieldsByName: {
          data: { kind: 'ref', typeName: 'Payload' },
        },
        data: { kind: 'ref', typeName: 'Payload' },
      },
      Payload: {
        name: 'Payload',
        fields: [],
        fieldsByName: {},
        data: { kind: 'none' },
      },
    },
    routes: [
      {
        operationId: 'incompatible-data',
        method: 'GET',
        path: '/api/incompatible-data',
        responseType: 'IncompatibleDataResp',
      },
    ],
  }

  const swaggerDoc = {
    swagger: '2.0',
    paths: {
      '/api/incompatible-data': {
        get: {
          operationId: 'incompatible-data',
          responses: {
            200: {
              description: '',
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  msg: { type: 'string' },
                  data: { type: 'array', items: { type: 'object' } },
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
    /IncompatibleDataResp.*data.*incompatible/i,
  )
})
