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

  const before = original.paths['/api/company/list'].get.responses['200'].schema
  const after = dereferenceSchema({
    root: rewritten,
    schema: rewritten.paths['/api/company/list'].get.responses['200'].schema,
  })

  assert.deepEqual(after, before)
})
